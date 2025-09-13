export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return Response.json({ ok: false, error: 'remix not implemented', request: body }, { status: 501 });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'remix failed' }, { status: 500 });
  }
}

