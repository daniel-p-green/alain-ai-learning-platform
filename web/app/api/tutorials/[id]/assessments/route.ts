import { auth } from '@clerk/nextjs/server';
import { backendUrl } from '@/lib/backend';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { getToken } = await auth();
  const token = await getToken();
  const incoming = new URL(req.url);
  const step = incoming.searchParams.get('step');
  const upstream = new URL(backendUrl(`/assessments/${encodeURIComponent(params.id)}`));
  if (step) upstream.searchParams.set('stepOrder', step);
  const resp = await fetch(upstream.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  const data = await resp.json().catch(() => null);
  return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
}
