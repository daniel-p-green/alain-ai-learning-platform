import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any = null;
  try { body = await req.json(); } catch {}
  const lang = String(body?.lang || '').toLowerCase();
  return NextResponse.json({ error: `server-side execution for ${lang || 'unknown'} not available`, code: 'NOT_IMPLEMENTED' }, { status: 501 });
}

