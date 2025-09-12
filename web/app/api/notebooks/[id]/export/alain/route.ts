import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNotebook } from "@/lib/notebookStore";
import { ghEnv, getFileContent, getBranchHeadSha, createBranch, putFile, createPullRequest } from "@/lib/github";

export const runtime = "nodejs";

function toAlainLesson(id: string, nb: any) {
  const cells = Array.isArray(nb?.cells) ? nb.cells : [];
  const meta = nb?.metadata || {};
  return {
    id,
    title: meta.title || id,
    sourceType: meta.sourceType || 'user',
    sourceOrg: meta.sourceOrg || undefined,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    license: meta.license || undefined,
    provenance_url: meta.provenance_url || undefined,
    steps: cells.map((c: any) => {
      if (c.cell_type === 'markdown') return { type: 'markdown', text: Array.isArray(c.source) ? c.source.join('') : c.source };
      if (c.cell_type === 'code') return { type: 'code', lang: c.metadata?.lang || 'python', source: Array.isArray(c.source) ? c.source.join('') : c.source };
      return { type: 'other' as const };
    }),
  };
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { owner, repo, branch, baseDir } = ghEnv();
  // Load notebook (memory or GitHub)
  const mem = getNotebook(params.id);
  let nb: any | null = mem?.nb || null;
  if (!nb) {
    const path = `${baseDir}/${params.id}.ipynb`;
    const fc = await getFileContent(owner, repo, path, branch);
    if (!fc) return NextResponse.json({ error: "not found" }, { status: 404 });
    try { nb = JSON.parse(fc.content); } catch { return NextResponse.json({ error: "invalid notebook" }, { status: 422 }); }
  }
  const lesson = toAlainLesson(params.id, nb);
  const lessonsDir = process.env.LESSONS_DIR || 'alain-lessons';
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
  const newBranch = `export/alain-${params.id}-${ts}`;
  try {
    const baseSha = await getBranchHeadSha(owner, repo, branch);
    await createBranch(owner, repo, newBranch, baseSha);
  } catch (e: any) {
    // Branch may already exist; ignore
  }
  const path = `${lessonsDir}/${params.id}.json`;
  const put = await putFile({ owner, repo, branch: newBranch, path, content: JSON.stringify(lesson, null, 2), message: `export(alain): ${params.id} → ${path}` });
  const pr = await createPullRequest(owner, repo, branch, newBranch, `Export ALAIN lesson: ${lesson.title}`, `This PR adds an ALAIN lesson JSON exported from notebook ${params.id}.\n\n- Path: ${path}\n- Author: ${userId}`);
  return NextResponse.json({ ok: true, branch: newBranch, path: put.content.path, prUrl: (pr as any).html_url || (pr as any).url });
}

