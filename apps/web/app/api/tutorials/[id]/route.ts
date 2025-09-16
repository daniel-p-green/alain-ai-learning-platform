import { NextRequest, NextResponse } from 'next/server';

function backendBase(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_BASE_URL;
  return (env || req.nextUrl.origin).replace(/\/$/, '');
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const base = backendBase(_req);
  const resp = await fetch(`${base}/tutorials/${encodeURIComponent(params.id)}`, { cache: 'no-store' });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

