import { NextRequest } from "next/server";
import * as fs from 'fs/promises';
import * as path from 'path';

export const runtime = 'nodejs';

const BASE = path.join(process.cwd(), '..', '..', 'content', 'research');
const ALLOW = new Set([
  'research-data.json',
  'research-summary.v2.json',
  'model-card.md',
  'huggingface-info.md',
  'configs.md',
  'benchmarks.md',
  'usage-examples.md',
]);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provider = (url.searchParams.get('provider') || '').trim();
  const model = (url.searchParams.get('model') || '').trim();
  const file = (url.searchParams.get('file') || '').trim();
  if (!provider || !model) return new Response('provider and model required', { status: 400 });
  try {
    const dir = path.join(BASE, provider, model);
    const entries = await fs.readdir(dir).catch(() => [] as string[]);
    const files = entries.filter((n) => ALLOW.has(n));
    if (file) {
      if (!ALLOW.has(file)) return new Response('forbidden', { status: 403 });
      const p = path.join(dir, file);
      const isJson = file.endsWith('.json');
      // Read as UTF-8 string so Response body matches Web BodyInit typings
      const text = await fs.readFile(p, 'utf-8');
      const ct = isJson ? 'application/json' : 'text/markdown; charset=utf-8';
      return new Response(text, { headers: { 'Content-Type': ct, 'Cache-Control': 'no-store' } });
    }
    return Response.json({ success: true, files });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'failed' }, { status: 500 });
  }
}
