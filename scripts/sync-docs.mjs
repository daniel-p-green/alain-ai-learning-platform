#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
const ROOT = path.resolve(__dirname, '..');

async function loadJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

function renderSpecMd(spec) {
  const lines = [];
  lines.push('# ALAIN Product Spec');
  lines.push('');
  lines.push('> Generated from specs/spec.json. Do not edit directly.');
  lines.push('');
  // Overview
  lines.push('## Overview');
  lines.push(spec.overview || '');
  lines.push('');
  // Architecture (optional)
  lines.push('## Architecture');
  lines.push('This section is not tracked in spec.json; see code references in docs/AGENTS.md and repository layout.');
  lines.push('');
  // Feature Spec
  lines.push('## Feature Spec');
  for (const f of spec.features || []) {
    lines.push(`### ${f.id} — ${f.name}`);
    lines.push(`- goal: ${f.description || ''}`);
    lines.push(`- owner: ${f.owner || '[TBD]'}`);
    lines.push(`- status_0_100: ${f.status_0_100 ?? 0}`);
    lines.push('- acceptance_criteria:');
    for (const ac of f.acceptance_criteria || []) lines.push(`  - ${ac}`);
    if (Array.isArray(f.evidence) && f.evidence.length) {
      lines.push('- evidence:');
      for (const e of f.evidence) lines.push(`  - ${e}`);
    }
    lines.push('');
  }
  // Non-goals, Risks, Open Questions
  lines.push('## Non-goals');
  for (const n of spec.non_goals || []) lines.push(`- ${n}`);
  lines.push('');
  lines.push('## Risks');
  for (const r of spec.risks || []) lines.push(`- ${r}`);
  lines.push('');
  lines.push('## Open Questions');
  for (const q of spec.open_questions || []) lines.push(`- ${q}`);
  lines.push('');
  lines.push('## Glossary');
  lines.push('See docs/AGENTS.md for agent terminology.');
  lines.push('');
  return lines.join('\n');
}

function renderStatusMd(status) {
  const lines = [];
  lines.push('# ALAIN Status');
  lines.push('');
  lines.push(`- **Last updated**: ${status.last_updated}`);
  lines.push('');
  lines.push('| Component | Kind | Status (0-100) | Rubric Notes | Evidence | Owner | Open TODOs |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const c of status.components || []) {
    const ev = Array.isArray(c.evidence) ? c.evidence.map(e => `\`${e}\``).join(', ') : '';
    lines.push(`| ${c.name} | ${c.kind} | ${c.status_0_100} | ${c.rubric_notes} | ${ev} | ${c.owner || '[TBD]'} | ${c.todos_open ?? 0} |`);
  }
  lines.push('');
  lines.push('### CI Snapshot');
  lines.push(`- passing: ${!!(status.ci && status.ci.passing)}`);
  lines.push(`- tests_total: ${(status.ci && status.ci.tests_total) ?? 0}`);
  lines.push(`- coverage: ${(status.ci && status.ci.coverage) ?? 0}`);
  return lines.join('\n');
}

async function syncAgentsTimestamp(statusJsonPath, agentsMdPath) {
  let status;
  try { status = JSON.parse(await fs.readFile(statusJsonPath, 'utf8')); } catch { return; }
  const stamp = status.last_updated || new Date().toISOString();
  let md;
  try { md = await fs.readFile(agentsMdPath, 'utf8'); } catch { return; }
  // Replace ISO-8601 timestamps in the summary table and Last_updated lines
  const isoRe = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g;
  const updated = md.replace(isoRe, stamp);
  if (updated !== md) {
    await fs.writeFile(agentsMdPath, updated);
  }
}

async function main() {
  const specPath = path.join(ROOT, 'specs', 'spec.json');
  const statusPath = path.join(ROOT, 'status', 'status.json');
  const spec = await loadJson(specPath);
  const status = await loadJson(statusPath);
  // Refresh status timestamp to now unless already present
  status.last_updated = new Date().toISOString().replace(/\..+/, 'Z');
  await fs.writeFile(statusPath, JSON.stringify(status, null, 2) + '\n');
  // Generate SPEC.md and status.md
  await fs.writeFile(path.join(ROOT, 'docs', 'SPEC.md'), renderSpecMd(spec) + '\n');
  await fs.writeFile(path.join(ROOT, 'status', 'status.md'), renderStatusMd(status) + '\n');
  // Nudge agents doc timestamps to match status
  await syncAgentsTimestamp(statusPath, path.join(ROOT, 'docs', 'AGENTS.md'));
  console.log('Synced docs: SPEC.md, status.md, and AGENTS timestamps.');
}

main().catch(err => { console.error(err); process.exit(1); });
