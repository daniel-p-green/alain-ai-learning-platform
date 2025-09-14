import { NextRequest } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { resolve } from 'path';

export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get('path') || '';
  const base = resolve(process.cwd(), '..', 'content');
  const candidate = resolve(base, rel.replace(/^\/+/, ''));
  if (!candidate.startsWith(base)) {
    return new Response('Forbidden', { status: 403 });
  }
  try {
    const st = statSync(candidate);
    const stream = createReadStream(candidate);
    const headers = new Headers();
    const filename = rel.split('/').pop() || 'file';
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Length', String(st.size));
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    return new Response(stream as any, { headers });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

