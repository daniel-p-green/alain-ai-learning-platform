export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Check offline mode via backend probe routed through web API
  try {
    const probeUrl = new URL('/api/setup', req.url);
    const probe = await fetch(probeUrl.toString(), { cache: 'no-store' });
    const probeData = await probe.json().catch(() => ({} as any));
    if ((probeData as any)?.offlineMode === true) {
      return Response.json({ disabled: true }, { status: 200 });
    }
  } catch {}

  const url = new URL(req.url);
  const repo = (url.searchParams.get('repo') || '').trim();
  if (!/^\S+\/\S+$/.test(repo)) {
    return Response.json({ error: 'invalid repo (expected owner/name)' }, { status: 400 });
  }

  const apiUrl = 'https://huggingface.co/api/models/' + encodeURIComponent(repo);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 1000);
  try {
    const resp = await fetch(apiUrl, {
      headers: { 'User-Agent': 'ALAIN-Model-Info/1.0' },
      signal: ac.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return Response.json({ license: null, tags: [], downloads: null }, { status: 200 });
    const data = await resp.json().catch(() => ({} as any));
    const license = (data as any)?.license || null;
    const tags = Array.isArray((data as any)?.tags) ? (data as any).tags.slice(0, 20) : [];
    const downloads = (data as any)?.downloads || null;
    return Response.json({ license, tags, downloads }, { status: 200 });
  } catch {
    clearTimeout(timer);
    return Response.json({ license: null, tags: [], downloads: null }, { status: 200 });
  }
}

