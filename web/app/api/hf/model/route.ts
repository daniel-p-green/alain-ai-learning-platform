export const runtime = 'nodejs';

// Simple in-memory cache with TTL to reduce HF calls
const cache = new Map<string, { data: any; ts: number }>();
const TTL_MS = 5 * 60_000; // 5 minutes

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

  // Serve from cache if fresh
  const now = Date.now();
  const c = cache.get(repo);
  if (c && now - c.ts < TTL_MS) {
    return Response.json(c.data, { status: 200 });
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 1000);
  try {
    const resp = await fetch(apiUrl, {
      headers: { 'User-Agent': 'ALAIN-Model-Info/1.0' },
      signal: ac.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      console.error(`[hf/model] HF responded ${resp.status} for ${repo}`);
      return Response.json({ license: null, tags: [], downloads: null }, { status: 200 });
    }
    const data = await resp.json().catch(() => ({} as any));
    const license = (data as any)?.license || null;
    const tags = Array.isArray((data as any)?.tags) ? (data as any).tags.slice(0, 20) : [];
    const downloads = (data as any)?.downloads || null;
    const payload = { license, tags, downloads };
    cache.set(repo, { data: payload, ts: now });
    return Response.json(payload, { status: 200 });
  } catch {
    clearTimeout(timer);
    console.error(`[hf/model] Timeout or fetch error for ${repo}`);
    return Response.json({ license: null, tags: [], downloads: null }, { status: 200 });
  }
}
