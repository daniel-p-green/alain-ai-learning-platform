#!/usr/bin/env node
import { ALAINKit } from '../index';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

function parseArg(flag: string, fallback?: string) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

// Readability helpers (FK grade + markdown ratio)
function computeReadability(notebook: any) {
  const cells = Array.isArray(notebook?.cells) ? notebook.cells : [];
  let mdChars = 0;
  let codeChars = 0;
  let text = '';
  for (const cell of cells) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
    if (cell.cell_type === 'markdown') {
      mdChars += source.length;
      text += source + '\n\n';
    } else if (cell.cell_type === 'code') {
      codeChars += source.length;
    }
  }
  const total = mdChars + codeChars;
  const markdownRatio = total > 0 ? mdChars / total : 0;
  const fkGrade = fk(text);
  return { markdownRatio, fkGrade };
}

function fk(text: string): number {
  const sentences = Math.max(1, splitSentences(text).length);
  const wordsArr = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:'[A-Za-z]+)?/g) || []);
  const words = Math.max(1, wordsArr.length);
  const syllables = Math.max(1, wordsArr.reduce((s, w) => s + syllableCount(w), 0));
  const wordsPerSentence = words / sentences;
  const syllablesPerWord = syllables / words;
  return 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function syllableCount(word: string): number {
  let w = word.toLowerCase().replace(/[^a-zà-öø-ÿ]/g, '');
  if (!w) return 0;
  const vowels = /[aeiouyà-öø-ÿ]/;
  let groups = 0;
  let prevVowel = false;
  for (const ch of w) {
    const isV = vowels.test(ch);
    if (isV && !prevVowel) groups++;
    prevVowel = isV;
  }
  if (w.endsWith('e') && groups > 1) groups--;
  return Math.max(1, groups);
}

function printHelp() {
  console.log(`ALAIN-Kit CLI\n\nUsage:\n  alain-kit --model <model> [--apiKey <key>] [--baseUrl <url>] [--difficulty <level>] [--maxSections <n>] [--outDir <path>] [--remix <ipynb>]\n\nFlags:\n  --model         Model reference or name (e.g., gpt-oss-20b)\n  --apiKey        Provider API key (e.g., POE_API_KEY)\n  --baseUrl       Provider base URL (root, no /v1). Example: https://api.poe.com\n  --difficulty    beginner | intermediate | advanced (default: beginner)\n  --maxSections   Number of sections to generate (default: 6)\n  --outDir        Output directory (default: ./output)\n  --remix         Remix an existing notebook (path to .ipynb). Runs full ALAIN pipeline (ELI5).\n  --help, -h      Show this help\n\nTips:\n  - Poe: use --baseUrl https://api.poe.com (do not include /v1).\n    The CLI appends /v1/chat/completions automatically.\n  - Local OpenAI-compatible servers: pass the server root (e.g., http://localhost:1234).`);
}

async function main() {
  // Load env: CWD first, then repo root (two levels up from bin/)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config();
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  const model = parseArg('--model', process.env.MODEL_REF || 'gpt-oss-20b')!;
  const apiKey = parseArg('--apiKey', process.env.POE_API_KEY);
  const baseUrl = parseArg('--baseUrl', process.env.OPENAI_BASE_URL);
  const difficulty = (parseArg('--difficulty', 'beginner') as 'beginner'|'intermediate'|'advanced');
  const maxSections = Number(parseArg('--maxSections', '6')) || 6;
  const outDir = parseArg('--outDir', path.join(process.cwd(), 'output'))!;
  const remixPath = parseArg('--remix');

  // Warn if user passed a baseUrl that already includes /v1
  if (baseUrl && /\/v1\b/.test(baseUrl)) {
    console.warn('⚠️  baseUrl includes /v1; ALAIN-Kit will append /v1/chat/completions. Use the provider root (e.g., https://api.poe.com).');
  }
  const kit = new ALAINKit({ baseUrl });
  let res: any;
  if (remixPath) {
    if (!fs.existsSync(remixPath)) {
      console.error(`❌ Remix source not found: ${remixPath}`);
      process.exit(1);
    }
    const src = JSON.parse(fs.readFileSync(remixPath, 'utf-8'));
    const title = inferTitle(src) || 'Notebook';
    const heads = extractHeadings(src);
    const excerpt = extractPlainText(src, 8000);
    res = await kit.generateNotebook({
      modelReference: model,
      apiKey,
      difficulty: 'beginner',
      maxSections,
      customPrompt: {
        title: `${title} — ELI5 Remix`,
        description: 'Beginner-friendly remix of the source notebook (non-developers).',
        difficulty: 'beginner',
        topics: heads,
        // @ts-ignore extra keys for OutlineGenerator
        context: `Source headings: ${heads.join(' | ')}\n\nExcerpt (markdown-only):\n${excerpt}`,
        temperature: 0.1,
        maxTokens: 2000
      } as any
    });
  } else {
    res = await kit.generateNotebook({
      modelReference: model,
      apiKey,
      difficulty,
      maxSections
    });
  }

  if (!res.success) {
    console.error('❌ Generation failed');
    console.error(res.validationReport);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const stamp = Date.now();
  // Build descriptive filename: maker_model_level_topic_date-ALAIN.ipynb
  function slugify(s: string, maxWords = 7) {
    const words = (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, maxWords);
    return words.join('-');
  }
  const providerStr = String(res.notebook?.metadata?.provider || '').toLowerCase();
  const maker = providerStr.includes('openai') ? 'openai' : (providerStr || 'provider');
  const modelPart = (model || '').toLowerCase().replace(/\s+/g, '-');
  const level = (String(res.notebook?.metadata?.level || 'beginner').toLowerCase().match(/beginner|intermediate|advanced/)?.[0]) || 'beginner';
  const firstMd = Array.isArray(res.notebook?.cells?.[0]?.source) ? res.notebook?.cells?.[0]?.source.join('') : String(res.notebook?.cells?.[0]?.source || '');
  const h1 = (firstMd.match(/^#\s+(.+)$/m)?.[1]) || String(res.notebook?.metadata?.title || 'getting started');
  const topic = slugify(h1, 7);
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '.');
  let fileName = `${maker}_${modelPart}_${level}_${topic}_${dateStr}-ALAIN.ipynb`;
  const nbPath = path.join(outDir, remixPath ? `${maker}_${modelPart}_${level}_${topic}_${dateStr}-ALAIN-remix.ipynb` : fileName);
  if (remixPath) {
    try {
      const credit = [
        '---\n',
        '**Remix Note**: This ELI5 version was created with the Applied Learning AI Notebooks (ALAIN) Project on 09.14.2025.\\n',
        'Created by [Daniel Green](https://www.linkedin.com/in/danielpgreen).\\n',
        '---\n\n'
      ];
      res.notebook.cells.unshift({ cell_type: 'markdown', metadata: {}, source: credit });
      res.notebook.metadata = {
        ...(res.notebook.metadata || {}),
        remix: true,
        remix_source: path.basename(remixPath),
        remix_date: '2025-09-14',
        remix_by: 'Daniel Green',
        remix_by_link: 'https://www.linkedin.com/in/danielpgreen'
      };
    } catch {}
  }
  const reportPath = path.join(outDir, `alain-validation-${stamp}.md`);
  fs.writeFileSync(nbPath, JSON.stringify(res.notebook, null, 2));
  // Append readability metrics to report for quick inspection
  const { markdownRatio, fkGrade } = computeReadability(res.notebook);
  const cellCount = res.notebook?.cells?.length ?? 0;
  const reportContent = `${res.validationReport}\n\n---\nReadability\n- FK Grade: ${fkGrade.toFixed(1)} (target 14–20)\n- Markdown Ratio: ${(markdownRatio * 100).toFixed(1)}% (target 50–65%)\n- Cells: ${cellCount} (length gate)\n`;
  fs.writeFileSync(reportPath, reportContent);

  console.log(`✅ Wrote notebook: ${nbPath}`);
  console.log(`📋 Validation: ${reportPath}`);
  const metrics = {
    model,
    baseUrl: baseUrl || 'poe',
    difficulty,
    maxSections,
    qualityScore: res.qualityScore,
    colabCompatible: res.colabCompatible,
    sectionCount: res.sections?.length ?? 0,
    qualityMetrics: res.qualityMetrics,
    cells: res.notebook?.cells?.length ?? 0,
    markdownCells: res.notebook?.cells?.filter((c: any)=>c.cell_type==='markdown').length ?? 0,
    codeCells: res.notebook?.cells?.filter((c: any)=>c.cell_type==='code').length ?? 0,
    readability: { fkGrade, markdownRatio }
  } as any;
  const metricsPath = path.join(outDir, `alain-metrics-${stamp}.json`);
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  console.log(`Quality: ${res.qualityScore}  Colab: ${res.colabCompatible ? '✅' : '⚠️'}`);
  console.log(`Readability: FK=${fkGrade.toFixed(1)}  MD Ratio=${(markdownRatio*100).toFixed(1)}%`);
  console.log(`📊 Metrics: ${metricsPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });

// --- Remix helpers ---
function asText(src: any): string { return Array.isArray(src) ? src.join('') : String(src || ''); }
function inferTitle(nb: any): string | undefined {
  const cells = Array.isArray(nb?.cells) ? nb.cells : [];
  for (const c of cells) {
    if (c.cell_type === 'markdown') {
      const m = asText(c.source).match(/^#\s+(.+)$/m);
      if (m) return m[1].trim();
    }
  }
  return nb?.metadata?.title;
}
function extractHeadings(nb: any, limit = 8): string[] {
  const heads: string[] = [];
  const cells = Array.isArray(nb?.cells) ? nb.cells : [];
  for (const c of cells) {
    if (c?.cell_type !== 'markdown') continue;
    const lines = asText(c.source).split(/\r?\n/);
    for (const line of lines) {
      const m = /^(#{1,3})\s+(.+)/.exec(line.trim());
      if (m) heads.push(m[2].trim());
      if (heads.length >= limit) return heads;
    }
  }
  return heads;
}
function extractPlainText(nb: any, maxChars = 8000): string {
  let out = '';
  const cells = Array.isArray(nb?.cells) ? nb.cells : [];
  for (const c of cells) {
    if (c?.cell_type === 'markdown') {
      out += asText(c.source) + '\n\n';
      if (out.length >= maxChars) break;
    }
  }
  return out.slice(0, maxChars);
}
