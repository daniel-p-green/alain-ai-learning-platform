import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { kvEnabled, kvGet, kvSet } from '@/lib/kv';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const envRepo = process.env.GITHUB_REPO || '';
  const envBranch = process.env.GITHUB_BRANCH || '';
  const envNDir = process.env.NOTEBOOKS_DIR || '';
  const envLDir = process.env.LESSONS_DIR || '';
  const token = process.env.GITHUB_TOKEN || (kvEnabled() ? await kvGet<string>('secrets:github_token') : undefined) || '';
  let repo = envRepo;
  let branch = envBranch;
  let notebooksDir = envNDir;
  let lessonsDir = envLDir;
  if (kvEnabled()) {
    repo = (await kvGet<string>('secrets:github_repo')) || repo;
    branch = (await kvGet<string>('secrets:github_branch')) || branch;
    notebooksDir = (await kvGet<string>('secrets:notebooks_dir')) || notebooksDir;
    lessonsDir = (await kvGet<string>('secrets:lessons_dir')) || lessonsDir;
  }
  return NextResponse.json({
    hasToken: !!token,
    repo: repo || null,
    branch: branch || null,
    notebooksDir: notebooksDir || null,
    lessonsDir: lessonsDir || null,
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(()=>({}));
  const token = typeof body.token === 'string' ? body.token.trim() : undefined;
  const repo = typeof body.repo === 'string' ? body.repo.trim() : undefined;
  const branch = typeof body.branch === 'string' ? body.branch.trim() : undefined;
  const notebooksDir = typeof body.notebooksDir === 'string' ? body.notebooksDir.trim() : undefined;
  const lessonsDir = typeof body.lessonsDir === 'string' ? body.lessonsDir.trim() : undefined;
  if (!kvEnabled()) return NextResponse.json({ ok: false, error: 'kv_disabled' }, { status: 400 });
  if (typeof token === 'string') await kvSet('secrets:github_token', token);
  if (typeof repo === 'string') await kvSet('secrets:github_repo', repo);
  if (typeof branch === 'string') await kvSet('secrets:github_branch', branch);
  if (typeof notebooksDir === 'string') await kvSet('secrets:notebooks_dir', notebooksDir);
  if (typeof lessonsDir === 'string') await kvSet('secrets:lessons_dir', lessonsDir);
  return NextResponse.json({ ok: true });
}

