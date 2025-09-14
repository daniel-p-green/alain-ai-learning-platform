#!/usr/bin/env node
import { ALAINKit } from '../index';
import fs from 'fs';
import path from 'path';

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

async function main() {
  const model = parseArg('--model', process.env.MODEL_REF || 'gpt-oss-20b')!;
  const apiKey = parseArg('--apiKey', process.env.POE_API_KEY || 'local');
  const baseUrl = parseArg('--baseUrl', process.env.OPENAI_BASE_URL);
  const difficulty = (parseArg('--difficulty', 'beginner') as 'beginner'|'intermediate'|'advanced');
  const maxSections = Number(parseArg('--maxSections', '6')) || 6;
  const outDir = parseArg('--outDir', path.join(process.cwd(), 'output'))!;

  const kit = new ALAINKit({ baseUrl });
  const res = await kit.generateNotebook({
    modelReference: model,
    apiKey,
    difficulty,
    maxSections
  });

  if (!res.success) {
    console.error('❌ Generation failed');
    console.error(res.validationReport);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const stamp = Date.now();
  const nbPath = path.join(outDir, `alain-notebook-${stamp}.ipynb`);
  const reportPath = path.join(outDir, `alain-validation-${stamp}.md`);
  fs.writeFileSync(nbPath, JSON.stringify(res.notebook, null, 2));
  // Append readability metrics to report for quick inspection
  const { markdownRatio, fkGrade } = computeReadability(res.notebook);
  const reportContent = `${res.validationReport}\n\n---\nReadability\n- FK Grade: ${fkGrade.toFixed(1)} (target 14–20)\n- Markdown Ratio: ${(markdownRatio * 100).toFixed(1)}% (target 50–65%)\n`;
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
