export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return Response.json({ ok: false, error: 'grading not implemented', request: body }, { status: 501 });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'grade failed' }, { status: 500 });
  }
}

