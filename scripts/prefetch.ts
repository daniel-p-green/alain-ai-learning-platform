#!/usr/bin/env bun
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';
import YAML from 'yaml';

type ManifestEntry = {
  id: string;
  title: string;
  url: string;
  source_type: 'hf' | 'github' | 'paper' | 'blog' | 'leaderboard' | 'dataset' | 'other';
  author_org?: string;
  published_date?: string;
  accessed_date: string;
  file_paths: string[];
  checksum_sha256: string;
  revision?: string;
  etag?: string;
  last_modified?: string;
  content_length_bytes?: number;
  retrieval_tool?: string;
  download_time_utc?: string;
  notes?: string;
};

export type SpecMetadata = {
  architecture?: string;
  parameters?: string;
  context_window?: string;
  tokenizer?: string;
  license?: string;
  tokenizer_details?: {
    vocab_size?: string;
    special_tokens?: Record<string, string>;
    checksum_sha256?: string;
  };
  license_details?: {
    spdx?: string;
    redistribution?: string;
    finetune?: string;
    attribution?: string;
  };
  versioning?: {
    hf_revision?: string;
    gh_commits?: string[];
    paper_version?: string;
    last_updated?: string;
  };
  inference?: {
    servers?: string[];
    min_hardware?: string;
    quantization?: string[];
    context_length_verified?: string;
    throughput_notes?: string;
  };
  evals?: Array<{
    benchmark: string;
    dataset?: string;
    metric?: string;
    score?: string;
    split?: string;
    source?: string;
  }>;
  primary_repo?: string;
  usage_sections?: string[];
  license_source?: string;
  notes?: string;
  flags?: string[];
  coverage?: {
    filled: number;
    total: number;
    missing: string[];
    score: number;
  };
};

export type UsageAsset = {
  source: 'github' | 'hf' | 'web';
  path: string;
  absPath: string;
  type: 'code' | 'markdown' | 'notebook' | 'text';
};

const repoAliases: Record<string, string> = {
  'openai/gpt-oss-20b': 'openai/gpt-oss',
  'openai/gpt-oss-120b': 'openai/gpt-oss',
  'google/vaultgemma-1b': 'google-deepmind/gemma',
  'facebook/mobilellm-r1-950m': 'facebookresearch/mobile-llm',
  'alibaba-nlp/tongyi-deepresearch-30b-a3b': 'alibaba-nlp/tongyi-deep-research'
};

const repoOwnerDenylist = new Set([
  'google-research-datasets',
  'datasets',
  'paperswithcode',
  'paperswithcode-data',
  'paperswithcode-benchmarks',
  'huggingface-datasets'
]);

const repoCodeSignalFiles = new Set([
  'setup.py',
  'pyproject.toml',
  'package.json',
  'requirements.txt',
  'requirements-dev.txt',
  'dockerfile',
  'makefile'
]);

const repoCodeSignalDirs = new Set([
  'src',
  'code',
  'training',
  'scripts',
  'examples',
  'notebooks',
  'tutorials',
  'cookbook',
  'demo',
  'demos',
  'inference',
  'deploy',
  'deployment'
]);

const repoDocDirs = new Set(['examples', 'example', 'docs', 'documentation', 'notebooks', 'tutorials', 'cookbook']);

const normalizeModelKey = (id: string) => id.toLowerCase();

function sha256(buf: Uint8Array) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

type EvalEntry = NonNullable<SpecMetadata['evals']>[number];

function pickFirstString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const str = pickFirstString(item);
      if (str) return str;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const preferredKeys = ['name', 'title', 'value', 'type', 'id'];
    for (const key of preferredKeys) {
      if (obj[key] !== undefined) {
        const str = pickFirstString(obj[key]);
        if (str) return str;
      }
    }
    for (const val of Object.values(obj)) {
      const str = pickFirstString(val);
      if (str) return str;
    }
  }
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => pickFirstString(item))
      .filter((item): item is string => typeof item === 'string' && item.length > 0);
  }
  const single = pickFirstString(value);
  return single ? [single] : [];
}

function normalizeParamsValue(raw: unknown): string | undefined {
  const str = pickFirstString(raw);
  if (!str) return undefined;
  const cleaned = str.replace(/[,\s]/g, '');
  const unitMatch = cleaned.match(/^(\d+(?:\.\d+)?)([kKmMbB])$/);
  if (unitMatch) {
    const unit = unitMatch[2].toUpperCase();
    return `${unitMatch[1]}${unit}`;
  }
  const numeric = Number(cleaned);
  if (Number.isFinite(numeric) && numeric > 0) {
    return formatNumber(numeric);
  }
  return str.trim();
}

export function parseFrontMatter(text: string): Record<string, any> | null {
  try {
    const parsed = YAML.parse(text);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, any>;
    }
  } catch {}
  const fallback: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
    if (match) {
      fallback[match[1].toLowerCase()] = match[2].trim();
    }
  }
  return Object.keys(fallback).length ? fallback : null;
}

export function harvestFrontMatter(meta: SpecMetadata, front: Record<string, any>) {
  if (!front) return;
  const architecture = pickFirstString(front.architectures ?? front.architecture);
  if (architecture && !meta.architecture) meta.architecture = architecture;
  const params = normalizeParamsValue(front.parameters ?? front.parameter_count ?? front.params);
  if (params && !meta.parameters) meta.parameters = params;
  const ctx = pickFirstString(front.context_window ?? front.context_length ?? front.tokens ?? front.context);
  if (ctx && !meta.context_window) meta.context_window = ctx.replace(/[^0-9]/g, '') || ctx;
  const tokenizer = pickFirstString(front.tokenizer ?? front.tokenizer_class ?? front.tokeniser);
  if (tokenizer && !meta.tokenizer) meta.tokenizer = tokenizer;

  const licenseBlock = front.license ?? front.spdx ?? front.license_id;
  const license = pickFirstString(licenseBlock);
  if (license && !meta.license) {
    meta.license = license;
    meta.license_source = 'README front-matter';
  }
  const licenseDetailsSource = typeof licenseBlock === 'object' && licenseBlock ? licenseBlock : front.license_details;
  if (licenseDetailsSource && typeof licenseDetailsSource === 'object') {
    meta.license_details = meta.license_details || {};
    const licObj = licenseDetailsSource as Record<string, unknown>;
    const spdx = pickFirstString(licObj.spdx ?? licObj.id ?? licObj.identifier);
    if (spdx) meta.license_details.spdx = spdx;
    const redistribution = pickFirstString(licObj.redistribution ?? licObj.usage ?? licObj['redistribution_rights']);
    if (redistribution) meta.license_details.redistribution = redistribution;
    const finetune = pickFirstString(licObj.finetune ?? licObj.finetuning ?? licObj['fine_tune']);
    if (finetune) meta.license_details.finetune = finetune;
    const attribution = pickFirstString(licObj.attribution ?? licObj.notice ?? licObj.citation);
    if (attribution) meta.license_details.attribution = attribution;
  }

  if (front.tokenizer_details && typeof front.tokenizer_details === 'object') {
    meta.tokenizer_details = meta.tokenizer_details || {};
    const tok = front.tokenizer_details as Record<string, unknown>;
    const vocab = pickFirstString(tok.vocab_size ?? tok.size);
    if (vocab) meta.tokenizer_details.vocab_size = vocab;
    if (tok.special_tokens && typeof tok.special_tokens === 'object') {
      const special = tok.special_tokens as Record<string, unknown>;
      const entries: Record<string, string> = {};
      for (const [key, value] of Object.entries(special)) {
        const str = pickFirstString(value);
        if (str) entries[key] = str;
      }
      if (Object.keys(entries).length) meta.tokenizer_details.special_tokens = entries;
    }
  }

  if (front.versioning && typeof front.versioning === 'object') {
    meta.versioning = meta.versioning || {};
    const ver = front.versioning as Record<string, unknown>;
    const rev = pickFirstString(ver.hf_revision ?? ver.revision);
    if (rev) meta.versioning.hf_revision = rev;
    const last = pickFirstString(ver.last_updated ?? ver.updated ?? ver.date);
    if (last) meta.versioning.last_updated = last;
  }

  if (front.inference && typeof front.inference === 'object') {
    meta.inference = meta.inference || {};
    const inf = front.inference as Record<string, unknown>;
    const hardware = pickFirstString(inf.min_hardware ?? inf.hardware);
    if (hardware) meta.inference.min_hardware = hardware;
    const servers = toStringArray(inf.servers ?? inf.endpoints);
    if (servers.length) meta.inference.servers = servers;
    const quant = toStringArray(inf.quantization ?? inf.quantization_modes ?? inf.quantization_methods);
    if (quant.length) meta.inference.quantization = quant;
    const ctxVerified = pickFirstString(inf.context_length_verified ?? inf.context_length ?? inf.ctx_verified);
    if (ctxVerified) meta.inference.context_length_verified = ctxVerified;
    const throughput = pickFirstString(inf.throughput_notes ?? inf.performance ?? inf.latency);
    if (throughput) meta.inference.throughput_notes = throughput;
  }

  if (front.primary_repo && typeof front.primary_repo === 'string' && !meta.primary_repo) {
    meta.primary_repo = front.primary_repo.trim();
  }

  if (Array.isArray(front.evals)) {
    const evals: EvalEntry[] = [];
    for (const entry of front.evals) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      const benchmark = pickFirstString(e.benchmark ?? e.task ?? e.name);
      const dataset = pickFirstString(e.dataset ?? e.dataset_version ?? e.data);
      const metric = pickFirstString(e.metric ?? e.metric_name ?? e.measure);
      const score = pickFirstString(e.score ?? e.value ?? e.result);
      if (benchmark || score) {
        evals.push({
          benchmark: benchmark || 'benchmark',
          dataset: dataset || undefined,
          metric: metric || undefined,
          score: score || undefined,
          split: pickFirstString(e.split ?? e.setting ?? e.mode) || undefined,
          source: 'README front-matter'
        });
      }
    }
    if (evals.length) meta.evals = (meta.evals || []).concat(evals);
  }
}

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim();
  const stripped = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return stripped.split('|').map((cell) => cell.trim());
}

function parseMarkdownTable(lines: string[], start: number) {
  if (!/^\|/.test(lines[start] || '')) return null;
  const headers = splitMarkdownRow(lines[start]);
  if (!headers.length) return null;
  const separator = lines[start + 1] || '';
  if (!/^\|/.test(separator)) return null;
  const rows: string[][] = [];
  let idx = start + 2;
  while (idx < lines.length && /^\|/.test(lines[idx])) {
    rows.push(splitMarkdownRow(lines[idx]));
    idx++;
  }
  if (!rows.length) return null;
  return { headers, rows, end: idx - 1 };
}

function findColumnIndex(headers: string[], pattern: RegExp): number {
  return headers.findIndex((header) => pattern.test(header.toLowerCase()));
}

function parseMarkdownEvalTables(markdown: string, source: string): EvalEntry[] {
  const lines = markdown.split(/\r?\n/);
  const evals: EvalEntry[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\|/.test(lines[i])) continue;
    const table = parseMarkdownTable(lines, i);
    if (!table) continue;
    const lowerHeaders = table.headers.map((h) => h.toLowerCase());
    const benchmarkIdx = findColumnIndex(lowerHeaders, /(benchmark|task|suite|evaluation|eval)/);
    const datasetIdx = findColumnIndex(lowerHeaders, /(dataset|data|corpus|subset)/);
    const metricIdx = findColumnIndex(lowerHeaders, /(metric|measure|score|accuracy|f1|bleu|rouge|rate|exact)/);
    const scoreIdx = findColumnIndex(lowerHeaders, /(score|value|accuracy|f1|bleu|rouge|exact|win|mmlu|arc|avg|mean)/);
    const splitIdx = findColumnIndex(lowerHeaders, /(split|subset|setting|shots?)/);
    if (benchmarkIdx === -1 && scoreIdx === -1) {
      i = table.end;
      continue;
    }
    for (const row of table.rows) {
      const getCell = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].replace(/`/g, '').trim() : undefined);
      const benchmark = getCell(benchmarkIdx) || getCell(datasetIdx) || 'benchmark';
      let metric = metricIdx >= 0 ? getCell(metricIdx) : undefined;
      const metricHeader = metricIdx >= 0 ? table.headers[metricIdx] : undefined;
      let score = scoreIdx >= 0 ? getCell(scoreIdx) : undefined;
      if (!score && metric && /\d/.test(metric) && (!metricHeader || /score|accuracy|f1|rouge|bleu|value|avg/.test(metricHeader.toLowerCase()))) {
        score = metric;
        metric = metricHeader || 'score';
      }
      if (!benchmark && !score) continue;
      evals.push({
        benchmark: benchmark || 'benchmark',
        dataset: datasetIdx >= 0 ? getCell(datasetIdx) || undefined : undefined,
        metric: metric || undefined,
        score: score || undefined,
        split: splitIdx >= 0 ? getCell(splitIdx) || undefined : undefined,
        source
      });
    }
    i = table.end;
  }
  return evals;
}

function parseEvalList(markdown: string, source: string): EvalEntry[] {
  const evals: EvalEntry[] = [];
  const lines = markdown.split(/\r?\n/);
  const bulletRe = /^\s*[-*+]\s*(.+)$/;
  for (const line of lines) {
    const bullet = line.match(bulletRe);
    if (!bullet) continue;
    const content = bullet[1].trim();
    const match = content.match(/^(?:\*\*)?([^:*]+?)(?:\*\*)?(?:\s*\(([^)]+)\))?\s*[:\-]\s*([0-9][0-9.,%+\- ]*)(.*)$/i);
    if (!match) continue;
    const benchmark = match[1].trim();
    const dataset = match[2]?.trim();
    const score = match[3]?.trim();
    const tail = match[4]?.trim();
    let metric: string | undefined;
    if (tail) {
      const tailClean = tail.replace(/^[-–—:\s]+/, '').trim();
      if (tailClean && /[A-Za-z]/.test(tailClean)) metric = tailClean;
    }
    evals.push({
      benchmark: benchmark || 'benchmark',
      dataset: dataset || undefined,
      metric: metric,
      score: score || undefined,
      source
    });
  }
  return evals;
}

const htmlEntityMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' '
};

function decodeHtmlEntities(input: string): string {
  return input.replace(/&[a-zA-Z0-9#]+;/g, (entity) => htmlEntityMap[entity] ?? entity);
}

function parseHtmlEvalTables(html: string, source: string): EvalEntry[] {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  const evals: EvalEntry[] = [];
  for (const table of tables) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    if (rows.length === 0) continue;
    const headers = (rows[0].match(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) || [])
      .map((cell) => decodeHtmlEntities(cell.replace(/<[^>]+>/g, '').trim()).toLowerCase());
    if (!headers.length) continue;
    const benchmarkIdx = findColumnIndex(headers, /(benchmark|task|suite|evaluation|eval)/);
    const datasetIdx = findColumnIndex(headers, /(dataset|data|corpus|subset)/);
    const metricIdx = findColumnIndex(headers, /(metric|measure|score|accuracy|f1|bleu|rouge|value|avg|mean)/);
    const scoreIdx = findColumnIndex(headers, /(score|value|accuracy|f1|bleu|rouge|em|exact|win|rate|avg|mean)/);
    const splitIdx = findColumnIndex(headers, /(split|subset|setting|shots?)/);
    if (benchmarkIdx === -1 && scoreIdx === -1) continue;
    for (let r = 1; r < rows.length; r++) {
      const cells = (rows[r].match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [])
        .map((cell) => decodeHtmlEntities(cell.replace(/<[^>]+>/g, '').trim()));
      const getCell = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx] : undefined);
      const benchmark = getCell(benchmarkIdx) || getCell(datasetIdx) || 'benchmark';
      let metric = metricIdx >= 0 ? getCell(metricIdx) : undefined;
      const metricHeader = metricIdx >= 0 ? headers[metricIdx] : undefined;
      let score = scoreIdx >= 0 ? getCell(scoreIdx) : undefined;
      if (!score && metric && /\d/.test(metric) && (!metricHeader || /score|accuracy|f1|rouge|bleu|value|avg/.test(metricHeader))) {
        score = metric;
        metric = metricHeader || 'score';
      }
      if (!benchmark && !score) continue;
      evals.push({
        benchmark: benchmark || 'benchmark',
        dataset: datasetIdx >= 0 ? getCell(datasetIdx) || undefined : undefined,
        metric: metric || undefined,
        score: score || undefined,
        split: splitIdx >= 0 ? getCell(splitIdx) || undefined : undefined,
        source
      });
    }
  }
  return evals;
}

export function harvestEvalEntriesFromText(text: string, source: string): EvalEntry[] {
  const markdownTables = parseMarkdownEvalTables(text, source);
  const markdownLists = parseEvalList(text, source);
  const htmlTables = /<table/i.test(text) ? parseHtmlEvalTables(text, source) : [];
  return [...markdownTables, ...markdownLists, ...htmlTables];
}

function dedupeEvals(evals: EvalEntry[]): EvalEntry[] {
  const map = new Map<string, EvalEntry>();
  for (const entry of evals) {
    const key = [entry.benchmark || '', entry.dataset || '', entry.metric || '', entry.score || ''].join('|');
    if (!map.has(key)) map.set(key, entry);
  }
  return Array.from(map.values());
}

function slugifyUrl(url: string) {
  return url.replace(/https?:\/\//i, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(-200);
}

function extractCandidateEvalLinks(markdown: string): string[] {
  const links = new Set<string>();
  const linkRe = /\[[^\]]+\]\((https?:[^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(markdown)) !== null) {
    const url = match[1];
    if (!url) continue;
    if (/^https?:\/\//i.test(url)) {
      const lower = url.toLowerCase();
      if (/(\.md|\.markdown|\.mdx|\.rst|\.txt)(?:$|[?#])/.test(lower) || /(\.html?|docs\/|blog|benchmark)/.test(lower)) {
        links.add(url);
      }
    }
  }
  return Array.from(links).slice(0, 10);
}

const coverageChecks = [
  { label: 'architecture', getter: (meta: SpecMetadata) => meta.architecture },
  { label: 'parameters', getter: (meta: SpecMetadata) => meta.parameters },
  { label: 'context window', getter: (meta: SpecMetadata) => meta.context_window },
  { label: 'tokenizer', getter: (meta: SpecMetadata) => meta.tokenizer },
  { label: 'license', getter: (meta: SpecMetadata) => meta.license },
  { label: 'primary repo', getter: (meta: SpecMetadata) => meta.primary_repo },
  { label: 'evals', getter: (meta: SpecMetadata) => (Array.isArray(meta.evals) && meta.evals.length > 0 ? 'ok' : '') },
  { label: 'inference hardware', getter: (meta: SpecMetadata) => meta.inference?.min_hardware },
  { label: 'tokenizer vocab', getter: (meta: SpecMetadata) => meta.tokenizer_details?.vocab_size },
  { label: 'license SPDX', getter: (meta: SpecMetadata) => meta.license_details?.spdx }
] as const;

export function computeCoverage(meta: SpecMetadata): SpecMetadata['coverage'] {
  const missing: string[] = [];
  let filled = 0;
  const isPresent = (value: unknown) => {
    if (!value) return false;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return false;
      if (/^not\s+specified$/i.test(trimmed)) return false;
      if (/unknown/i.test(trimmed) && trimmed.length <= 12) return false;
      return true;
    }
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return true;
    return true;
  };
  for (const check of coverageChecks) {
    if (isPresent(check.getter(meta))) filled += 1;
    else missing.push(check.label);
  }
  const total = coverageChecks.length;
  const score = total ? +(filled / total * 100).toFixed(1) : 0;
  return { filled, total, missing, score };
}

function collectDatasetIds(value: unknown, acc: Set<string>) {
  if (!value) return;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      const normalized = normalizeDatasetId(trimmed);
      if (normalized) acc.add(normalized);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectDatasetIds(v, acc);
    return;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectDatasetIds(v, acc);
    }
  }
}

function findGithubRepoInText(text: string): string | null {
  const regex = /https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:[^\w.-]|$)/i;
  const match = text.match(regex);
  if (!match) return null;
  const owner = match[1];
  let repo = match[2];
  if (!owner || !repo) return null;
  repo = repo.replace(/\.git$/, '').replace(/[.)]+$/, '');
  return `${owner}/${repo}`;
}

function extractUsageSections(readme: string): string[] {
  const sections: string[] = [];
  const lines = readme.split(/\r?\n/);
  let current: string[] = [];
  let capturing = false;
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s*(.+)$/);
    if (heading) {
      const title = heading[1].trim().toLowerCase();
      if (capturing) {
        sections.push(current.join('\n'));
        current = [];
        capturing = false;
      }
      if (/(usage|inference|quickstart|example)/.test(title)) {
        capturing = true;
        current.push(line);
        continue;
      }
    }
    if (capturing) {
      if (/^#{1,6}\s/.test(line)) {
        sections.push(current.join('\n'));
        current = [];
        capturing = false;
      } else {
        current.push(line);
      }
    }
  }
  if (capturing && current.length) sections.push(current.join('\n'));
  return sections.filter((section) => section.trim().length > 0);
}

function formatNumber(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return undefined;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${value}`;
}

function collectGithubRepos(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  const regex = /https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:[\/#?]|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const owner = match[1];
    let repo = match[2] || '';
    repo = repo.replace(/\.git$/, '').replace(/[.)]+$/, '');
    if (owner && repo) found.add(`${owner}/${repo}`);
  }
  return Array.from(found);
}

function collectDatasetLinks(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  const regex = /https?:\/\/huggingface\.co\/datasets\/([\w.-]+\/[\w.-]+|[\w-]+)(?=[\s)"'`]|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const slug = match[1];
    const normalized = normalizeDatasetId(slug);
    if (normalized) found.add(normalized);
  }
  return Array.from(found);
}

function normalizeDatasetId(id: string): string | null {
  if (!id) return null;
  let cleaned = id.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/^huggingface\.co\/datasets\//i, '');
  cleaned = cleaned.split('?')[0].split('#')[0];
  cleaned = cleaned.replace(/\\/g, '/');
  cleaned = cleaned.replace(/[^A-Za-z0-9_\-/]+/g, '-');
  cleaned = cleaned.replace(/-+/g, '-');
  cleaned = cleaned.replace(/^-|-$/g, '');
  if (!cleaned) return null;
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length === 1) return parts[0].toLowerCase();
  return `${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
}

const MAX_USAGE_ASSETS = 20;

function classifyUsageFile(filename: string): UsageAsset['type'] | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.ipynb')) return 'notebook';
  if (lower.endsWith('.py') || lower.endsWith('.sh') || lower.endsWith('.bash')) return 'code';
  if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.rst')) return 'markdown';
  if (lower.endsWith('.txt')) return 'text';
  return null;
}

function shouldCollectGithubFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.ipynb') || lower.endsWith('.py') || lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.rst') || lower.endsWith('.txt') || lower.endsWith('.sh');
}

function shouldCollectHfFile(path: string): boolean {
  const lower = path.toLowerCase();
  if (/\.(bin|pt|safetensors|tar|ckpt|zip|gz|onnx|tflite|pb|h5)$/i.test(lower)) return false;
  if (lower.endsWith('.ipynb') || lower.endsWith('.py') || lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.rst') || lower.endsWith('.txt') || lower.endsWith('.sh')) return true;
  if (/(examples|notebook|tutorial|demo|scripts?)/.test(lower)) return true;
  return false;
}

function toGithubRawUrl(url: string): string {
  if (/https?:\/\/github\.com\/[^\s]+\/blob\//i.test(url)) {
    return url.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/');
  }
  return url;
}

function limitText(text: string, maxChars = 2000) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated]`;
}

function buildHfResolveUrl(modelId: string, filePath: string) {
  const safePath = filePath.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `https://huggingface.co/${modelId}/resolve/main/${safePath}`;
}

const parameterHeuristics: Array<{ regex: RegExp; value: string }> = [
  { regex: /t5-base|t5-v1_1-base|flan-t5-base/, value: '220M' },
  { regex: /t5-small|t5-v1_1-small|flan-t5-small/, value: '60M' },
  { regex: /t5-large|t5-v1_1-large|flan-t5-large/, value: '770M' },
  { regex: /t5-3b|t5-v1_1-3b/, value: '3B' },
  { regex: /t5-11b|t5-v1_1-11b/, value: '11B' },
  { regex: /mt5-small/, value: '300M' },
  { regex: /codet5p-220m/, value: '220M' }
];

const licenseSpdxMap: Record<string, string> = {
  'apache-2.0': 'Apache-2.0',
  'apache 2.0': 'Apache-2.0',
  'apache license 2.0': 'Apache-2.0',
  'apache license, version 2.0': 'Apache-2.0',
  'bsd-3-clause': 'BSD-3-Clause',
  'bsd 3-clause': 'BSD-3-Clause',
  'bsd 3 clause': 'BSD-3-Clause',
  'mit': 'MIT',
  'cc-by-4.0': 'CC-BY-4.0',
  'cc-by-sa-4.0': 'CC-BY-SA-4.0'
};

function applyMetadataHeuristics(modelId: string, metadata: SpecMetadata) {
  const lowerId = modelId.toLowerCase();
  if (!metadata.parameters || metadata.parameters === 'Not specified') {
    const match = parameterHeuristics.find(({ regex }) => regex.test(lowerId));
    if (match) metadata.parameters = match.value;
  }

  if (metadata.license) {
    const key = metadata.license.toLowerCase().trim();
    const mapped = licenseSpdxMap[key];
    if (mapped) {
      metadata.license = mapped;
      metadata.license_details = metadata.license_details || {};
      if (!metadata.license_details.spdx) metadata.license_details.spdx = mapped;
    }
  } else if (/t5|mt5|flan-t5/.test(lowerId)) {
    metadata.license = 'Apache-2.0';
    metadata.license_details = metadata.license_details || {};
    metadata.license_details.spdx = 'Apache-2.0';
    metadata.license_source = metadata.license_source || 'heuristic';
  }

  if (!metadata.license_details?.spdx && metadata.license) {
    const mapped = licenseSpdxMap[metadata.license.toLowerCase()];
    if (mapped) {
      metadata.license_details = metadata.license_details || {};
      metadata.license_details.spdx = mapped;
    }
  }
}

// --- Lightweight web search (DuckDuckGo HTML) to capture more original docs/blogs ---
async function webSearch(query: string, limit = 6): Promise<string[]> {
  const q = encodeURIComponent(query);
  // DuckDuckGo HTML results page (no JS) — best-effort parsing
  const url = `https://duckduckgo.com/html/?q=${q}`;
  try {
    const { res, text } = await fetchText(url);
    if (!res.ok || !text) return [];
    const links = new Set<string>();
    const re = /<a[^>]+class=\"result__a\"[^>]+href=\"(https?:[^\"#]+)\"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const link = m[1];
      if (!link) continue;
      // Prefer reputable doc sources
      const lower = link.toLowerCase();
      if (
        /huggingface\.co\//.test(lower) || /github\.com\//.test(lower) || /arxiv\.org\//.test(lower) ||
        /medium\.com\//.test(lower) || /docs\./.test(lower) || /blog\./.test(lower) || /readthedocs\.io\//.test(lower)
      ) {
        links.add(link);
      }
      if (links.size >= limit) break;
    }
    return Array.from(links);
  } catch { return []; }
}

function findCompactParamsInText(text: string): string | undefined {
  if (!text) return undefined;
  // Patterns like "220M parameters", "1.1B params", "(770M)"
  const p1 = text.match(/\b(\d{2,4})(?:\s*[,\.](\d{1,3}))?\s*(K|M|B)\s*(?:parameters|params)\b/i);
  if (p1) {
    const whole = p1[1];
    const frac = p1[2] ? `.${p1[2]}` : '';
    const unit = p1[3].toUpperCase();
    return `${whole}${frac}${unit}`.replace(/\.0$/, '');
  }
  const p2 = text.match(/\b(\d+(?:\.\d+)?)\s*(B|M|K)\b\s*(?:parameters|params)\b/i);
  if (p2) return `${p2[1]}${p2[2].toUpperCase()}`;
  // Parenthetical shorthand e.g., "T5-Large (770M)"
  const p3 = text.match(/\((\d+(?:\.\d+)?)([BMKbmK])\)/);
  if (p3) return `${p3[1]}${p3[2].toUpperCase()}`;
  // Long form: "770 million parameters"/"13 billion parameters"
  const p4 = text.match(/\b(\d+(?:\.\d+)?)\s*(billion|million|thousand)\s*parameters?\b/i);
  if (p4) {
    const n = Number(p4[1]);
    const unit = p4[2].toLowerCase();
    const mult = unit.startsWith('b') ? 1_000_000_000 : unit.startsWith('m') ? 1_000_000 : 1_000;
    return formatNumber(Math.round(n * mult));
  }
  return undefined;
}

function findContextTokensInText(text: string): string | undefined {
  const m = text.match(/\b(\d{3,6})\s*(?:tokens?|context\s*(?:window|length)|ctx)\b/i);
  return m ? m[1] : undefined;
}

function findTokenizerTypeInText(text: string): string | undefined {
  const m = text.match(/\b(sentencepiece|bpe|wordpiece|unigram)\b/i);
  return m ? m[1] : undefined;
}

function findLicenseNameInText(text: string): string | undefined {
  const m = text.match(/\blicense\b[\s:]*([A-Za-z0-9\-+\. ]{3,40})/i);
  return m ? m[1].trim() : undefined;
}

function harvestCoreFactsFromText(meta: SpecMetadata, text: string) {
  if (!text) return;
  if (!meta.parameters) {
    const p = findCompactParamsInText(text);
    if (p) meta.parameters = p;
  }
  if (!meta.context_window) {
    const c = findContextTokensInText(text);
    if (c) meta.context_window = c;
  }
  if (!meta.tokenizer) {
    const t = findTokenizerTypeInText(text);
    if (t) meta.tokenizer = t;
  }
  if (!meta.license) {
    const l = findLicenseNameInText(text);
    if (l) { meta.license = l; meta.license_source = meta.license_source || 'web'; }
  }
}

function extractMetadata(paths: { configPath: string; readmePath: string; tokenizerPath: string; generationConfigPath: string }, hfData?: any): SpecMetadata {
  const meta: SpecMetadata = {};
  let config: any = null;
  let readme = '';
  try {
    readme = readFileSync(paths.readmePath, 'utf8');
  } catch {}
  // Parse front-matter YAML if present at top of README
  if (readme) {
    const fm = readme.match(/^---\n([\s\S]*?)\n---/);
    if (fm && fm[1]) {
      const front = parseFrontMatter(fm[1]);
      if (front) harvestFrontMatter(meta, front);
    }
  }
  if (existsSync(paths.configPath)) {
    try {
      config = JSON.parse(readFileSync(paths.configPath, 'utf8'));
    } catch {}
  }
  if (config) {
    meta.architecture = config.architectures?.[0] || config.model_type || meta.architecture;
    const paramCandidate = config.num_params || config.model_size || config.params || config.parameter_count;
    if (paramCandidate) meta.parameters = typeof paramCandidate === 'number' ? formatNumber(paramCandidate) : String(paramCandidate);
    const contextCandidate = config.max_position_embeddings || config.n_positions || config.seq_length || config.context_length;
    if (contextCandidate) meta.context_window = String(contextCandidate);
    if (config.context_window) meta.context_window = String(config.context_window);
    meta.tokenizer = config.tokenizer_class || config.tokenizer || meta.tokenizer;
    if (config.tokenizer_name) meta.tokenizer = config.tokenizer_name;
    meta.license = config.license || meta.license;
    const vocabCandidate = config.vocab_size || config.model?.vocab_size;
    if (!meta.tokenizer_details) meta.tokenizer_details = {};
    if (vocabCandidate) meta.tokenizer_details.vocab_size = String(vocabCandidate);
    if (config.special_tokens_map) {
      meta.tokenizer_details.special_tokens = config.special_tokens_map;
    }
    meta.versioning = meta.versioning || {};
    if (config.revision) meta.versioning.hf_revision = config.revision;
    if (config.last_modified) meta.versioning.last_updated = config.last_modified;
    meta.inference = meta.inference || {};
    if (config.min_hardware) meta.inference.min_hardware = String(config.min_hardware);
    if (config.quantization_config) {
      const keys = Object.keys(config.quantization_config).map((k) => `${k}:${config.quantization_config[k]}`);
      if (keys.length) meta.inference.quantization = keys;
    }
    if (config.context_length_verified) meta.inference.context_length_verified = String(config.context_length_verified);
    if (config.throughput_notes) meta.inference.throughput_notes = String(config.throughput_notes);
    if (config.servers) meta.inference.servers = Array.isArray(config.servers) ? config.servers : [String(config.servers)];
  }
  if (hfData) {
    const card = hfData.cardData || ({} as any);
    if (!meta.architecture && Array.isArray(card.architectures) && card.architectures.length) meta.architecture = card.architectures[0];
    if (!meta.parameters && (card.parameters || card.parameter_count)) meta.parameters = formatNumber(card.parameters || card.parameter_count) || String(card.parameters || card.parameter_count);
    if (!meta.context_window && (card.context_length || card.context_window)) meta.context_window = String(card.context_length || card.context_window);
    if (!meta.tokenizer && card.tokenizer) meta.tokenizer = String(card.tokenizer);
    if (!meta.license && (card.license || hfData.license)) {
      meta.license = String(card.license || hfData.license);
      meta.license_source = meta.license_source || 'HF API';
    }
    if (!meta.inference?.servers && Array.isArray(card.servers) && card.servers.length) {
      meta.inference = meta.inference || {};
      meta.inference.servers = card.servers.map((s: any) => String(s));
    }
    if (Array.isArray(card.model_index)) {
      const evals: SpecMetadata['evals'] = [];
      for (const block of card.model_index) {
        const results = Array.isArray(block.results) ? block.results : [];
        for (const result of results) {
          const metricName = result.metric?.type || result.metric?.name || result.metric?.value || result.metric;
          const scoreValue = result.metric?.value ?? result.result?.score ?? result.score ?? result.metric_value;
          const datasetName = result.dataset?.name || result.dataset;
          evals.push({
            benchmark: block.name || block.task || 'benchmark',
            dataset: datasetName ? String(datasetName) : undefined,
            metric: metricName ? String(metricName) : undefined,
            score: scoreValue !== undefined ? String(scoreValue) : undefined,
            split: result.dataset?.type || result.dataset?.split || result.task?.type,
            source: block.name || 'model-index'
          });
        }
      }
      if (evals.length) meta.evals = evals;
    }
    if (!meta.primary_repo && typeof card.github_repo === 'string') meta.primary_repo = card.github_repo;
  }
  if (existsSync(paths.tokenizerPath)) {
    try {
      const tok = JSON.parse(readFileSync(paths.tokenizerPath, 'utf8'));
      if (!meta.tokenizer_details) meta.tokenizer_details = {};
      if (!meta.tokenizer_details.vocab_size && typeof tok.model?.vocabSize === 'number') {
        meta.tokenizer_details.vocab_size = String(tok.model.vocabSize);
      }
      if (!meta.tokenizer_details.special_tokens && tok.special_tokens) {
        meta.tokenizer_details.special_tokens = Object.fromEntries(Object.entries(tok.special_tokens).map(([k, v]: any) => [k, Array.isArray(v) ? v.join(', ') : String(v?.content ?? v)]));
      }
    } catch {}
  }
  if (readme) {
    if (!meta.parameters) {
      const paramMatch = readme.match(/([0-9]+(?:\.[0-9]+)?)\s*(B|M|K)\s+parameters/i);
      if (paramMatch) meta.parameters = `${paramMatch[1]}${paramMatch[2].toUpperCase()}`;
      else {
        const alt = readme.match(/parameters?\s*[:=]\s*([0-9]+)\s*(?:billion|million|thousand|b|m|k)/i);
        if (alt) meta.parameters = `${alt[1]}${alt[0].toLowerCase().includes('b') ? 'B' : alt[0].toLowerCase().includes('m') ? 'M' : 'K'}`;
      }
    }
    if (!meta.context_window) {
      const ctxMatch = readme.match(/(\d{3,6})\s*(tokens?|context\s*window|ctx)/i);
      if (ctxMatch) meta.context_window = ctxMatch[1];
      else {
        const ctxAlt = readme.match(/ctx\s*[:=]\s*(\d{3,6})/i);
        if (ctxAlt) meta.context_window = ctxAlt[1];
      }
    }
    if (!meta.license) {
      const licenseMatch = readme.match(/license[:\s]*([A-Za-z0-9\-+\. ]{3,40})/i);
      if (licenseMatch) {
        meta.license = licenseMatch[1].trim();
        meta.license_source = 'README';
      }
    } else {
      meta.license_source = meta.license_source || 'config';
    }
    if (!meta.tokenizer) {
      const tokMatch = readme.match(/(sentencepiece|bpe|wordpiece|unigram)\b/i);
      if (tokMatch) meta.tokenizer = tokMatch[1];
    }
    const usage = extractUsageSections(readme);
    if (usage.length) meta.usage_sections = usage;
    const evals = harvestEvalEntriesFromText(readme, 'README');
    if (evals.length) meta.evals = dedupeEvals((meta.evals || []).concat(evals));
  }
  return meta;
}

async function fetchText(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  return { res, text };
}
async function fetchBuf(url: string) {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return { res, buf: new Uint8Array(ab) };
}

export async function prefetch(modelId: string, outDir: string) {
  const now = new Date().toISOString();
  const slug = modelId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const base = join(outDir, `research-${slug}`);
  const slugTokens = slug.split('-').filter(Boolean);
  const sourcesBase = join(base, 'sources');
  const hfBase = join(sourcesBase, 'huggingface');
  const githubBase = join(sourcesBase, 'github');
  const papersBase = join(sourcesBase, 'papers');
  const leaderboardBase = join(sourcesBase, 'leaderboards');
  const datasetsBase = join(sourcesBase, 'datasets');
  const webBase = join(sourcesBase, 'web');
  mkdirSync(hfBase, { recursive: true });
  mkdirSync(githubBase, { recursive: true });
  mkdirSync(papersBase, { recursive: true });
  mkdirSync(leaderboardBase, { recursive: true });
  mkdirSync(datasetsBase, { recursive: true });
  mkdirSync(webBase, { recursive: true });

  const manifestPath = join(sourcesBase, 'manifest.jsonl');
  const manifest: ManifestEntry[] = [];
  const datasetSummaries: { id: string; api: boolean; readme: boolean }[] = [];
  const datasetIds = new Set<string>();
  const usageAssets: UsageAsset[] = [];
  const externalEvalEntries: EvalEntry[] = [];
  let hasGithubRelease = false;
  let primaryGithubRepo: string | undefined;
  let primaryGithubRepoScore = -Infinity;
  let fallbackGithubRepo: string | undefined;
  let hfReadmeText = '';
  let hfModelData: any = null;
  const capturedGithubRepos = new Set<string>();
  const harvestedGithubDirs = new Set<string>();
  const writeManifest = () => {
    const lines = manifest.map((m) => JSON.stringify(m));
    mkdirSync(sourcesBase, { recursive: true });
    writeFileSync(manifestPath, lines.join('\n'));
  };

  // Try HF endpoints
  const hfApi = `https://huggingface.co/api/models/${modelId}`;
  let hfRevision = 'main';
  try {
    const { res, text } = await fetchText(hfApi);
    if (res.ok) {
      const data = JSON.parse(text);
      hfModelData = data;
      hfRevision = data.sha || data.lastModified || 'main';
      const apiBuf = new TextEncoder().encode(text);
      const apiName = 'model.json';
      const apiPath = join(hfBase, apiName);
      writeFileSync(apiPath, text);
      manifest.push({
        id: `${modelId}#api`,
        title: `${modelId} (HF API)`,
        url: hfApi,
        source_type: 'hf',
        accessed_date: now,
        file_paths: [`sources/huggingface/${apiName}`],
        checksum_sha256: sha256(apiBuf),
        revision: hfRevision,
        retrieval_tool: 'http',
        download_time_utc: now
      });
      collectDatasetIds(data?.cardData?.datasets, datasetIds);
      collectDatasetIds(data?.cardData?.dataset, datasetIds);
      collectDatasetIds(data?.cardData?.dataset_name, datasetIds);
      if (Array.isArray(data?.tags)) {
        for (const tag of data.tags) {
          if (typeof tag === 'string' && tag.startsWith('dataset:')) {
            const ds = tag.slice('dataset:'.length).trim();
            if (ds) datasetIds.add(ds);
          }
        }
      }
      if (Array.isArray(data?.cardData?.model_index)) {
        for (const block of data.cardData.model_index) {
          if (Array.isArray(block?.results)) {
            for (const result of block.results) {
              collectDatasetIds(result?.dataset?.name, datasetIds);
            }
          }
        }
      }
    }
  } catch {}

  const hfSiblings = Array.isArray(hfModelData?.siblings) ? hfModelData.siblings : [];
  if (hfSiblings.length && usageAssets.length < MAX_USAGE_ASSETS) {
    for (const sibling of hfSiblings) {
      if (usageAssets.length >= MAX_USAGE_ASSETS) break;
      const filename = typeof sibling === 'string' ? sibling : (sibling?.rfilename || sibling?.path || '');
      if (!filename) continue;
      if (!shouldCollectHfFile(filename)) continue;
      if (/README\.md$/i.test(filename) || /config\.json$/i.test(filename) || /tokenizer\.(json|model)$/i.test(filename)) continue;
      const size = Number(sibling?.size || 0);
      if (Number.isFinite(size) && size > 1_000_000) continue;
      const resolveUrl = buildHfResolveUrl(modelId, filename);
      try {
        const { res, buf } = await fetchBuf(resolveUrl);
        if (!res.ok) continue;
        const destPath = join(hfBase, ...filename.split('/'));
        mkdirSync(dirname(destPath), { recursive: true });
        writeFileSync(destPath, buf);
        manifest.push({
          id: `${modelId}#${filename}`,
          title: filename,
          url: `https://huggingface.co/${modelId}/blob/main/${filename}`,
          source_type: 'hf',
          accessed_date: now,
          file_paths: [`sources/huggingface/${filename}`],
          checksum_sha256: sha256(buf),
          revision: hfRevision,
          retrieval_tool: 'http',
          download_time_utc: now,
          etag: res.headers.get('etag') || undefined,
          last_modified: res.headers.get('last-modified') || undefined,
          content_length_bytes: Number(res.headers.get('content-length') || buf.byteLength)
        });
        const fileType = classifyUsageFile(filename);
        if (fileType && usageAssets.length < MAX_USAGE_ASSETS) {
          usageAssets.push({
            source: 'hf',
            path: `hf/${filename}`,
            absPath: destPath,
            type: fileType
          });
        }
      } catch {}
    }
  }

  const downloadGithubDirReadme = async (owner: string, repo: string, dirPath: string) => {
    try {
      const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`);
      if (!contentsRes.ok) return;
      const listing = await contentsRes.json();
      const files = Array.isArray(listing) ? listing : [];
      const markdown = files.filter((entry: any) => entry.type === 'file' && /\.(md|markdown|rst|txt)$/i.test(entry.name));
      if (!markdown.length) return;
      const preferred = markdown.find((entry: any) => /^readme\./i.test(entry.name)) || markdown[0];
      const rawUrl = preferred.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/main/${preferred.path}`;
      const { res, text } = await fetchText(rawUrl);
      if (!res.ok) return;
      const safeName = `${dirPath.replace(/\//g, '_')}-${preferred.name}`;
      writeFileSync(join(githubBase, safeName), text);
      manifest.push({
        id: `${owner}/${repo}#${preferred.path}`,
        title: `${preferred.name} (${owner}/${repo}/${dirPath})`,
        url: rawUrl,
        source_type: 'github',
        accessed_date: now,
        file_paths: [`sources/github/${safeName}`],
        checksum_sha256: sha256(new TextEncoder().encode(text)),
        retrieval_tool: 'http',
        download_time_utc: now
      });
    } catch {}
  };

  const downloadGithubDirAssets = async (owner: string, repo: string, dirPath: string, depth = 0) => {
    const key = `${owner}/${repo}/${dirPath}`.toLowerCase();
    if (harvestedGithubDirs.has(key)) return;
    harvestedGithubDirs.add(key);
    if (usageAssets.length >= MAX_USAGE_ASSETS) return;
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`);
      if (!response.ok) return;
      const listing = await response.json();
      const entries = Array.isArray(listing) ? listing : [];
      for (const entry of entries) {
        if (usageAssets.length >= MAX_USAGE_ASSETS) break;
        const entryType = String(entry?.type || '').toLowerCase();
        const entryName = String(entry?.name || '');
        const entryPath = String(entry?.path || '');
        if (!entryPath) continue;
        if (entryType === 'dir') {
          if (depth >= 2) continue;
          const lowerName = entryName.toLowerCase();
          if (repoCodeSignalDirs.has(lowerName) || /examples?|notebook|tutorial|demo|script|code/.test(lowerName)) {
            await downloadGithubDirAssets(owner, repo, entryPath, depth + 1);
          }
          continue;
        }
        if (entryType !== 'file') continue;
        if (!shouldCollectGithubFile(entryName)) continue;
        const size = Number(entry?.size || 0);
        if (Number.isFinite(size) && size > 1_000_000) continue;
        const rawUrl = entry.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/main/${entryPath}`;
        try {
          const { res, buf } = await fetchBuf(rawUrl);
          if (!res.ok) continue;
          const destPath = join(githubBase, ...entryPath.split('/'));
          mkdirSync(dirname(destPath), { recursive: true });
          writeFileSync(destPath, buf);
          manifest.push({
            id: `${owner}/${repo}#${entryPath}`,
            title: `${entryName} (${owner}/${repo})`,
            url: rawUrl,
            source_type: 'github',
            accessed_date: now,
            file_paths: [`sources/github/${entryPath}`],
            checksum_sha256: sha256(buf),
            retrieval_tool: 'http',
            download_time_utc: now,
            etag: res.headers.get('etag') || undefined,
            last_modified: res.headers.get('last-modified') || undefined,
            content_length_bytes: Number(res.headers.get('content-length') || buf.byteLength)
          });
          const fileType = classifyUsageFile(entryName);
          if (fileType && usageAssets.length < MAX_USAGE_ASSETS) {
            usageAssets.push({
              source: 'github',
              path: `github/${owner}/${repo}/${entryPath}`,
              absPath: destPath,
              type: fileType
            });
          }
        } catch {}
      }
    } catch {}
  };

  async function saveIfOk(urlPath: string, saveName: string) {
    try {
      const { res, buf } = await fetchBuf(`https://huggingface.co/${modelId}/resolve/main/${urlPath}`);
      if (!res.ok) return false;
      writeFileSync(join(hfBase, saveName), buf);
      manifest.push({
        id: `${modelId}#${urlPath}`,
        title: `${urlPath}`,
        url: `https://huggingface.co/${modelId}/blob/main/${urlPath}`,
        source_type: 'hf',
        accessed_date: now,
        file_paths: [`sources/huggingface/${saveName}`],
        checksum_sha256: sha256(buf),
        revision: hfRevision,
        retrieval_tool: 'http',
        download_time_utc: now,
        etag: res.headers.get('etag') || undefined,
        last_modified: res.headers.get('last-modified') || undefined,
        content_length_bytes: Number(res.headers.get('content-length') || buf.byteLength)
      });
      return true;
    } catch { return false; }
  }

  const captureGithubRepo = async (owner: string, repo: string, options: { forcePrimary?: boolean } = {}) => {
    if (!owner || !repo) return;
    const key = `${owner}/${repo}`;
    const normalizedKey = key.toLowerCase();
    if (capturedGithubRepos.has(normalizedKey)) return;
    capturedGithubRepos.add(normalizedKey);

    if (!fallbackGithubRepo) fallbackGithubRepo = key;

    const forcePrimary = !!options.forcePrimary;
    const ownerLower = owner.toLowerCase();
    const repoLower = repo.toLowerCase();
    const lowerKey = key.toLowerCase();
    const resemblesModel = slugTokens.some((token) => token.length >= 3 && lowerKey.includes(token));
    let repoScore = resemblesModel ? slugTokens.reduce((acc, token) => acc + (lowerKey.includes(token) ? token.length : 0), 0) : 0;
    if (repoOwnerDenylist.has(ownerLower)) repoScore -= 45;
    if (/dataset|benchmark|leaderboard/.test(repoLower) && !resemblesModel) repoScore -= 25;

    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main`;
    const files = ['README.md', 'LICENSE', 'CITATION.cff'];
    for (const file of files) {
      try {
        const { res, buf } = await fetchBuf(`${baseUrl}/${file}`);
        if (!res.ok) continue;
        writeFileSync(join(githubBase, file), buf);
        manifest.push({
          id: `${owner}/${repo}#${file}`,
          title: `${file} (${owner}/${repo})`,
          url: `${baseUrl}/${file}`,
          source_type: 'github',
          accessed_date: now,
          file_paths: [`sources/github/${file}`],
          checksum_sha256: sha256(buf),
          retrieval_tool: 'http',
          download_time_utc: now,
          etag: res.headers.get('etag') || undefined,
          last_modified: res.headers.get('last-modified') || undefined,
          content_length_bytes: Number(res.headers.get('content-length') || buf.byteLength)
        });
      } catch {}
    }

    let rootListing: any[] = [];
    try {
      const rootListingRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (rootListingRes.ok) {
        const listingJson = await rootListingRes.json();
        if (Array.isArray(listingJson)) rootListing = listingJson;
      }
    } catch {}

    let hasCodeSignals = false;
    let hasSetupSignals = false;
    let docDirsSeen = 0;
    if (Array.isArray(rootListing)) {
      for (const entry of rootListing) {
        const name = String(entry?.name || '');
        const lower = name.toLowerCase();
        if (entry?.type === 'file') {
          if (repoCodeSignalFiles.has(lower)) {
            hasCodeSignals = true;
            if (lower === 'setup.py' || lower === 'pyproject.toml' || lower.startsWith('requirements')) {
              hasSetupSignals = true;
            }
          }
          if (/[.](py|ipynb|rs|go|cpp|c|java|ts|tsx|js)$/i.test(lower)) {
            hasCodeSignals = true;
          }
          if (shouldCollectGithubFile(name) && usageAssets.length < MAX_USAGE_ASSETS) {
            const rawUrl = toGithubRawUrl(entry.download_url || `${baseUrl}/${entry.path || name}`);
            try {
              const { res, buf } = await fetchBuf(rawUrl);
              if (res.ok) {
                const relative = entry.path || name;
                const destPath = join(githubBase, ...relative.split('/'));
                mkdirSync(dirname(destPath), { recursive: true });
                writeFileSync(destPath, buf);
                manifest.push({
                  id: `${owner}/${repo}#${relative}`,
                  title: `${name} (${owner}/${repo})`,
                  url: rawUrl,
                  source_type: 'github',
                  accessed_date: now,
                  file_paths: [`sources/github/${relative}`],
                  checksum_sha256: sha256(buf),
                  retrieval_tool: 'http',
                  download_time_utc: now,
                  etag: res.headers.get('etag') || undefined,
                  last_modified: res.headers.get('last-modified') || undefined,
                  content_length_bytes: Number(res.headers.get('content-length') || buf.byteLength)
                });
                const fileType = classifyUsageFile(name);
                if (fileType && usageAssets.length < MAX_USAGE_ASSETS) {
                  usageAssets.push({
                    source: 'github',
                    path: `github/${owner}/${repo}/${relative}`,
                    absPath: destPath,
                    type: fileType
                  });
                }
              }
            } catch {}
          }
        } else if (entry?.type === 'dir') {
          if (repoCodeSignalDirs.has(lower)) hasCodeSignals = true;
          if (repoDocDirs.has(lower)) {
            docDirsSeen += 1;
            await downloadGithubDirReadme(owner, repo, entry.path);
          }
          if (repoCodeSignalDirs.has(lower) || /examples?|notebook|tutorial|demo|script|code/.test(lower)) {
            await downloadGithubDirAssets(owner, repo, entry.path, 1);
          }
        }
      }
    }

    if (hasCodeSignals) repoScore += 15;
    if (hasSetupSignals) repoScore += 5;
    if (!hasCodeSignals && docDirsSeen) repoScore += 6;
    if (docDirsSeen) repoScore += Math.min(docDirsSeen, 3) * 2;

    const assignPrimary = () => {
      if (forcePrimary) {
        primaryGithubRepo = key;
        primaryGithubRepoScore = Number.POSITIVE_INFINITY;
        return;
      }
      const prefersModelToken = primaryGithubRepo ? slugTokens.some((token) => primaryGithubRepo?.toLowerCase().includes(token)) : false;
      if (!primaryGithubRepo) {
        primaryGithubRepo = key;
        primaryGithubRepoScore = repoScore;
        return;
      }
      if (repoScore > primaryGithubRepoScore) {
        primaryGithubRepo = key;
        primaryGithubRepoScore = repoScore;
        return;
      }
      if (repoScore === primaryGithubRepoScore) {
        if (resemblesModel && !prefersModelToken) {
          primaryGithubRepo = key;
          primaryGithubRepoScore = repoScore;
        } else if (repoScore > 0 && (primaryGithubRepo || '').length > key.length) {
          primaryGithubRepo = key;
          primaryGithubRepoScore = repoScore;
        }
      }
    };

    assignPrimary();

    try {
      const rel = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`);
      if (rel.ok) {
        const releases = await rel.json();
        if (Array.isArray(releases) && releases.length > 0) {
          const first = releases[0];
          const relJson = JSON.stringify(first, null, 2);
          const relName = `${owner}-${repo}-release.json`;
          writeFileSync(join(githubBase, relName), relJson);
          manifest.push({
            id: `${owner}/${repo}#release-${first.tag_name || first.id}`,
            title: `Release ${first.tag_name || first.name || first.id}`,
            url: first.html_url || `https://github.com/${owner}/${repo}/releases`,
            source_type: 'github',
            accessed_date: now,
            file_paths: [`sources/github/${relName}`],
            checksum_sha256: sha256(new TextEncoder().encode(relJson)),
            retrieval_tool: 'http',
            download_time_utc: now
          });
          hasGithubRelease = true;
        }
      }
    } catch {}
  };

  const aliasRepo = repoAliases[normalizeModelKey(modelId)];
  if (aliasRepo) {
    const [aliasOwner, aliasRepoName] = aliasRepo.split('/');
    if (aliasOwner && aliasRepoName) await captureGithubRepo(aliasOwner, aliasRepoName, { forcePrimary: true });
  }

  await saveIfOk('README.md', 'README.md');
  await saveIfOk('config.json', 'config.json');
  await saveIfOk('generation_config.json', 'generation_config.json');
  const tokJson = await saveIfOk('tokenizer.json', 'tokenizer.json');
  if (!tokJson) {
    await saveIfOk('tokenizer.model', 'tokenizer.model');
  }

  try {
    const { res, text } = await fetchText(`https://huggingface.co/${modelId}/raw/main/README.md`);
    if (res.ok) {
      hfReadmeText = text;
      writeFileSync(join(hfBase, 'README.md'), text);
      const repoLinks = collectGithubRepos(text);
      for (const repoLink of repoLinks) {
        const [owner, repo] = repoLink.split('/');
        if (owner && repo) await captureGithubRepo(owner, repo);
      }
      for (const ds of collectDatasetLinks(text)) {
        datasetIds.add(ds);
      }
      const candidateLinks = extractCandidateEvalLinks(text);
      for (const link of candidateLinks) {
        try {
          const normalizedLink = toGithubRawUrl(link);
          const lower = normalizedLink.toLowerCase();
          const isNotebook = /\.ipynb(?:$|[?#])/.test(lower);
          let linkBuffer: Uint8Array | null = null;
          let linkText = '';
          if (isNotebook) {
            const { res: nbRes, buf } = await fetchBuf(normalizedLink);
            if (!nbRes.ok || !buf) continue;
            linkBuffer = buf;
            try {
              linkText = new TextDecoder().decode(buf);
            } catch { linkText = ''; }
          } else {
            const { res: linkRes, text: fetchedText } = await fetchText(normalizedLink);
            if (!linkRes.ok || !fetchedText) continue;
            linkText = fetchedText;
            linkBuffer = new TextEncoder().encode(fetchedText);
          }
          if (!linkBuffer) continue;
          const extMatch = lower.match(/\.(ipynb|md|markdown|mdx|rst|txt|html?|htm)(?:$|[?#])/);
          const ext = extMatch ? extMatch[1].replace('markdown', 'md') : (isNotebook ? 'ipynb' : 'txt');
          const safeName = `${slugifyUrl(normalizedLink)}.${ext}`;
          const destPath = join(webBase, safeName);
          writeFileSync(destPath, linkBuffer);
          manifest.push({
            id: `${modelId}#${safeName}`,
            title: `Linked doc: ${normalizedLink}`,
            url: normalizedLink,
            source_type: /leaderboard|benchmark|eval/i.test(link) ? 'leaderboard' : /blog|medium|news|post/i.test(link) ? 'blog' : 'other',
            accessed_date: now,
            file_paths: [`sources/web/${safeName}`],
            checksum_sha256: sha256(linkBuffer),
            retrieval_tool: 'http',
            download_time_utc: now
          });
          const harvested = linkText ? harvestEvalEntriesFromText(linkText, `link:${normalizedLink}`) : [];
          if (harvested.length) externalEvalEntries.push(...harvested);
          if (linkText) harvestCoreFactsFromText(metadata || ({} as any), linkText);
          const fileType = classifyUsageFile(safeName);
          if (fileType && usageAssets.length < MAX_USAGE_ASSETS) {
            usageAssets.push({
              source: 'web',
              path: `web/${safeName}`,
              absPath: destPath,
              type: fileType
            });
          }
        } catch {}
      }
    }
  } catch {}

  // Web search for additional authoritative docs
  try {
    const q = `${modelId} model parameters context tokenizer eval`;
    const results = await webSearch(q, 10);
    for (const link of results) {
      try {
        const normalizedLink = toGithubRawUrl(link);
        const lower = normalizedLink.toLowerCase();
        const isNotebook = /\.ipynb(?:$|[?#])/.test(lower);
        let buffer: Uint8Array | null = null;
        let text = '';
        if (isNotebook) {
          const { res, buf } = await fetchBuf(normalizedLink);
          if (!res.ok || !buf) continue;
          buffer = buf;
          try {
            text = new TextDecoder().decode(buf);
          } catch { text = ''; }
        } else {
          const { res, text: fetched } = await fetchText(normalizedLink);
          if (!res.ok || !fetched) continue;
          text = fetched;
          buffer = new TextEncoder().encode(fetched);
        }
        if (!buffer) continue;
        const extMatch = lower.match(/\.(ipynb|md|markdown|mdx|rst|txt|html?|htm)(?:$|[?#])/);
        const ext = extMatch ? extMatch[1].replace('markdown', 'md') : (isNotebook ? 'ipynb' : 'txt');
        const safe = `${slugifyUrl(normalizedLink)}.${ext}`;
        const destPath = join(webBase, safe);
        writeFileSync(destPath, buffer);
        manifest.push({
          id: `${modelId}#search-${safe}`,
          title: `Web doc: ${normalizedLink}`,
          url: normalizedLink,
          source_type: /arxiv\.org/.test(lower) ? 'paper' : /blog|medium|news/.test(lower) ? 'blog' : 'other',
          accessed_date: now,
          file_paths: [`sources/web/${safe}`],
          checksum_sha256: sha256(buffer),
          retrieval_tool: 'http',
          download_time_utc: now
        });
        const extEvals = text ? harvestEvalEntriesFromText(text, `web:${normalizedLink}`) : [];
        if (extEvals.length) externalEvalEntries.push(...extEvals);
        if (text) harvestCoreFactsFromText(metadata || ({} as any), text);
        const fileType = classifyUsageFile(safe);
        if (fileType && usageAssets.length < MAX_USAGE_ASSETS) {
          usageAssets.push({
            source: 'web',
            path: `web/${safe}`,
            absPath: destPath,
            type: fileType
          });
        }
      } catch {}
    }
  } catch {}

  // GitHub repo (best effort) using manifest API
  try {
    const inferOwnerRepo = async () => {
      const url = `https://huggingface.co/${modelId}/raw/main/.gitattributes`;
      const { text } = await fetchText(url);
      if (text.includes('GitHub-History')) {
        const match = text.match(/source:(?<repo>[^\n]+)/);
        if (match?.groups?.repo) return match.groups.repo.trim();
      }
      return null;
    };
    const repoGuess = await inferOwnerRepo();
    if (repoGuess) {
      const [owner, repo] = repoGuess.split('/');
      if (owner && repo) await captureGithubRepo(owner, repo);
    }
  } catch {}

  for (const datasetId of datasetIds) {
    const slugId = datasetId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const apiName = `${slugId}.api.json`;
    const readmeName = `${slugId}.README.md`;
    let apiSaved = false;
    let readmeSaved = false;
    try {
      const { res, text } = await fetchText(`https://huggingface.co/api/datasets/${datasetId}`);
      if (res.ok) {
        writeFileSync(join(datasetsBase, apiName), text);
        const buf = new TextEncoder().encode(text);
        manifest.push({
          id: `${datasetId}#api`,
          title: `${datasetId} (HF dataset API)`,
          url: `https://huggingface.co/api/datasets/${datasetId}`,
          source_type: 'dataset',
          accessed_date: now,
          file_paths: [`sources/datasets/${apiName}`],
          checksum_sha256: sha256(buf),
          retrieval_tool: 'http',
          download_time_utc: now
        });
        apiSaved = true;
      }
    } catch {}
    try {
      const { res, buf } = await fetchBuf(`https://huggingface.co/datasets/${datasetId}/resolve/main/README.md`);
      if (res.ok) {
        writeFileSync(join(datasetsBase, readmeName), buf);
        manifest.push({
          id: `${datasetId}#readme`,
          title: `${datasetId} dataset card`,
          url: `https://huggingface.co/datasets/${datasetId}/blob/main/README.md`,
          source_type: 'dataset',
          accessed_date: now,
          file_paths: [`sources/datasets/${readmeName}`],
          checksum_sha256: sha256(buf),
          retrieval_tool: 'http',
          download_time_utc: now
        });
        readmeSaved = true;
      }
    } catch {}
    datasetSummaries.push({ id: datasetId, api: apiSaved, readme: readmeSaved });
  }

  // arXiv metadata (best effort)
  try {
    const q = encodeURIComponent(modelId);
    const url = `http://export.arxiv.org/api/query?search_query=all:${q}&start=0&max_results=1`;
    const { res, text } = await fetchText(url);
    if (res.ok) {
      const metaName = 'arxiv.xml';
      writeFileSync(join(papersBase, metaName), text);
      const buf = new TextEncoder().encode(text);
      manifest.push({
        id: `${modelId}#arxiv`,
        title: `arXiv query for ${modelId}`,
        url,
        source_type: 'paper',
        accessed_date: now,
        file_paths: [`sources/papers/${metaName}`],
        checksum_sha256: sha256(buf),
        retrieval_tool: 'http',
        download_time_utc: now
      });
    }
  } catch {}

  writeManifest();

  const metadata = extractMetadata({
    configPath: join(hfBase, 'config.json'),
    readmePath: join(hfBase, 'README.md'),
    tokenizerPath: join(hfBase, 'tokenizer.json'),
    generationConfigPath: join(hfBase, 'generation_config.json')
  }, hfModelData);
  applyMetadataHeuristics(modelId, metadata);
  // After base extraction, harvest core facts from README/body docs fetched earlier
  try {
    if (hfReadmeText) harvestCoreFactsFromText(metadata, hfReadmeText);
  } catch {}
  if (externalEvalEntries.length) {
    metadata.evals = dedupeEvals((metadata.evals || []).concat(externalEvalEntries));
  }
  if (Array.isArray(metadata.evals)) {
    for (const entry of metadata.evals) {
      if (entry?.dataset) collectDatasetIds(entry.dataset, datasetIds);
    }
  }
  metadata.coverage = computeCoverage(metadata);
  if (!metadata.versioning) metadata.versioning = {};
  if (!metadata.versioning.hf_revision) metadata.versioning.hf_revision = hfRevision;
  if (primaryGithubRepo) metadata.primary_repo = primaryGithubRepo;
  if (!metadata.notes && hfReadmeText) {
    metadata.notes = 'Generated offline from harvested metadata (LM spec unavailable).';
  }
  const criticalKeys = ['architecture', 'parameters', 'context_window', 'license'];
  const missingKeys = criticalKeys.filter((key) => {
    const value = (metadata as any)[key];
    return !value || (typeof value === 'string' && !value.trim());
  });
  const metadataFlags: string[] = metadata.flags ? [...metadata.flags] : [];
  if (missingKeys.length >= 3) metadataFlags.push('incomplete_metadata');
  if (!metadata.evals || metadata.evals.length === 0) metadataFlags.push('missing_evals');
  if (!metadata.primary_repo) metadataFlags.push('missing_primary_repo');
  if (!metadataFlags.includes('incomplete_metadata') && (metadata as any).parameters === undefined) metadataFlags.push('needs_parameter_verification');
  metadata.flags = metadataFlags.length ? Array.from(new Set(metadataFlags)) : undefined;

  // Build a compact sources digest for the model
  const digest: any = {
    model_id: modelId,
    revision: hfRevision,
    files: {
      hf_readme: existsSync(join(hfBase, 'README.md')),
      config: existsSync(join(hfBase, 'config.json')),
      generation_config: existsSync(join(hfBase, 'generation_config.json')),
      tokenizer_json: existsSync(join(hfBase, 'tokenizer.json')),
      tokenizer_model: existsSync(join(hfBase, 'tokenizer.model')),
      gh_readme: existsSync(join(githubBase, 'README.md')),
      gh_license: existsSync(join(githubBase, 'LICENSE')),
      gh_citation: existsSync(join(githubBase, 'CITATION.cff')),
      gh_release: hasGithubRelease,
      arxiv_meta: existsSync(join(papersBase, 'arxiv.xml')),
      dataset_cards: datasetSummaries.some((d) => d.api || d.readme)
    },
    datasets: datasetSummaries,
    manifest_entries: manifest.length,
    metadata
  };
  const digestPath = join(base, 'sources_digest.json');
  mkdirSync(base, { recursive: true });
  writeFileSync(digestPath, JSON.stringify(digest, null, 2));

  // Short markdown digest
  let md = `# Sources Digest for ${modelId}\n- HF revision: ${hfRevision}\n- README: ${digest.files.hf_readme}\n- config.json: ${digest.files.config}\n- generation_config.json: ${digest.files.generation_config}\n- tokenizer.json: ${digest.files.tokenizer_json}\n- tokenizer.model: ${digest.files.tokenizer_model}\n- GitHub README: ${digest.files.gh_readme}\n- GitHub LICENSE: ${digest.files.gh_license}\n- GitHub CITATION: ${digest.files.gh_citation}\n- GitHub release metadata: ${digest.files.gh_release}\n- arXiv metadata: ${digest.files.arxiv_meta}\n- Dataset cards captured: ${datasetSummaries.length}\n`;
  if (metadata.architecture) md += `- Parsed architecture: ${metadata.architecture}\n`;
  if (metadata.parameters) md += `- Parsed parameters: ${metadata.parameters}\n`;
  if (metadata.context_window) md += `- Parsed context window: ${metadata.context_window}\n`;
  if (metadata.license) md += `- Parsed license: ${metadata.license}\n`;
  if (metadata.primary_repo) md += `- Primary GitHub repo: ${metadata.primary_repo}\n`;
  if (datasetSummaries.length) {
    for (const ds of datasetSummaries) {
      md += `  - ${ds.id}: api=${ds.api} readme=${ds.readme}\n`;
    }
  }
  const mdPath = join(base, 'sources_digest.md');
  writeFileSync(mdPath, md);

  return {
    slug,
    base,
    sourcesBase,
    hfBase,
    githubBase,
    papersBase,
    leaderboardBase,
    datasetsBase,
    webBase,
    digestPath,
    digestMdPath: mdPath,
    manifestPath,
    metadata,
    readmeText: hfReadmeText,
    usageAssets
  };
}

// Allow direct CLI usage
if (import.meta.main) {
  const modelId = process.argv[2];
  const outDir = process.argv[3] || 'out';
  if (!modelId) {
    console.error('Usage: bun scripts/prefetch.ts <model_id> [outDir]');
    process.exit(1);
  }
  prefetch(modelId, outDir).then((info) => {
    console.log(JSON.stringify(info, null, 2));
  }).catch((e) => { console.error(e); process.exit(1); });
}
