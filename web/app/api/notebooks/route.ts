import { NextResponse } from "next/server";
import { ghEnv, listDir, getFileContent } from "@/lib/github";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const withDetails = url.searchParams.get("details") === "1";
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 12)));
  const { owner, repo, branch, baseDir } = ghEnv();
  const files = await listDir(owner, repo, baseDir, branch);
  const all = files.filter((f) => f.name.endsWith(".ipynb"));
  if (!withDetails) {
    const items = all.map((f) => ({ id: f.name.replace(/\.ipynb$/, ""), path: f.path }));
    return NextResponse.json({ items });
  }
  const head = all.slice(0, limit);
  const items = await Promise.all(
    head.map(async (f) => {
      try {
        const fc = await getFileContent(owner, repo, f.path, branch);
        if (!fc) return { id: f.name.replace(/\.ipynb$/, ""), path: f.path };
        const nb = JSON.parse(fc.content);
        const meta = nb?.metadata || {};
        return {
          id: f.name.replace(/\.ipynb$/, ""),
          path: f.path,
          title: meta.title || nb?.metadata?.colab?.name || f.name,
          sourceType: meta.sourceType || "user",
          sourceOrg: meta.sourceOrg || undefined,
          tags: Array.isArray(meta.tags) ? meta.tags : [],
          published: !!meta.published,
        };
      } catch {
        return { id: f.name.replace(/\.ipynb$/, ""), path: f.path };
      }
    })
  );
  return NextResponse.json({ items, total: all.length });
}
