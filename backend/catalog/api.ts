import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "../tutorials/db";
import type { Visibility } from "./store";
import { requireUserId } from "../auth";

export const listPublicNotebooks = api<{
  model?: string; provider?: string; difficulty?: 'beginner'|'intermediate'|'advanced'; tag?: string;
}, { items: any[] }>(
  { expose: true, method: 'GET', path: '/catalog/notebooks/public' },
  async (req) => {
    const filters: string[] = ["visibility in ('public','unlisted')"]; const args: any[] = [];
    if (req.model) { args.push(req.model); filters.push(`model = $${args.length}`); }
    if (req.provider) { args.push(req.provider); filters.push(`provider = $${args.length}`); }
    if (req.difficulty) { args.push(req.difficulty); filters.push(`difficulty = $${args.length}`); }
    if (req.tag) { args.push(req.tag); filters.push(`$${args.length} = ANY(tags)`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const rows = await tutorialsDB.query<any>([
      `SELECT id, file_path, model, provider, difficulty, created_at, visibility, share_slug, tags, size_bytes
       FROM generated_notebooks ${where} ORDER BY created_at DESC`,
      ...args
    ]);
    return { items: rows } as any;
  }
);

export const publishNotebookApi = api<{
  file_path: string; visibility: Visibility;
}, { success: boolean; share_slug?: string | null }>(
  { expose: true, method: 'POST', path: '/catalog/notebooks/publish' },
  async (req, ctx) => {
    const userId = await requireUserId(ctx);
    if (!req.file_path) throw APIError.invalidArgument('file_path required');
    if (!['private','public','unlisted'].includes(req.visibility)) throw APIError.invalidArgument('invalid visibility');
    const existing = await tutorialsDB.queryRow<{ id: number; created_by: string | null }>`SELECT id, created_by FROM generated_notebooks WHERE file_path = ${req.file_path}`;
    if (!existing) throw APIError.notFound('notebook not indexed');
    if (existing.created_by && existing.created_by !== userId) throw APIError.permissionDenied('notebook not owned by user');
    const share = await tutorialsDB.queryRow<{ share_slug: string | null }>`
      UPDATE generated_notebooks SET visibility = ${req.visibility}, share_slug = COALESCE(share_slug, CASE WHEN ${req.visibility} = 'unlisted' THEN substr(md5(random()::text), 1, 8) ELSE NULL END)
      WHERE file_path = ${req.file_path} RETURNING share_slug`;
    return { success: true, share_slug: share?.share_slug || null };
  }
);

export const listPublicLessons = api<{
  model?: string; provider?: string; difficulty?: 'beginner'|'intermediate'|'advanced'; tag?: string;
}, { items: any[] }>(
  { expose: true, method: 'GET', path: '/catalog/lessons/public' },
  async (req) => {
    const filters: string[] = ["visibility in ('public','unlisted')"]; const args: any[] = [];
    if (req.model) { args.push(req.model); filters.push(`model = $${args.length}`); }
    if (req.provider) { args.push(req.provider); filters.push(`provider = $${args.length}`); }
    if (req.difficulty) { args.push(req.difficulty); filters.push(`difficulty = $${args.length}`); }
    if (req.tag) { args.push(req.tag); filters.push(`$${args.length} = ANY(tags)`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const rows = await tutorialsDB.query<any>([
      `SELECT id, file_path, model, provider, difficulty, created_at, visibility, share_slug, tags, size_bytes
       FROM generated_lessons ${where} ORDER BY created_at DESC`,
      ...args
    ]);
    return { items: rows } as any;
  }
);

export const publishLessonApi = api<{
  file_path: string; visibility: Visibility;
}, { success: boolean; share_slug?: string | null }>(
  { expose: true, method: 'POST', path: '/catalog/lessons/publish' },
  async (req, ctx) => {
    const userId = await requireUserId(ctx);
    if (!req.file_path) throw APIError.invalidArgument('file_path required');
    if (!['private','public','unlisted'].includes(req.visibility)) throw APIError.invalidArgument('invalid visibility');
    const existing = await tutorialsDB.queryRow<{ id: number; created_by: string | null }>`SELECT id, created_by FROM generated_lessons WHERE file_path = ${req.file_path}`;
    if (!existing) throw APIError.notFound('lesson not indexed');
    if (existing.created_by && existing.created_by !== userId) throw APIError.permissionDenied('lesson not owned by user');
    const share = await tutorialsDB.queryRow<{ share_slug: string | null }>`
      UPDATE generated_lessons SET visibility = ${req.visibility}, share_slug = COALESCE(share_slug, CASE WHEN ${req.visibility} = 'unlisted' THEN substr(md5(random()::text), 1, 8) ELSE NULL END)
      WHERE file_path = ${req.file_path} RETURNING share_slug`;
    return { success: true, share_slug: share?.share_slug || null };
  }
);

export const listMyNotebooks = api<{}, { items: any[] }>(
  { expose: true, method: 'GET', path: '/catalog/notebooks/mine' },
  async (_req, ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await tutorialsDB.query<any>([
      `SELECT id, file_path, model, provider, difficulty, created_at, visibility, share_slug, tags, size_bytes
       FROM generated_notebooks WHERE created_by = $1 ORDER BY created_at DESC`,
      userId
    ]);
    return { items: rows } as any;
  }
);
