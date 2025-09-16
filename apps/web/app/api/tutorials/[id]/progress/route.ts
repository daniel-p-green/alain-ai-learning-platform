import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

function backendBase(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_BASE_URL;
  return (env || req.nextUrl.origin).replace(/\/$/, '');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const base = backendBase(req);
  const url = `${base}/tutorials/${encodeURIComponent(params.id)}/progress`;
  const { getToken } = auth();
  const headers: Record<string,string> = {};
  try { const token = await getToken(); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
  const resp = await fetch(url, { cache: 'no-store', headers });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const base = backendBase(req);
  const body = await req.json().catch(() => ({}));
  const url = `${base}/tutorials/${encodeURIComponent(params.id)}/progress/complete`;
  const { getToken } = auth();
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  try { const token = await getToken(); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

