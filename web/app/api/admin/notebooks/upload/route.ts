import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { putNotebook, type NotebookMeta } from "@/lib/notebookStore";
import { ghEnv, getFileSha, putFile } from "@/lib/github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }
  const form = await (req as any).formData();
  const file = form.get("file");
  const title = String(form.get("title") || "Untitled Notebook");
  const sourceType = String(form.get("sourceType") || "user") as "company" | "user";
  const sourceOrg = form.get("sourceOrg") ? String(form.get("sourceOrg")) : undefined;
  const license = form.get("license") ? String(form.get("license")) : undefined;
  const provenanceUrl = form.get("provenanceUrl") ? String(form.get("provenanceUrl")) : undefined;
  const published = (String(form.get("published") || "false").toLowerCase() === "true");
  const tags = String(form.get("tags") || "").split(",").map(t => t.trim()).filter(Boolean);

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  const buf = Buffer.from(await (file as File).arrayBuffer());
  let nb: any;
  try {
    nb = JSON.parse(buf.toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "invalid JSON .ipynb" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const meta: NotebookMeta = {
    id,
    title,
    sourceType,
    sourceOrg,
    tags,
    createdAt: new Date().toISOString(),
  };
  // Persist to GitHub repo, embedding metadata in nb.metadata
  try {
    nb.metadata = {
      ...(nb.metadata || {}),
      title,
      sourceType,
      sourceOrg,
      tags,
      license,
      provenance_url: provenanceUrl,
      published,
    };
    const { owner, repo, branch, baseDir } = ghEnv();
    const path = `${baseDir}/${id}.ipynb`;
    const existingSha = await getFileSha(owner, repo, path, branch);
    const res = await putFile({ owner, repo, branch, path, content: JSON.stringify(nb, null, 2), message: `Add notebook ${id}: ${title}`, sha: existingSha });
    // Stash to memory for fast read
    putNotebook({ meta, nb });
    return NextResponse.json({ ok: true, id, meta, path: res.content.path, commitUrl: (res as any).content?.html_url });
  } catch (e: any) {
    return NextResponse.json({ error: `github: ${e.message}` }, { status: 500 });
  }
}
