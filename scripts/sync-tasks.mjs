#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
const ROOT = path.resolve(__dirname, '..');

async function findTodoFiles(dir) {
  const out = [];
  async function walk(d) {
    const ents = await fs.readdir(d, { withFileTypes: true });
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        // Skip node_modules and build artifacts
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
      const open = m[1] !== 'x';
      const title = m[2].trim();
      const tagsRaw = m[3].trim();
      const tags = Object.fromEntries(tagsRaw.split(';').map(s => {
        const [k, v] = s.split('=').map(t => t.trim());
        return [k, v];
      }));
      items.push({ open, title, tags, lineIndex: i });
    }
  }
  return items;
}

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, '/'); }

function groupByComponent(itemsByFile) {
  const map = new Map();
  for (const [file, items] of itemsByFile) {
    for (const it of items) {
      const comp = it.tags.component || 'unknown';
      const feature = it.tags.feature || 'unassigned';
      const entry = map.get(comp) || { features: new Map(), files: new Set() };
      entry.files.add(file);
      const f = entry.features.get(feature) || [];
      f.push({ file, ...it });
      entry.features.set(feature, f);
      map.set(comp, entry);
    }
  }
  return map;
}

function renderTasksMd(groups) {
  const lines = [];
  lines.push('# ALAIN Task Rollup');
  lines.push('');
  lines.push('> Generated from module TODO.md files. Do not edit directly.');
  lines.push('');
  for (const [comp, data] of groups) {
    const openCount = [...data.features.values()].reduce((n, arr) => n + arr.filter(x => x.open).length, 0);
    const file = [...data.files][0];
    lines.push(`## ${comp} — [${rel(file)}](${rel(file)}) (${openCount} open)`);
    for (const [feature, list] of data.features) {
      const open = list.filter(x => x.open);
      lines.push(`- **${feature}** (${open.length})`);
      for (const it of open) {
        const due = it.tags.due || 'unscheduled';
        const prio = it.tags.priority || 'P2';
        const owner = it.tags.owner || '[TBD]';
        lines.push(`  - [ ] ${it.title} — due ${due} (priority ${prio}, owner ${owner})`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function updateStatusTodos(groups) {
  const statusPath = path.join(ROOT, 'status', 'status.json');
  let json;
  try { json = JSON.parse(await fs.readFile(statusPath, 'utf8')); } catch { return; }
  const compCounts = Object.fromEntries([...groups].map(([k, v]) => {
    const c = [...v.features.values()].reduce((n, arr) => n + arr.filter(x => x.open).length, 0);
    return [k, c];
  }));
  if (Array.isArray(json.components)) {
    json.components = json.components.map(c => ({
      ...c,
      todos_open: compCounts[c.name] != null ? compCounts[c.name] : (c.todos_open ?? 0)
    }));
  }
  json.last_updated = new Date().toISOString().replace(/\..+/, 'Z');
  await fs.writeFile(statusPath, JSON.stringify(json, null, 2) + '\n');
}

async function main() {
  const todos = await findTodoFiles(ROOT);
  const parsed = await Promise.all(todos.map(async f => [f, parseTodo(await fs.readFile(f, 'utf8'))]));
  const groups = groupByComponent(parsed);
  // Render TASKS.md
  const rollupPath = path.join(ROOT, 'TASKS.md');
  await fs.writeFile(rollupPath, renderTasksMd(groups) + '\n');
  // Update status todos_open and timestamp
  await updateStatusTodos(groups);
  console.log(`Updated TASKS.md and status/status.json from ${todos.length} TODO.md files.`);
}

main().catch(err => { console.error(err); process.exit(1); });
