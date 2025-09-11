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
    const hints: string[] = [];
    if (providerId === 'poe') {
      if (!process.env.POE_API_KEY) hints.push('Set POE_API_KEY in the web server environment (e.g., Vercel) and redeploy.');
      if (/401|unauthor/i.test(message)) hints.push('Poe returned Unauthorized. Rotate the key or verify the project has API access.');
    }
    if (providerId === 'openai-compatible') {
      if (!process.env.OPENAI_BASE_URL || !process.env.OPENAI_API_KEY) hints.push('Set OPENAI_BASE_URL and OPENAI_API_KEY (e.g., http://localhost:11434/v1 and ollama).');
    }
    return Response.json({ success: false, error: { code: 'provider_error', message, hints } }, { status: 200 });
  }
}
export const runtime = 'nodejs';
