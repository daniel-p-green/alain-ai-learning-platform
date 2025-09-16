export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = String((body as any).url || '').trim();
    if (!url) return Response.json({ error: 'missing url' }, { status: 400 });
    const id = 'ext-' + Math.random().toString(36).slice(2, 10);
    return Response.json({ ok: true, id, sourceUrl: url, annotateOnly: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'ingest failed' }, { status: 500 });
  }
}

