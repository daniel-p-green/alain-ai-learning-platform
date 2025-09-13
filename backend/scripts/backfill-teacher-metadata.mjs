#!/usr/bin/env node
// Backfill teacher_model_used into notebook metadata for existing .ipynb files.
// Usage:
//   node backend/scripts/backfill-teacher-metadata.mjs [--root <dir>] [--dry]
// Defaults:
//   --root resolves to process.env.ALAIN_STORAGE_ROOT || 'content/notebooks'

import { promises as fs } from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
let rootArg = null;
let dryRun = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--root') {
    rootArg = argv[++i];
  } else if (a === '--dry') {
    dryRun = true;
  }
}

const defaultRoot = process.env.ALAIN_STORAGE_ROOT
  ? path.join(process.cwd(), process.env.ALAIN_STORAGE_ROOT)
  : path.join(process.cwd(), 'content', 'notebooks');
const ROOT = path.resolve(rootArg || defaultRoot);

async function* walk(dir) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (e.isFile() && e.name.endsWith('.ipynb')) {
      yield full;
    }
  }
}

function extractTeacherFromCells(cells) {
  if (!Array.isArray(cells)) return null;
  const re = /Teacher\s*Model\s*:\s*([^\n<]+)/i;
  for (const c of cells) {
    if (c?.cell_type !== 'markdown') continue;
    const txt = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
    const m = re.exec(txt);
    if (m && m[1]) {
      const val = m[1].trim();
      if (/120B/i.test(val)) return 'GPT-OSS-120B';
      if (/20B/i.test(val)) return 'GPT-OSS-20B';
    }
  }
  return null;
}

async function processNotebook(file) {
  let raw;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (e) {
    console.warn('[skip] read error:', file, e?.message);
    return { file, changed: false, reason: 'read_error' };
  }
  let nb;
  try {
    nb = JSON.parse(raw);
  } catch (e) {
    console.warn('[skip] invalid JSON:', file);
    return { file, changed: false, reason: 'invalid_json' };
  }
  nb.metadata ||= {};
  let used = nb.metadata.teacher_model_used;
  if (!used) {
    used = extractTeacherFromCells(nb.cells) || 'GPT-OSS-20B';
    nb.metadata.teacher_model_used = used;
  }
  if (typeof nb.metadata.teacher_downgraded === 'undefined') {
    nb.metadata.teacher_downgraded = false;
  }
  if (dryRun) {
    return { file, changed: true, dryRun: true };
  }
  try {
    const pretty = JSON.stringify(nb, null, 2);
    await fs.writeFile(file, pretty, 'utf8');
    return { file, changed: true };
  } catch (e) {
    console.warn('[skip] write error:', file, e?.message);
    return { file, changed: false, reason: 'write_error' };
  }
}

async function main() {
  let count = 0, changed = 0;
  for await (const file of walk(ROOT)) {
    count++;
    const res = await processNotebook(file);
    if (res.changed) changed++;
    console.log(`${res.changed ? 'updated' : 'ok'}: ${path.relative(process.cwd(), res.file)}`);
  }
  console.log(`\nBackfill complete. Scanned: ${count}, Updated: ${changed}, Root: ${ROOT}${dryRun ? ' (dry)' : ''}`);
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});

