import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "../tutorials/db";
import type { Visibility } from "./store";
import { requireUserId } from "../auth";
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

export const listPublicNotebooks = api<{
  model?: string; provider?: string; difficulty?: 'beginner'|'intermediate'|'advanced'; tag?: string; limit?: number; offset?: number;
}, { items: any[] }>(
  { expose: true, method: 'GET', path: '/catalog/notebooks/public' },
  async (req) => {
    const filters: string[] = ["visibility in ('public','unlisted')"]; const args: any[] = [];
    if (req.model) { args.push(req.model); filters.push(`model = $${args.length}`); }
    if (req.provider) { args.push(req.provider); filters.push(`provider = $${args.length}`); }
    if (req.difficulty) { args.push(req.difficulty); filters.push(`difficulty = $${args.length}`); }
    if (req.tag) { args.push(req.tag); filters.push(`$${args.length} = ANY(tags)`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const limit = Math.max(1, Math.min(100, Number(req.limit || 20)));
    const offset = Math.max(0, Number(req.offset || 0));
    const rows = await tutorialsDB.query<any> ([
      `SELECT id, file_path, model, provider, difficulty, created_at, visibility, share_slug, tags, size_bytes
       FROM generated_notebooks ${where} ORDER BY created_at DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,
      ...args, limit, offset
    ]);
    return { items: rows } as any;
  }
);

export const publishNotebookApi = api<{
  file_path: string; visibility: Visibility;
}, { success: boolean; share_slug?: string | null }>(
  { expose: true, method: 'POST', path: '/catalog/notebooks/publish' },
  async (req) => {
    const userId = await requireUserId();
    if (!req.file_path) throw APIError.invalidArgument('file_path required');
    if (!['private','public','unlisted'].includes(req.visibility)) throw APIError.invalidArgument('invalid visibility');
    const existing = await tutorialsDB.queryRow<{ id: number; created_by: string | null }>`SELECT id, created_by FROM generated_notebooks WHERE file_path = ${req.file_path}`;
    if (!existing) throw APIError.notFound('notebook not indexed');
    const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(s=>s.trim()).filter(Boolean);
    const isAdmin = admins.includes(userId);
    if (!isAdmin && existing.created_by && existing.created_by !== userId) throw APIError.permissionDenied('notebook not owned by user');
    const share = await tutorialsDB.queryRow<{ share_slug: string | null }>`
      UPDATE generated_notebooks SET visibility = ${req.visibility}, share_slug = COALESCE(share_slug, CASE WHEN ${req.visibility} = 'unlisted' THEN substr(md5(random()::text), 1, 8) ELSE NULL END)
      WHERE file_path = ${req.file_path} RETURNING share_slug`;
    return { success: true, share_slug: share?.share_slug || null };
  }
);

// Import existing local notebooks under resources/content/notebooks into the catalog index.
// This lets us seed "base" notebooks without regenerating them.
export const importLocalNotebooks = api<{
  visibility?: Visibility; // default 'private'
  root?: string; // defaults to process.env.ALAIN_STORAGE_ROOT || 'resources/content'
}, { imported: number; updated: number; skipped: number; errors: number }>(
  { expose: true, method: 'POST', path: '/catalog/notebooks/import-local' },
  async (req) => {
    const userId = await requireUserId();
    // Admin‑gate the importer
    const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(s=>s.trim()).filter(Boolean);
    const isAdmin = admins.includes(userId);
    if (!isAdmin) throw APIError.permissionDenied('admin_only');

    const storageRoot = path.resolve(process.cwd(), req.root || process.env.ALAIN_STORAGE_ROOT || 'resources/content');
    const notebooksRoot = path.join(storageRoot, 'notebooks');
    const defaultVis: Visibility = (req.visibility && ['private','public','unlisted'].includes(req.visibility)) ? req.visibility : 'private';

    let imported = 0, updated = 0, skipped = 0, errors = 0;

    async function walk(dir: string): Promise<string[]> {
      const out: string[] = [];
      let entries: any[] = [];
      try { entries = await fs.readdir(dir, { withFileTypes: true }) as any[]; } catch { return out; }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          out.push(...await walk(full));
        } else if (e.isFile() && e.name.endsWith('.ipynb')) {
          out.push(full);
        }
      }
      return out;
    }

    function deriveFromPath(absPath: string): { provider: string; model: string; difficulty: 'beginner'|'intermediate'|'advanced'|null } {
      // Expect resources/content/notebooks/{provider}/{model}/[difficulty]/...
      const rel = path.relative(storageRoot, absPath).split(path.sep);
      const idx = rel.indexOf('notebooks');
      let provider = 'other'; let model = 'unknown'; let difficulty: any = null;
      if (idx !== -1) {
        provider = rel[idx+1] || provider;
        model = rel[idx+2] || model;
        const maybeDiff = rel[idx+3] || '';
        if (maybeDiff === 'beginner' || maybeDiff === 'intermediate' || maybeDiff === 'advanced') difficulty = maybeDiff;
      }
      return { provider, model, difficulty } as any;
    }

    async function readSiblingMeta(ipynbPath: string): Promise<{ difficulty?: any; tags?: string[] } | null> {
      // Look for filename.ipynb.meta.json next to the file
      try {
        const meta = await fs.readFile(ipynbPath + '.meta.json', 'utf8');
        return JSON.parse(meta);
      } catch { return null; }
    }

    async function readDirMetadata(dirPath: string, filename: string): Promise<{ difficulty?: any; tags?: string[] } | null> {
      // Look for a directory-level metadata.json with notebooks[] list
      try {
        const raw = await fs.readFile(path.join(dirPath, 'metadata.json'), 'utf8');
        const j = JSON.parse(raw);
        if (Array.isArray(j.notebooks)) {
          const ent = j.notebooks.find((n: any) => String(n.filename||'') === path.basename(filename));
          if (ent) return { difficulty: ent.difficulty, tags: Array.isArray(ent.tags) ? ent.tags : undefined };
        }
        return null;
      } catch { return null; }
    }

    function sha256(buf: Buffer | string): string {
      const h = createHash('sha256');
      h.update(buf);
      return h.digest('hex');
    }

    const files = await walk(notebooksRoot);
    for (const abs of files) {
      try {
        // Skip obviously temporary or export variants if needed (none for now)
        const { provider, model, difficulty } = deriveFromPath(abs);

        // Stats and checksum
        const data = await fs.readFile(abs);
        const size_bytes = data.byteLength;
        const checksum = sha256(data);

        // Derive difficulty and tags from metadata files if missing
        let diff = difficulty as any;
        let tags: string[] = [];
        const sib = await readSiblingMeta(abs);
        if (sib?.difficulty && !diff) diff = sib.difficulty;
        if (sib?.tags) tags = sib.tags;
        if (!diff) {
          const dirMeta = await readDirMetadata(path.dirname(abs), path.basename(abs));
          if (dirMeta?.difficulty) diff = dirMeta.difficulty;
          if (dirMeta?.tags) tags = dirMeta.tags;
        }
        if (diff !== 'beginner' && diff !== 'intermediate' && diff !== 'advanced') diff = 'beginner';

        // Use repo‑relative path for web download API compatibility
        const relFromRoot = path.relative(process.cwd(), path.resolve(storageRoot, path.relative(storageRoot, abs))).replace(/\\/g, '/');
        // Ensure it starts with 'resources/content/' for web download route
        let dbPath = relFromRoot;
        if (!dbPath.startsWith('resources/content/')) {
          const relWithinContent = path.relative(storageRoot, abs).replace(/\\/g, '/');
          dbPath = `resources/content/${relWithinContent}`;
        }

        // Upsert into catalog
        const existing = await tutorialsDB.queryRow<{ id: number; checksum?: string }>`
          SELECT id, checksum FROM generated_notebooks WHERE file_path = ${dbPath}
        `;
        const vis = defaultVis;
        const res = await tutorialsDB.exec`
          INSERT INTO generated_notebooks (file_path, model, provider, difficulty, created_by, visibility, tags, size_bytes, checksum)
          VALUES (${dbPath}, ${model}, ${provider}, ${diff}, ${userId}, ${vis}, ${tags}, ${size_bytes}, ${checksum})
          ON CONFLICT (file_path) DO UPDATE SET
            model = EXCLUDED.model,
            provider = EXCLUDED.provider,
            difficulty = EXCLUDED.difficulty,
            created_by = COALESCE(generated_notebooks.created_by, EXCLUDED.created_by),
            visibility = COALESCE(generated_notebooks.visibility, EXCLUDED.visibility),
            tags = EXCLUDED.tags,
            size_bytes = EXCLUDED.size_bytes,
            checksum = EXCLUDED.checksum
        `;
        if (existing) {
          updated++;
        } else {
          imported++;
        }
      } catch (e) {
        errors++;
      }
    }

    return { imported, updated, skipped, errors } as any;
  }
);

export const listPublicLessons = api<{
  model?: string; provider?: string; difficulty?: 'beginner'|'intermediate'|'advanced'; tag?: string; limit?: number; offset?: number;
}, { items: any[] }>(
  { expose: true, method: 'GET', path: '/catalog/lessons/public' },
  async (req) => {
    const filters: string[] = ["visibility in ('public','unlisted')"]; const args: any[] = [];
    if (req.model) { args.push(req.model); filters.push(`model = $${args.length}`); }
    if (req.provider) { args.push(req.provider); filters.push(`provider = $${args.length}`); }
    if (req.difficulty) { args.push(req.difficulty); filters.push(`difficulty = $${args.length}`); }
    if (req.tag) { args.push(req.tag); filters.push(`$${args.length} = ANY(tags)`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const limit = Math.max(1, Math.min(100, Number(req.limit || 20)));
    const offset = Math.max(0, Number(req.offset || 0));
    const rows = await tutorialsDB.query<any>([
      `SELECT id, file_path, model, provider, difficulty, created_at, visibility, share_slug, tags, size_bytes
       FROM generated_lessons ${where} ORDER BY created_at DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,
      ...args, limit, offset
    ]);
    return { items: rows } as any;
  }
);

export const publishLessonApi = api<{
  file_path: string; visibility: Visibility;
}, { success: boolean; share_slug?: string | null }>(
  { expose: true, method: 'POST', path: '/catalog/lessons/publish' },
  async (req) => {
    const userId = await requireUserId();
    if (!req.file_path) throw APIError.invalidArgument('file_path required');
    if (!['private','public','unlisted'].includes(req.visibility)) throw APIError.invalidArgument('invalid visibility');
    const existing = await tutorialsDB.queryRow<{ id: number; created_by: string | null }>`SELECT id, created_by FROM generated_lessons WHERE file_path = ${req.file_path}`;
    if (!existing) throw APIError.notFound('lesson not indexed');
    const admins2 = (process.env.ADMIN_USER_IDS || '').split(',').map(s=>s.trim()).filter(Boolean);
    const isAdmin2 = admins2.includes(userId);
    if (!isAdmin2 && existing.created_by && existing.created_by !== userId) throw APIError.permissionDenied('lesson not owned by user');
    const share = await tutorialsDB.queryRow<{ share_slug: string | null }>`
      UPDATE generated_lessons SET visibility = ${req.visibility}, share_slug = COALESCE(share_slug, CASE WHEN ${req.visibility} = 'unlisted' THEN substr(md5(random()::text), 1, 8) ELSE NULL END)
      WHERE file_path = ${req.file_path} RETURNING share_slug`;
    return { success: true, share_slug: share?.share_slug || null };
  }
);

export const listMyNotebooks = api<{}, { items: any[] }>(
  { expose: true, method: 'GET', path: '/catalog/notebooks/mine' },
  async (_req) => {
    const userId = await requireUserId();
    const rows = await tutorialsDB.query<any>([
      `SELECT id, file_path, model, provider, difficulty, created_at, visibility, share_slug, tags, size_bytes
       FROM generated_notebooks WHERE created_by = $1 ORDER BY created_at DESC`,
      userId
    ]);
    return { items: rows } as any;
  }
);
