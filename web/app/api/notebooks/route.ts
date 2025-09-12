import { NextResponse } from "next/server";
import { ghEnv, listDir, getFileContent } from "@/lib/github";
import { kvEnabled, kvGet, kvSet } from "@/lib/kv";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const withDetails = url.searchParams.get("details") === "1";
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 12)));
  const { owner, repo, branch, baseDir } = ghEnv();
  const indexKey = `notebooks:index:${owner}:${repo}:${branch}:${baseDir}`;
  const files = (await kvGet<any[]>(indexKey)) || await listDir(owner, repo, baseDir, branch);
  if (kvEnabled() && !(await kvGet<any[]>(indexKey))) await kvSet(indexKey, files, 120);
  const all = files.filter((f) => f.name.endsWith(".ipynb"));
  if (!withDetails) {
    const items = all.map((f) => ({ id: f.name.replace(/\.ipynb$/, ""), path: f.path }));
    return NextResponse.json({ items });
  }
  const head = all.slice(0, limit);
  const items = await Promise.all(
    head.map(async (f) => {
      try {
        const metaKey = `notebooks:meta:${owner}:${repo}:${branch}:${f.path}`;
        const cached = await kvGet<any>(metaKey);
        if (cached) return cached;
        const fc = await getFileContent(owner, repo, f.path, branch);
        if (!fc) return { id: f.name.replace(/\.ipynb$/, ""), path: f.path };
        const nb = JSON.parse(fc.content);
        const meta = nb?.metadata || {};
        const firstCell = Array.isArray(nb?.cells) ? nb.cells.find((c: any) => c.cell_type === 'markdown') : undefined;
        const excerpt = firstCell ? String(Array.isArray(firstCell.source) ? firstCell.source.join("") : firstCell.source).replace(/[#*>`\-]/g, '').slice(0, 180) : undefined;
        const item = {
          id: f.name.replace(/\.ipynb$/, ""),
          path: f.path,
          title: meta.title || nb?.metadata?.colab?.name || f.name,
          sourceType: meta.sourceType || "user",
          sourceOrg: meta.sourceOrg || undefined,
          tags: Array.isArray(meta.tags) ? meta.tags : [],
          published: !!meta.published,
          moderation: meta.moderation || undefined,
          excerpt,
        };
        if (kvEnabled()) await kvSet(metaKey, item, 300);
        return item;
      } catch {
        return { id: f.name.replace(/\.ipynb$/, ""), path: f.path };
      }
    })
  );
  return NextResponse.json({ items, total: all.length });
}
