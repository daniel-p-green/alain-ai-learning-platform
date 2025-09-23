#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
const ROOT = path.resolve(__dirname, '..');

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

async function findTodoFiles(dir) {
  const out = [];
  async function walk(d) {
    const ents = await fs.readdir(d, { withFileTypes: true });
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (/node_modules|\.next|dist|encore\.gen|\.git/.test(p)) continue;
        await walk(p);
      } else if (e.isFile() && e.name === 'TODO.md') {
        out.push(p);
      }
    }
  }
  await walk(dir);
  return out;
}

function parseTodo(content) {
  const lines = content.split(/\r?\n/);
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\- \[( |x)\] (.+?) \[tags:([^\]]+)\]/i);
    if (m) {
      const title = m[2].trim();
      const tags = Object.fromEntries(m[3].split(';').map(s => {
        const [k, v] = s.split('=').map(t => t.trim());
        return [k, v];
      }));
      items.push({ title, tags, line: i + 1 });
    }
  }
  return items;
}

function hasIso8601(s) {
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(s || '');
}

async function main() {
  const errors = [];
  const warnings = [];

  // Load spec + status
  const specPath = path.join(ROOT, 'specs', 'spec.json');
  const statusPath = path.join(ROOT, 'status', 'status.json');
  const agentsPath = path.join(ROOT, 'docs', 'AGENTS.md');
  const spec = await readJson(specPath);
  const status = await readJson(statusPath);
  const featureIds = new Set((spec.features || []).map(f => f.id));
  const componentNames = new Set((status.components || []).map(c => c.name));

  // Validate TODO feature IDs and component names
  const todos = await findTodoFiles(ROOT);
  for (const file of todos) {
    const content = await fs.readFile(file, 'utf8');
    const items = parseTodo(content);
    for (const it of items) {
      const f = it.tags.feature;
      if (f && !featureIds.has(f)) {
        errors.push(`${path.relative(ROOT, file)}:${it.line} references missing feature id "${f}"`);
      }
      const comp = it.tags.component;
      if (comp && !componentNames.has(comp)) {
        warnings.push(`${path.relative(ROOT, file)}:${it.line} uses unknown component "${comp}" (status/status.json does not list it).`);
      }
      const due = it.tags.due;
      if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        warnings.push(`${path.relative(ROOT, file)}:${it.line} has non-ISO due date "${due}" (expected YYYY-MM-DD).`);
      }
    }
  }

  // Validate AGENTS last_updated appears ISO-like (best-effort)
  try {
    const agents = await fs.readFile(agentsPath, 'utf8');
    if (!hasIso8601(agents)) {
      warnings.push('docs/AGENTS.md does not contain an ISO-8601 timestamp; docs:sync will inject from status.');
    }
  } catch {}

  if (warnings.length) {
    console.warn('\nConsistency warnings:');
    for (const w of warnings) console.warn(' - ' + w);
  }
  if (errors.length) {
    console.error('\nConsistency errors:');
    for (const e of errors) console.error(' - ' + e);
    process.exit(1);
  }
  console.log('Consistency OK.');
}

main().catch(err => { console.error(err); process.exit(1); });

