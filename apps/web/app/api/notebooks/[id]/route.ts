import { NextResponse } from "next/server";
import { getNotebook, putNotebook, type NotebookMeta } from "@/lib/notebookStore";
import { parseGhId, fetchPublicNotebook } from "@/lib/githubRaw";
import { ghEnv, getFileContent } from "@/lib/github";
import { kvEnabled, kvGet, kvSet } from "@/lib/kv";

export const runtime = "edge";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rec = getNotebook(params.id);
  if (rec) return NextResponse.json(rec);
  // Support GitHub-backed IDs without server persistence
  const gh = parseGhId(params.id);
  if (gh) {
    try {
      const { nb, meta } = await fetchPublicNotebook(gh);
      const stash = { meta: { ...meta, sourceType: 'github', tags: [], createdAt: new Date().toISOString() }, nb } as any;
      // Do not persist by default; viewer can opt-in to save
      return NextResponse.json(stash);
    } catch (e: any) {
      const msg = e?.message || 'github_error';
      const status = msg.startsWith('github_raw:') ? Number(msg.split(':')[1] || 502) : (msg === 'file_too_large' ? 413 : (msg === 'invalid_notebook' ? 422 : 502));
      return NextResponse.json({ error: msg }, { status });
    }
  }
  const kvKey = `notebook:${params.id}`;
  const cached = await kvGet<any>(kvKey);
  if (cached) return NextResponse.json(cached);
  // Try GitHub read-through
  const { owner, repo, branch, baseDir } = ghEnv();
  const path = `${baseDir}/${params.id}.ipynb`;
  const file = await getFileContent(owner, repo, path, branch);
  if (!file) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const nb = JSON.parse(file.content);
    const title = nb?.metadata?.title || nb?.metadata?.colab?.name || params.id;
    const meta: NotebookMeta = {
      id: params.id,
      title,
      sourceType: "user",
      tags: [],
      createdAt: new Date().toISOString(),
    };
    const stash = { meta, nb };
    putNotebook(stash);
    if (kvEnabled()) await kvSet(kvKey, stash, 300);
    return NextResponse.json(stash);
  } catch {
    return NextResponse.json({ error: "invalid notebook" }, { status: 422 });
  }
}
