export const runtime = 'nodejs';

export async function GET() {
  const url = 'http://localhost:11434/api/tags';
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 1000);
    const resp = await fetch(url, { method: 'GET', signal: ac.signal });
    clearTimeout(t);
    if (!resp.ok) return Response.json({ models: [] }, { status: 200 });
    const data = await resp.json().catch(() => ({ models: [] }));
    const models = Array.isArray((data as any)?.models)
      ? (data as any).models
          .map((m: any) => ({ name: String(m?.name || ''), size: Number(m?.size || 0), modified_at: m?.modified_at || null }))
          .filter((m: any) => m.name)
      : [];
    return Response.json({ models }, { status: 200 });
  } catch {
    return Response.json({ models: [] }, { status: 200 });
  }
}
