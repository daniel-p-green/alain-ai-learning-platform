import { NextResponse } from "next/server";
import { ghEnv, listDir } from "@/lib/github";

export const runtime = "edge";

export async function GET() {
  const { owner, repo, branch, baseDir } = ghEnv();
  const files = await listDir(owner, repo, baseDir, branch);
  const items = files
    .filter((f) => f.name.endsWith(".ipynb"))
    .map((f) => ({ id: f.name.replace(/\.ipynb$/, ""), path: f.path }));
  return NextResponse.json({ items });
}

