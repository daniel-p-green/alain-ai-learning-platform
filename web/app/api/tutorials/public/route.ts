import { NextRequest, NextResponse } from 'next/server';

function backendBase(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_BASE_URL;
  return (env || req.nextUrl.origin).replace(/\/$/, '');
}

export async function GET(req: NextRequest) {
  const base = backendBase(req);
  const url = new URL(`${base}/tutorials/public`);
  for (const [k, v] of req.nextUrl.searchParams.entries()) url.searchParams.set(k, v);
  const resp = await fetch(url.toString(), { cache: 'no-store' });
  const data = await resp.json().catch(() => ({ items: [] }));
  return NextResponse.json(data, { status: resp.status });
}

