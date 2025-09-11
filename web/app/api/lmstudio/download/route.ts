// Lowest-risk: perform download locally via LM Studio SDK from Next.js server.
// Keep synchronous, but with a hard timeout so UI can show a clear error.

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = (body?.id || '').trim();
  const optionIndex = Number(body?.optionIndex ?? 0);
  if (!id) return Response.json({ error: { message: 'id required' } }, { status: 400 });
  try {
    const name = '@lmstudio/sdk';
    const mod = await (Function('n', 'return import(n)') as any)(name).catch(() => null as any);
    if (!mod || !mod.LMStudioClient) {
      return Response.json({ error: { message: "LM Studio SDK not available" } }, { status: 501 });
    }
    const client = new mod.LMStudioClient();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5 * 60_000); // 5 min cap
    // Note: SDK signature may differ; adjust as needed in local tests.
    const result = await client.model.download(id, { optionIndex, signal: ctrl.signal });
    clearTimeout(timer);
    const identifier = String(result?.indexedModelIdentifier || result?.identifier || id);
    return Response.json({ identifier }, { status: 200 });
  } catch (error: any) {
    const msg = error?.name === 'AbortError' ? 'Download timed out' : (error?.message || 'Download failed');
    return Response.json({ error: { message: msg } }, { status: 500 });
  }
}

export const runtime = 'nodejs';
