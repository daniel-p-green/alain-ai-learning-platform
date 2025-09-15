import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rel = url.searchParams.get('path') || '';
  if (!rel || !rel.startsWith('content/')) {
    return new Response(JSON.stringify({ error: 'invalid path' }), { status: 400 });
  }
  const abs = path.resolve(process.cwd(), rel);
  const base = path.resolve(process.cwd(), 'content');
  if (!abs.startsWith(base)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }
  try {
    const stat = await fsp.stat(abs);
    const size = stat.size;
    const name = path.basename(abs);
    const range = (req.headers.get('Range') || '').replace(/bytes=/i, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    };
    if (range) {
      const [startStr, endStr] = range.split('-');
      let start = parseInt(startStr, 10);
      let end = endStr ? parseInt(endStr, 10) : size - 1;
      if (Number.isNaN(start) || start < 0) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start > end || start >= size) {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
      }
      const chunkSize = end - start + 1;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      headers['Content-Length'] = String(chunkSize);
      const stream = fs.createReadStream(abs, { start, end });
      return new Response(stream as any, { status: 206, headers });
    }
    headers['Content-Length'] = String(size);
    const stream = fs.createReadStream(abs);
    return new Response(stream as any, { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  }
}
