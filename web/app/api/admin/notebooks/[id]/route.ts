import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getNotebook, putNotebook } from "@/lib/notebookStore";
import { ghEnv, getFileSha, putFile } from "@/lib/github";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = params;
  let nb: any;
  try {
    nb = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const existing = getNotebook(id);
  const title = existing?.meta.title || `Notebook ${id}`;
  try {
    const { owner, repo, branch, baseDir } = ghEnv();
    const path = `${baseDir}/${id}.ipynb`;
    const sha = await getFileSha(owner, repo, path, branch);
    const res = await putFile({ owner, repo, branch, path, content: JSON.stringify(nb, null, 2), message: `Update notebook ${id}: ${title}`, sha });
    if (existing) putNotebook({ meta: existing.meta, nb });
    return NextResponse.json({ ok: true, path: res.content.path });
  } catch (e: any) {
    return NextResponse.json({ error: `github: ${e.message}` }, { status: 500 });
  }
}

