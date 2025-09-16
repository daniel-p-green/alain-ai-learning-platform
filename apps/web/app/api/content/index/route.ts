import { NextRequest } from "next/server";
import * as fs from 'fs/promises';
import * as path from 'path';

export const runtime = 'nodejs';

type ModelIndex = {
  provider: string;
  model: string;
  notebooks?: { count: number; difficulties: string[]; latest?: string };
  lessons?: { count: number; latest?: string };
  research?: { hasJson: boolean; mdFiles: string[] };
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const flat = url.searchParams.get('flat') === '1';
  try {
    const repoRoot = path.join(process.cwd(), '..', '..');
    const contentDir = path.join(repoRoot, 'resources', 'content');

    const notebooksDir = path.join(contentDir, 'notebooks');
    const lessonsDir = path.join(contentDir, 'lessons');
    const researchDir = path.join(contentDir, 'research');

    const indexMap = new Map<string, ModelIndex>();

    // Helper to upsert entry
    const up = (provider: string, model: string): ModelIndex => {
      const key = `${provider}::${model}`;
      let e = indexMap.get(key);
      if (!e) {
        e = { provider, model };
        indexMap.set(key, e);
      }
      return e;
    };

    // Scan notebooks: resources/content/notebooks/<provider>/<model>/<difficulty>/<date>/*
    await scanIfExists(notebooksDir, async (provider, model, modelPath) => {
      const difficulties = await listDirs(modelPath);
      let total = 0;
      let latest: string | undefined;
      for (const diff of difficulties) {
        const diffPath = path.join(modelPath, diff);
        const dates = await listDirs(diffPath);
        for (const d of dates) {
          const datePath = path.join(diffPath, d);
          const files = await listFiles(datePath);
          // exclude metadata files
          const core = files.filter(f => !f.endsWith('.meta.json'));
          total += core.length;
          // track latest modification based on directory name (YYYY-MM-DD) then file mtime
          if (!latest || d > latest) latest = d;
        }
      }
      const entry = up(provider, model);
      entry.notebooks = { count: total, difficulties, latest };
    });

    // Scan lessons: resources/content/lessons/<provider>/<model>/<date>/lesson_*.json
    await scanIfExists(lessonsDir, async (provider, model, modelPath) => {
      const dates = await listDirs(modelPath);
      let total = 0;
      let latest: string | undefined;
      for (const d of dates) {
        const datePath = path.join(modelPath, d);
        const files = await listFiles(datePath);
        const core = files.filter(f => f.startsWith('lesson_') && f.endsWith('.json'));
        total += core.length;
        if (!latest || d > latest) latest = d;
      }
      const entry = up(provider, model);
      entry.lessons = { count: total, latest };
    });

    // Scan research: resources/content/research/<provider>/<model>/
    await scanIfExists(researchDir, async (provider, model, modelPath) => {
      const files = await listFiles(modelPath).catch(() => [] as string[]);
      const hasJson = files.includes('research-data.json');
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const entry = up(provider, model);
      entry.research = { hasJson, mdFiles };
    });

    if (flat) {
      return Response.json({ items: Array.from(indexMap.values()) });
    }
    // Grouped response: providers -> models -> sections
    const grouped: Record<string, Record<string, Omit<ModelIndex, 'provider'|'model'>>> = {};
    for (const e of indexMap.values()) {
      grouped[e.provider] ||= {};
      grouped[e.provider][e.model] = {
        notebooks: e.notebooks,
        lessons: e.lessons,
        research: e.research,
      };
    }
    return Response.json({ providers: grouped });
  } catch (e: any) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

async function scanIfExists(root: string, onModel: (provider: string, model: string, modelPath: string) => Promise<void>) {
  const providers = await listDirs(root).catch(() => [] as string[]);
  for (const provider of providers) {
    const provPath = path.join(root, provider);
    const models = await listDirs(provPath).catch(() => [] as string[]);
    for (const model of models) {
      await onModel(provider, model, path.join(provPath, model));
    }
  }
}

async function listDirs(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) if (e.isDirectory()) out.push(e.name);
  out.sort();
  return out;
}

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) if (e.isFile()) out.push(e.name);
  out.sort();
  return out;
}

