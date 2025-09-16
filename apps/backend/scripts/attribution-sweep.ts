#!/usr/bin/env tsx
/**
 * Sweep repository content to update attribution links from
 *   https://github.com/your-org/alain-ai-learning-platform
 * to
 *   https://github.com/daniel-p-green/alain-ai-learning-platform/
 * and fix Colab template placeholders (github/your-org/your-repo).
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const TARGETS = [
  'content',
  'data',
  'backend',
  'docs',
];

const REPLACEMENTS: Array<{ regex: RegExp; replacement: string; note: string }> = [
  {
    regex: /https:\/\/github\.com\/your-org\/alain-ai-learning-platform\/?/g,
    replacement: 'https://github.com/daniel-p-green/alain-ai-learning-platform/',
    note: 'Attribution repo URL',
  },
  {
    regex: /github\/your-org\/your-repo/g,
    replacement: 'github/daniel-p-green/alain-ai-learning-platform',
    note: 'Colab template repo path',
  },
];

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      // Skip heavy or irrelevant dirs
      if (/(^|\/)node_modules(\/|$)/.test(p)) continue;
      out = await walk(p, out);
    } else if (e.isFile()) {
      // Only consider text-like files
      if (/\.(ipynb|md|txt|json)$/i.test(e.name)) out.push(p);
    }
  }
  return out;
}

async function main() {
  const files: string[] = [];
  for (const rel of TARGETS) {
    try {
      const dir = join(ROOT, rel);
      const exists = await fs.stat(dir).then(() => true).catch(() => false);
      if (!exists) continue;
      const list = await walk(dir);
      files.push(...list);
    } catch {}
  }

  let changed = 0;
  const touched: string[] = [];
  for (const f of files) {
    try {
      const buf = await fs.readFile(f, 'utf-8');
      let next = buf;
      for (const r of REPLACEMENTS) {
        next = next.replace(r.regex, r.replacement);
      }
      if (next !== buf) {
        await fs.writeFile(f, next, 'utf-8');
        changed += 1;
        touched.push(f);
      }
    } catch {}
  }

  console.log(`Updated ${changed} file(s).`);
  if (touched.length) {
    console.log('Examples:');
    for (const f of touched.slice(0, 10)) console.log(' - ' + f);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

