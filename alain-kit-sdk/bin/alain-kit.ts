#!/usr/bin/env node
import { ALAINKit } from '../index';
import fs from 'fs';
import path from 'path';

function parseArg(flag: string, fallback?: string) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
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
  fs.writeFileSync(reportPath, res.validationReport);

  console.log(`✅ Wrote notebook: ${nbPath}`);
  console.log(`📋 Validation: ${reportPath}`);
  console.log(`Quality: ${res.qualityScore}  Colab: ${res.colabCompatible ? '✅' : '⚠️'}`);
}

main().catch(err => { console.error(err); process.exit(1); });

