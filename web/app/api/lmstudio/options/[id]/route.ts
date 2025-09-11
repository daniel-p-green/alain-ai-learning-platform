export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  try {
    const mod = await import("@lmstudio/sdk").catch(() => null as any);
    if (!mod || !mod.LMStudioClient) {
      return Response.json({ options: [], error: { message: "LM Studio SDK not available" } }, { status: 501 });
    }
    const client = new mod.LMStudioClient();
    const opts = await client.model.options(id);
    const options = (opts?.items || []).map((o: any, index: number) => ({
      index,
      name: String(o?.name || ''),
      sizeBytes: Number(o?.sizeBytes || 0),
      quantization: o?.quantization || null,
      fitEstimation: o?.fitEstimation || null,
      recommended: Boolean(o?.recommended),
      indexedModelIdentifier: String(o?.indexedModelIdentifier || ''),
    }));
    return Response.json({ options }, { status: 200 });
  } catch (error) {
    return Response.json({ options: [], error: { message: error instanceof Error ? error.message : 'Options failed' } }, { status: 500 });
  }
}
