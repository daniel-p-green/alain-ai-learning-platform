import { NextRequest, NextResponse } from 'next/server';

function backendBase(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_BASE_URL;
  if (env) return env.replace(/\/$/, '');
  return `${req.nextUrl.origin}`;
}

export async function POST(req: NextRequest) {
  const base = backendBase(req);
  const body = await req.json();
  const resp = await fetch(`${base}/catalog/notebooks/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json().catch(() => ({ success: false }));
  return NextResponse.json(data, { status: resp.status });
}

