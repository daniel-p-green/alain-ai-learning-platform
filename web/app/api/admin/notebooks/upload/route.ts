import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { putNotebook, type NotebookMeta } from "@/lib/notebookStore";

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
  putNotebook({ meta, nb });
  return NextResponse.json({ ok: true, id, meta });
}

