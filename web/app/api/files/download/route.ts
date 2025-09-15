import fs from 'fs/promises';
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
    const buf = await fs.readFile(abs);
    const name = path.basename(abs);
    // Convert Buffer to Uint8Array view for Response body
    const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    return new Response(u8 as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${name}"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  }
}
