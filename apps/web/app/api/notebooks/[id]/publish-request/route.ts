import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ghEnv, getFileContent, getFileSha, putFile } from "@/lib/github";
import { putNotebook } from "@/lib/notebookStore";
import { kvEnabled, kvSet } from "@/lib/kv";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { owner, repo, branch, baseDir } = ghEnv();
  const path = `${baseDir}/${params.id}.ipynb`;
  const fc = await getFileContent(owner, repo, path, branch);
  if (!fc) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const nb = JSON.parse(fc.content);
    nb.metadata = { ...(nb.metadata || {}), moderation: 'pending', published: false, author: nb.metadata?.author || userId };
    const sha = await getFileSha(owner, repo, path, branch);
    const res = await putFile({ owner, repo, branch, path, content: JSON.stringify(nb, null, 2), message: `Publish request ${params.id}`, sha });
    const meta = { id: params.id, title: nb.metadata?.title || params.id, sourceType: nb.metadata?.sourceType || 'user', tags: nb.metadata?.tags || [], createdAt: new Date().toISOString() } as any;
    const stash = { meta, nb };
    putNotebook(stash);
    if (kvEnabled()) await kvSet(`notebook:${params.id}`, stash, 300);
    return NextResponse.json({ ok: true, path: res.content.path, commitUrl: (res as any).content?.html_url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 });
  }
}

