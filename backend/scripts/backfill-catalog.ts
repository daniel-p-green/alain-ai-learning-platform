#!/usr/bin/env bun
/**
 * Catalog Backfill Script
 * Scans content/notebooks and content/lessons and indexes items into generated_notebooks and generated_lessons.
 * Usage: bun backend/scripts/backfill-catalog.ts
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { tutorialsDB } from '../tutorials/db';

type Meta = { size_bytes?: number; checksum?: string; tags?: string[]; difficulty?: string; provider?: string; model_id?: string };

function walk(dir: string, acc: string[] = []): string[] {
  try {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p, acc); else acc.push(p);
    }
  } catch {}
  return acc;
}

async function backfillNotebooks(contentRoot: string) {
  const root = join(contentRoot, 'notebooks');
  const files = walk(root).filter(p => p.endsWith('.meta.json'));
  for (const metaPath of files) {
    try {
      const base = metaPath.slice(0, -('.meta.json'.length));
      const meta: Meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      // Infer model/provider/difficulty from path segments: notebooks/<provider>/<model>/<difficulty>/<date>/file
      const rel = base.replace(contentRoot + '/', '');
      const parts = rel.split('/');
      if (parts.length < 6) continue; // notebooks, provider, model, difficulty, date, file
      const provider = parts[1];
      const model = parts[2];
      const difficulty = parts[3] as any;
      await tutorialsDB.exec`
        INSERT INTO generated_notebooks (file_path, model, provider, difficulty, created_by, visibility, tags, size_bytes, checksum)
        VALUES (${rel.replace('.ipynb','') + '.ipynb'}, ${model}, ${provider}, ${difficulty}, NULL, 'private', ${meta.tags || []}, ${meta.size_bytes || null}, ${meta.checksum || null})
        ON CONFLICT (file_path) DO UPDATE SET tags = EXCLUDED.tags, size_bytes = EXCLUDED.size_bytes, checksum = EXCLUDED.checksum`;
    } catch {}
  }
}

async function backfillLessons(contentRoot: string) {
  const root = join(contentRoot, 'lessons');
  const files = walk(root).filter(p => p.endsWith('.meta.json'));
  for (const metaPath of files) {
    try {
      const base = metaPath.slice(0, -('.meta.json'.length));
      const jsonPath = base;
      const meta: Meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      // lessons/<provider>/<model>/<date>/lesson_<id>.json
      const rel = jsonPath.replace(contentRoot + '/', '');
      const parts = rel.split('/');
      if (parts.length < 5) continue;
      const provider = parts[1];
      const model = parts[2];
      // Difficulty is not always known for lessons; default to intermediate
      const difficulty = (meta.difficulty as any) || 'intermediate';
      await tutorialsDB.exec`
        INSERT INTO generated_lessons (file_path, model, provider, difficulty, created_by, visibility, tags, size_bytes, checksum)
        VALUES (${rel}, ${model}, ${provider}, ${difficulty}, NULL, 'private', ${meta.tags || []}, ${meta.size_bytes || null}, ${meta.checksum || null})
        ON CONFLICT (file_path) DO UPDATE SET tags = EXCLUDED.tags, size_bytes = EXCLUDED.size_bytes, checksum = EXCLUDED.checksum`;
    } catch {}
  }
}

async function main() {
  const contentRoot = resolve(process.cwd(), '..', 'content');
  console.log('Backfilling from', contentRoot);
  await backfillNotebooks(contentRoot);
  await backfillLessons(contentRoot);
  console.log('✅ Backfill complete');
}

main().catch((e) => { console.error('Backfill failed:', e); process.exit(1); });

