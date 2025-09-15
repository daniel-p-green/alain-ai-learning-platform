import { backendUrl } from '@/lib/backend';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const upstream = backendUrl(`/catalog/notebooks/public${qs ? '?' + qs : ''}`);
  const resp = await fetch(upstream, { cache: 'no-store' });
  const data = await resp.json().catch(() => null);
  return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
}

