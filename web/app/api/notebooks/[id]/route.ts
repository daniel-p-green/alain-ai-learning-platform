import { NextResponse } from "next/server";
import { getNotebook, putNotebook, type NotebookMeta } from "@/lib/notebookStore";
import { ghEnv, getFileContent } from "@/lib/github";

export const runtime = "edge";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rec = getNotebook(params.id);
  if (rec) return NextResponse.json(rec);
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
    return NextResponse.json(stash);
  } catch {
    return NextResponse.json({ error: "invalid notebook" }, { status: 422 });
  }
}
