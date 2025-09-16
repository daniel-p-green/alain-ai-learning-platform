import { auth } from '@clerk/nextjs/server';
import { backendUrl } from '@/lib/backend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { getToken } = await auth();
  const token = await getToken();
  let body: any = null;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const resp = await fetch(backendUrl('/assessments/validate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => null);
  return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
}

