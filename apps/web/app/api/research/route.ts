import { safeAuth, demoBypassEnabled } from "../../../lib/auth";
import { backendUrl } from "../../../lib/backend";

export async function POST(req: Request) {
  const { userId, getToken } = await safeAuth();
  if (!userId && !demoBypassEnabled()) return new Response("Unauthorized", { status: 401 });
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  // Expect { owner: string, repo: string } or { provider, model }
  let provider = '';
  let model = '';
  if (body?.provider && body?.model) {
    provider = String(body.provider).trim();
    model = String(body.model).trim();
  } else if (body?.owner && body?.repo) {
    provider = String(body.owner).trim();
    model = String(body.repo).trim();
  } else if (typeof body?.ref === 'string') {
    const m = body.ref.match(/^(?:https?:\/\/huggingface\.co\/)?([^\s\/]+)\/([^\s\/]+)/);
    if (m) { provider = m[1]; model = m[2]; }
  }
  if (!provider || !model) return new Response("provider/owner and model/repo are required", { status: 400 });

  const token = await getToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const resp = await fetch(backendUrl('/research/run'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model,
        provider,
        offlineCache: !!body?.offlineCache,
        depth: body?.depth || 'intermediate',
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) return new Response(JSON.stringify({ success: false, error: { message: data?.error?.message || 'Backend error' } }), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    clearTimeout(timer);
    return new Response(JSON.stringify({ success: false, error: { message: e?.message || 'Request failed' } }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

