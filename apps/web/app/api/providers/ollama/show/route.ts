export const runtime = 'nodejs';

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const name = urlObj.searchParams.get('name') || '';
  if (!name) return Response.json({ info: null }, { status: 200 });
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 1000);
    const resp = await fetch('http://localhost:11434/api/show', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal: ac.signal,
    });
    clearTimeout(t);
    if (!resp.ok) return Response.json({ info: null }, { status: 200 });
    const data = await resp.json().catch(() => ({} as any));
    const info = {
      parameters: (data as any)?.parameters || null,
      template: (data as any)?.template || null,
      context_length: Number((data as any)?.context_length || 0) || null,
    };
    return Response.json({ info }, { status: 200 });
  } catch {
    return Response.json({ info: null }, { status: 200 });
  }
}
