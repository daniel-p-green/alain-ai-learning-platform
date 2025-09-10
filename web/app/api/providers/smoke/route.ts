import { safeAuth, demoBypassEnabled } from "@/lib/auth";
import { poeProvider, openAIProvider, type Provider as WebProvider } from "@/lib/providers";

export async function POST(req: Request) {
  const { userId } = await safeAuth();
  if (!userId && !demoBypassEnabled()) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(()=>null);
  const providerId = body?.provider || 'poe';
  const model = body?.model || 'gpt-4o-mini';
  const provider: WebProvider = providerId === 'openai-compatible' ? openAIProvider : poeProvider;
  try {
    const text = await provider.execute({ provider: providerId, model, messages: [{ role: 'user', content: 'ping' }], stream: false });
    return Response.json({ success: true, sample: (text||'').slice(0,120) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'provider smoke test failed';
    return Response.json({ success: false, error: { code: 'provider_error', message } }, { status: 200 });
  }
}
export const runtime = 'nodejs';
