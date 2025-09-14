import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";
import { requireUserId } from "../auth";

type Visibility = 'private' | 'public' | 'unlisted';

export const listPublicTutorials = api<{
  model?: string; provider?: string; difficulty?: 'beginner'|'intermediate'|'advanced'; tag?: string;
}, { items: any[] }>(
  { expose: true, method: 'GET', path: '/tutorials/public' },
  async (req) => {
    const filters: string[] = ["visibility in ('public','unlisted')"]; const args: any[] = [];
    if (req.model) { args.push(req.model); filters.push(`model = $${args.length}`); }
    if (req.provider) { args.push(req.provider); filters.push(`provider = $${args.length}`); }
    if (req.difficulty) { args.push(req.difficulty); filters.push(`difficulty = $${args.length}`); }
    if (req.tag) { args.push(req.tag); filters.push(`$${args.length} = ANY(tags)`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const rows = await tutorialsDB.query<any>([
      `SELECT id, title, description, model, provider, difficulty, created_at, visibility, share_slug, tags FROM tutorials ${where} ORDER BY created_at DESC`,
      ...args
    ]);
    return { items: rows } as any;
  }
);

export const publishTutorial = api<{ id: number; visibility: Visibility }, { success: boolean; share_slug?: string | null }>(
  { expose: true, method: 'POST', path: '/tutorials/:id/publish' },
  async (req, ctx) => {
    const userId = await requireUserId(ctx);
    if (!req.id) throw APIError.invalidArgument('id required');
    if (!['private','public','unlisted'].includes(req.visibility)) throw APIError.invalidArgument('invalid visibility');
    const exists = await tutorialsDB.queryRow<{ id: number; author_id: string | null }>`SELECT id, author_id FROM tutorials WHERE id = ${req.id}`;
    if (!exists) throw APIError.notFound('tutorial not found');
    if (exists.author_id && exists.author_id !== userId) throw APIError.permissionDenied('tutorial not owned by user');
    const share = await tutorialsDB.queryRow<{ share_slug: string | null }>`
      UPDATE tutorials SET visibility = ${req.visibility}, share_slug = COALESCE(share_slug, CASE WHEN ${req.visibility} = 'unlisted' THEN substr(md5(random()::text), 1, 8) ELSE NULL END), updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING share_slug`;
    return { success: true, share_slug: share?.share_slug || null };
  }
);
