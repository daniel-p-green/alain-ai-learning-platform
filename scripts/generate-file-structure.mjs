#!/usr/bin/env node
// Generate a comprehensive file structure document with:
// - Directory Tree (git-tracked directories)
// - Basic Directory Overview (bulleted list of directories)
// - Detailed File Listing with brief type descriptions

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function listFiles() {
  const out = sh('git ls-files');
  return out ? out.split('\n').filter(Boolean) : [];
}

function listDirs(files) {
  const set = new Set();
  for (const p of files) {
    const d = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.';
    set.add(d);
  }
  return Array.from(set).sort();
}

function buildTrie(dirs) {
  const root = {};
  for (const d of dirs) {
    const parts = d.split('/').filter(p => p && p !== '.');
    let node = root;
    for (const part of parts) node = (node[part] ||= {});
  }
  return root;
}

function renderTree(trie, rootName) {
  const lines = [`${rootName}/`];
  const walk = (node, prefix = '') => {
    const keys = Object.keys(node).sort();
    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${k}/`);
      const childPrefix = prefix + (last ? '    ' : '│   ');
      walk(node[k], childPrefix);
    });
  };
  walk(trie);
  return lines.join('\n');
}

function describeFile(path) {
  const base = path.split('/').pop() || '';
  const m = base.match(/\.([^.]+)$/);
  const ext = m ? m[1].toLowerCase() : '';
  const isCliTs = /(^|\/)bin\/.*\.ts$/.test(path);
  if (base === 'README.md') return 'README';
  if (base === 'LICENSE') return 'License';
  if (base === '.gitignore') return '.gitignore';
  if (base === 'package.json') return 'Node package manifest';
  if (base === 'package-lock.json') return 'npm lockfile';
  if (base === 'tsconfig.json') return 'TypeScript config';
  if (base === 'tsconfig.tsbuildinfo') return 'TypeScript build info';
  if (base === 'vitest.config.ts') return 'Vitest config';
  if (base === 'playwright.config.ts') return 'Playwright config';
  if (base === 'vercel.json') return 'Vercel config';
  if (isCliTs) return 'CLI entry';
  if (ext === 'ts') return 'TypeScript source';
  if (ext === 'tsx') return 'React (TSX) component';
  if (ext === 'js') return 'JavaScript';
  if (ext === 'mjs' || ext === 'cjs') return 'Node script';
  if (ext === 'py') return 'Python script';
  if (ext === 'md') return 'Markdown doc';
  if (ext === 'json') return 'JSON data/schema';
  if (ext === 'ipynb') return 'Jupyter notebook';
  if (ext === 'sql') return 'SQL';
  if (ext === 'sh') return 'Shell script';
  if (ext === 'txt') return 'Text resource';
  if (['svg', 'png', 'jpg', 'jpeg', 'ico'].includes(ext)) return 'Image asset';
  if (['yml', 'yaml'].includes(ext)) return 'YAML config';
  return 'File';
}

function main() {
  const repoName = 'alain-ai-learning-platform';
  // Ensure we run from the repo root where this script resides
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(scriptDir, '..');
  process.chdir(repoRoot);
  const files = listFiles();
  const dirs = listDirs(files);
  const trie = buildTrie(dirs);
  const tree = renderTree(trie, repoName);
  const stamp = new Date().toISOString().replace(/\..+/, 'Z');

  let out = '';
  out += '# ALAIN AI Learning Platform — File Structure\n\n';
  out += `Generated: ${stamp} (UTC)\n`;
  out += `Scope: lists all git-tracked files and directories under '${repoName}'. Excludes untracked dependencies and build artifacts (e.g., node_modules, .next).\n\n`;
  out += '## Directory Tree (git-tracked)\n\n';
  out += '```text\n' + tree + '\n```\n\n';
  out += '## Basic Directory Overview\n';
  out += 'Top-level and nested directories (git-tracked):\n\n';
  out += dirs.map(d => `- ${d}`).join('\n') + '\n\n';
  out += '## Detailed File Listing (with brief descriptions)\n';
  out += 'Each entry is a file path relative to the repository root, annotated with a brief type description.\n\n';
  out += files.sort().map(p => `- ${p} — ${describeFile(p)}`).join('\n') + '\n';

  const outPath = `hackathon-notes/alain-file-structure.md`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, out, 'utf8');
  console.log(`Wrote ${outPath}`);
}

main();
