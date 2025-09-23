#!/usr/bin/env bun

/**
 * Grade research outputs (v0.3) across two stages:
 *  - Stage1 Spec JSON (strict schema)
 *  - Stage2 Bundle (files + manifest or summary)
 *
 * Usage examples:
 *  bun test-research-grade.ts \
 *    --spec-chat test-output/lmstudio-v0.3/1234-openai-gpt-oss-20b-spec.json \
 *    --bundle-chat test-output/lmstudio-v0.3/1234-openai-gpt-oss-20b-bundle.txt \
 *    --bundle-dir out/research-openai-gpt-oss-20b \
 *    --out test-output/grade-openai-gpt-oss-20b
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

type Flags = Record<string, string | boolean>;
function parseFlags(argv: string[]): Flags {
  const f: Flags = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = (i + 1 < argv.length && !argv[i + 1].startsWith('--')) ? argv[++i] : true;
      f[k] = v;
    }
  }
  return f;
}

const flags = parseFlags(process.argv);
const SPEC_CHAT = String(flags['spec-chat'] || '');
const BUNDLE_CHAT = String(flags['bundle-chat'] || '');
const BUNDLE_DIR = String(flags['bundle-dir'] || '');
const OUT_DIR = String(flags['out'] || 'test-output/research-grade');
mkdirSync(OUT_DIR, { recursive: true });

function safeJson<T>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { return null; }
}

function extractFirstJsonObject(text: string | null | undefined) {
  if (!text) return null;
  let start = text.indexOf('{');
  while (start !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else {
        if (ch === '"') {
          inString = true;
        } else if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0) {
            return text.slice(start, i + 1);
          }
        }
      }
    }
    start = text.indexOf('{', start + 1);
  }
  return null;
}

// Stage 1: extract spec JSON object from chat wrapper
function extractSpecObject(chatPath: string): any | null {
  if (!chatPath) return null;
  const raw = readFileSync(chatPath, 'utf8');
  const wrapped = safeJson<any>(raw);
  const content = wrapped?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return null;
  const jsonSlice = extractFirstJsonObject(content);
  if (!jsonSlice) return null;
  return safeJson<any>(jsonSlice);
}

function isNonUnknownString(v: any): boolean {
  return typeof v === 'string' && v.trim() !== '' && v.trim().toLowerCase() !== 'not specified';
}

const SPEC_SCHEMA_REQ = {
  top: ['model_name', 'identity', 'technical_specs', 'inference', 'evals', 'sources', 'disputed', 'notes'],
  tech: ['architecture', 'parameters', 'context_window', 'tokenizer', 'license'],
  infer: ['servers', 'min_hardware', 'quantization'],
};

function gradeSpec(spec: any): { score: number; failures: string[]; warnings: string[]; metrics: Record<string, any>; critical: string[] } {
  const failures: string[] = [];
  const warnings: string[] = [];
  const critical: string[] = [];
  const metrics: Record<string, any> = { primary_sources: 0, secondary_sources: 0, speculation_hits: 0, unknown_ratio: 0 };

  let score = 60; // start full, subtract on failures

  if (!spec || typeof spec !== 'object') {
    critical.push('Spec is missing or not an object');
    return { score: 0, failures: ['Spec missing'], warnings, metrics, critical };
  }

  // Structured keys check
  for (const k of SPEC_SCHEMA_REQ.top) {
    if (!(k in spec)) { failures.push(`Missing key: ${k}`); score -= 2; }
  }
  const tech = spec.technical_specs || {};
  for (const k of SPEC_SCHEMA_REQ.tech) { if (!(k in tech)) { failures.push(`Missing technical_specs.${k}`); score -= 1; } }
  const inf = spec.inference || {};
  for (const k of SPEC_SCHEMA_REQ.infer) { if (!(k in inf)) { failures.push(`Missing inference.${k}`); score -= 1; } }

  // Sources assessment
  const srcs = Array.isArray(spec.sources) ? spec.sources : [];
  for (const s of srcs) {
    const t = (s?.source_type || '').toLowerCase();
    if (t === 'hf' || t === 'github' || t === 'paper') metrics.primary_sources++;
    else metrics.secondary_sources++;
    if (!s?.accessed_date) warnings.push('Source missing accessed_date');
  }
  if (metrics.primary_sources === 0) { failures.push('No primary sources present'); score -= 8; }

  // Speculation scan
  const specStr = JSON.stringify(spec);
  const specRe = /\b(likely|maybe|approximately|approx\.?|around|circa)\b|~/gi;
  metrics.speculation_hits = (specStr.match(specRe) || []).length;
  if (metrics.speculation_hits > 0) { failures.push('Speculation terms present'); score -= 5; }

  // Unknown ratio (simple heuristic)
  let totalFields = 0; let unknowns = 0;
  function walk(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
      const v = (obj as any)[k];
      if (typeof v === 'string') { totalFields++; if (v.trim().toLowerCase() === 'not specified') unknowns++; }
      else if (typeof v === 'object') walk(v);
    }
  }
  walk(spec);
  metrics.unknown_ratio = totalFields ? unknowns / totalFields : 0;

  if (metrics.unknown_ratio > 0.3) {
    warnings.push(`High unknown ratio ${(metrics.unknown_ratio * 100).toFixed(1)}%`);
    if (metrics.unknown_ratio >= 0.6) score -= 20;
    else if (metrics.unknown_ratio >= 0.45) score -= 15;
    else score -= 8;
  }

  if (typeof spec.notes === 'string' && (/auto-?generated/i.test(spec.notes) && /(spec|fallback)/i.test(spec.notes) || /lm spec unavailable/i.test(spec.notes))) {
    failures.push('Fallback spec used');
    score -= 20;
  }

  // Soft penalties for coverage flags
  try {
    const flags: string[] = (spec as any)?.coverage_flags || []; // optional passthrough
    if (Array.isArray(flags)) {
      if (flags.includes('missing_primary_repo')) score -= 3;
      if (flags.includes('missing_evals')) score -= 5;
    }
  } catch {}

  // Licensing
  if (!tech.license) { warnings.push('License missing'); score -= 3; }

  // Bound score
  if (score < 0) score = 0;
  return { score, failures, warnings, metrics, critical };
}

// Stage 2: bundle checks
function gradeBundle(bundleChatPath: string, bundleDir?: string): { score: number; failures: string[]; warnings: string[]; metrics: Record<string, any>; critical: string[] } {
  const failures: string[] = [];
  const warnings: string[] = [];
  const critical: string[] = [];
  const metrics: Record<string, any> = { files_written: 0, ok_lines: 0 };
  let score = 40;

  const required = [
    'README.md','TECH_SPECS.md','EVALS.md','COOKBOOK.md','LICENSE_NOTES.md','TROUBLESHOOTING.md','requirements.txt','.env.example',
    'code/inference.py','code/finetune.py','code/run.sh','sources/manifest.jsonl','CHANGELOG.md']

  if (bundleDir && existsSync(bundleDir)) {
    for (const rel of required) {
      const p = join(bundleDir, rel);
      if (existsSync(p)) metrics.files_written++; else { failures.push(`Missing file: ${rel}`); score -= 1; }
    }
  } else if (bundleChatPath) {
    const raw = readFileSync(bundleChatPath, 'utf8');
    const okLines = (raw.match(/^OK: /gm) || []).length;
    metrics.ok_lines = okLines;
    if (okLines < 6) { warnings.push('Few OK lines; may not have saved files'); score -= 4; }
  } else {
    warnings.push('No bundle evidence provided');
    score -= 8;
  }
  if (score < 0) score = 0;
  return { score, failures, warnings, metrics, critical };
}

const specObj = extractSpecObject(SPEC_CHAT);
const stage1 = gradeSpec(specObj);
const stage2 = gradeBundle(BUNDLE_CHAT, BUNDLE_DIR && BUNDLE_DIR !== 'undefined' ? BUNDLE_DIR : undefined);

const total = Math.max(0, Math.min(100, stage1.score + stage2.score));
const critical = [...stage1.critical, ...stage2.critical];

const report = {
  total_score: total,
  stage1: { score: stage1.score, failures: stage1.failures, warnings: stage1.warnings, metrics: stage1.metrics },
  stage2: { score: stage2.score, failures: stage2.failures, warnings: stage2.warnings, metrics: stage2.metrics },
  critical_failures: critical,
  summary: total >= 85 && critical.length === 0 ? 'ready_to_ship' : (total >= 70 ? 'needs_fixes' : 'redo')
};

const stamp = Date.now();
const outJson = join(OUT_DIR, `${stamp}-research_grade.json`);
writeFileSync(outJson, JSON.stringify(report, null, 2));

const md = [
  `# Research Grade`,
  `Total: ${report.total_score}/100 — ${report.summary}`,
  `\n## Stage 1 (Spec) — ${report.stage1.score}/60`,
  `Failures: ${report.stage1.failures.join('; ') || 'None'}`,
  `Warnings: ${report.stage1.warnings.join('; ') || 'None'}`,
  `Metrics: ${JSON.stringify(report.stage1.metrics)}`,
  `\n## Stage 2 (Bundle) — ${report.stage2.score}/40`,
  `Failures: ${report.stage2.failures.join('; ') || 'None'}`,
  `Warnings: ${report.stage2.warnings.join('; ') || 'None'}`,
  `Metrics: ${JSON.stringify(report.stage2.metrics)}`
].join('\n');

writeFileSync(join(OUT_DIR, `${stamp}-research_grade.md`), md);
console.log(`Wrote ${outJson}`);
