import { kvEnabled, kvGet, kvSet } from "@/lib/kv";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const id = String((body as any).id || '').trim();
    if (!id.startsWith('gh:')) return Response.json({ error: 'only_github_ids_supported' }, { status: 400 });
    const key = 'lib:index';
    const item = { id, addedAt: new Date().toISOString() };
    if (!kvEnabled()) return Response.json({ ok: true, warning: 'kv_disabled_not_persisted', item });
    const cur = (await kvGet<any[]>(key)) || [];
    if (!cur.find(x => x.id === id)) cur.push(item);
    await kvSet(key, cur);
    return Response.json({ ok: true, item });
  } catch (e:any) {
    return Response.json({ error: e?.message || 'error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

