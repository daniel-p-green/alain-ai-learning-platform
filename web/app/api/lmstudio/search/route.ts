// Lowest-risk integration: perform LM Studio SDK calls from the Next.js server (local only),
// not from the Encore backend. If the SDK is unavailable or LM Studio isn't running,
// return a friendly 501 to keep the UI graceful.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const term = (url.searchParams.get('term') || '').trim();
  const limit = Math.max(1, Math.min(25, Number(url.searchParams.get('limit') || 10)));
  try {
    // Dynamic import via runtime indirection to avoid bundler resolution when SDK isn't installed
    const name = '@lmstudio/sdk';
    const mod = await (Function('n', 'return import(n)') as any)(name).catch(() => null as any);
    if (!mod || !mod.LMStudioClient) {
      return Response.json({
        results: [],
        error: { message: "LM Studio SDK not available. Install in web server environment to enable search." }
      }, { status: 501 });
    }
    const client = new mod.LMStudioClient();
    const search = await client.model.search({ q: term || 'llama', limit });
    const results = (search?.items || []).map((it: any) => ({
      id: String(it?.id || it?.modelId || ''),
      name: String(it?.name || it?.title || it?.id || ''),
      exact: Boolean(it?.exact),
      staffPick: Boolean(it?.staffPick),
    })).filter((r: any) => r.id && r.name);
    return Response.json({ results }, { status: 200 });
  } catch (error) {
    return Response.json({ results: [], error: { message: error instanceof Error ? error.message : 'Search failed' } }, { status: 500 });
  }
}

export const runtime = 'nodejs';
