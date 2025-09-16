import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

function backendBase(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_BASE_URL;
  return (env || req.nextUrl.origin).replace(/\/$/, '');
}

export async function GET(req: NextRequest) {
  const base = backendBase(req);
  const url = `${base}/catalog/notebooks/mine`;
  const { getToken } = auth();
  let headers: Record<string, string> = {};
  try {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  const resp = await fetch(url, { cache: 'no-store', headers });
  const data = await resp.json().catch(() => ({ items: [] }));
  return NextResponse.json(data, { status: resp.status });
}

