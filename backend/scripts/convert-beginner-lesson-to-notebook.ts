#!/usr/bin/env tsx
/**
 * Convert the latest beginner-lesson-raw-*.json into a Jupyter notebook
 * and save it under content/notebooks/openai/gpt-oss-20b (metadata.json updated).
 *
 * Run from repo root or backend dir, e.g.:
 *   cd alain-ai-learning-platform && bun backend/scripts/convert-beginner-lesson-to-notebook.ts
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { buildNotebook } from '../export/notebook';
import { saveNotebookWithMetadata } from '../utils/notebook-paths';

type Step = { step_order: number; title: string; content: string; code_template?: string | null; model_params?: any };
type Assessment = { step_order: number; question: string; options: string[]; correct_index: number; explanation?: string | null };
type Maker = { name: string; org_type: string; homepage?: string | null; license?: string | null; repo?: string | null };

async function main() {
  const repoRoot = process.cwd();
  // Prefer in-repo logs; fallback to parent-level logs (some scripts saved there)
  const inRepo = join(repoRoot, 'hackathon-notes', 'test-log-output');
  const parent = join(repoRoot, '..', 'hackathon-notes', 'test-log-output');
  let outDir = inRepo;
  let files: string[] = [];
  try { files = await fs.readdir(outDir); } catch {}
  let candidates = files.filter(f => /^beginner-lesson-raw-\d+\.json$/.test(f));
  if (candidates.length === 0) {
    outDir = parent;
    try { files = await fs.readdir(outDir); } catch {}
    candidates = files.filter(f => /^beginner-lesson-raw-\d+\.json$/.test(f));
  }
  // re-use candidates discovered above
  if (candidates.length === 0) {
    console.error('No beginner-lesson-raw-*.json files found in', outDir);
    process.exit(1);
  }
  candidates.sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const latest = candidates[candidates.length - 1];
  const fullPath = join(outDir, latest);
  const raw = JSON.parse(await fs.readFile(fullPath, 'utf-8'));

  const lesson = raw.lesson as {
    title: string;
    description: string;
    learning_objectives?: string[];
    steps: Step[];
    assessments?: Assessment[];
    model_maker?: Maker;
  } | undefined;
  if (!lesson || !Array.isArray(lesson.steps)) {
    console.error('File does not contain a parsable lesson with steps:', fullPath);
    process.exit(1);
  }

  // Normalize fields
  const model = String(raw.model || 'gpt-oss-20b');
  const provider = 'openai-compatible';
  const steps: Step[] = (lesson.steps || []).map(s => ({
    step_order: Number(s.step_order || 1),
    title: s.title || 'Untitled',
    content: s.content || '',
    code_template: (s as any).code_template ?? null,
    model_params: s.model_params || { temperature: 0.7 },
  }));
  const assessments: Assessment[] = Array.isArray(lesson.assessments) ? lesson.assessments : [];
  const maker: Maker | undefined = lesson.model_maker;

  const nb = buildNotebook(
    { title: lesson.title, description: lesson.description || '', provider, model },
    steps as any,
    assessments as any,
    maker || undefined,
    'GPT-OSS-20B',
    false
  );

  // Save under repo content/… (go up one level from backend to repo root for save util)
  const savedPath = saveNotebookWithMetadata(
    nb,
    { model, title: lesson.title, difficulty: 'beginner', tags: ['alain', 'beginner', 'gpt-oss-20b'] },
    maker || undefined,
    repoRoot
  );

  console.log('✅ Notebook saved to:', savedPath);
}

main().catch(err => { console.error('Convert failed:', err); process.exit(1); });
