import { safeAuth, demoBypassEnabled } from "../../../lib/auth";
import { backendUrl } from "../../../lib/backend";

type CustomPromptPayload = {
  title?: string;
  context?: string;
};

function normalizeCustomPrompt(input: any): CustomPromptPayload | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
  const rawContext = typeof input.context === 'string' ? input.context.trim() : '';
  if (!rawTitle && !rawContext) return undefined;
  return {
    title: rawTitle || undefined,
    context: rawContext || undefined,
  };
}

export async function POST(req: Request) {
  const { userId, getToken } = await safeAuth();
  if (!userId && !demoBypassEnabled()) return new Response("Unauthorized", { status: 401 });
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!body?.hfUrl || typeof body.hfUrl !== 'string') return new Response("hfUrl required", { status: 400 });

  // Use shared backend URL helper for consistency
  const teacherModel = body.teacherModel || "GPT-OSS-20B";
  const difficulty = body.difficulty || "beginner";
  const includeAssessment = Boolean(body.includeAssessment);
  const provider = (body.provider || process.env.TEACHER_PROVIDER || 'poe') as 'poe' | 'openai-compatible';
  const includeReasoning = Boolean(body.showReasoning);
  const customPrompt = normalizeCustomPrompt(body.customPrompt);
  const token = await getToken();

  // 1) Generate lesson structure from HF URL
  const genStart = Date.now();
  const genCtrl = new AbortController();
  const genTimer = setTimeout(() => genCtrl.abort(), 60_000);
  const genResp = await fetch(backendUrl('/lessons/generate'), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hfUrl: body.hfUrl, difficulty, teacherModel, includeAssessment, provider, includeReasoning, customPrompt }),
    signal: genCtrl.signal,
  });
  let gen: any = null;
  try {
    gen = await genResp.json();
  } catch {
    clearTimeout(genTimer);
    return new Response("Upstream generation returned invalid JSON", { status: 502 });
  }
  clearTimeout(genTimer);
  const genMs = Date.now() - genStart;
  if (!genResp.ok) {
    return Response.json({ success: false, error: { code: 'backend_error', message: gen?.error?.message || 'Generation failed' } }, { status: genResp.status });
  }
  if (!gen.success) return Response.json(gen, { status: 422 });

  const lesson = gen.lesson;
  if (customPrompt?.title && (!lesson.title || !String(lesson.title).trim())) {
    lesson.title = customPrompt.title;
  }
  if (customPrompt?.context && (!lesson.description || !String(lesson.description).trim())) {
    lesson.description = customPrompt.context;
  }
  // Optional HF enrichment: license (non-offline)
  try {
    if (body?.hfUrl && typeof body.hfUrl === 'string') {
      const m = body.hfUrl.match(/huggingface\.co\/(?:models\/)?([^\/]+)\/([^\/?#]+)/) || body.hfUrl.match(/^([^\s\/]+)\/([^\s]+)/);
      if (m) {
        const repo = `${m[1]}/${m[2]}`;
        const infoResp = await fetch(`${new URL('/api/hf/model', req.url).toString()}?repo=${encodeURIComponent(repo)}`, { cache: 'no-store' });
        if (infoResp.ok) {
          let info: any = null;
          try { info = await infoResp.json(); } catch { info = null; }
          if (info && info.license) {
            const maker = (lesson as any).model_maker || { name: m[1], org_type: 'organization' };
            maker.license = info.license;
            (lesson as any).model_maker = maker;
          }
        }
      }
    }
  } catch {
    // Best-effort enrichment; ignore failures
  }
  // Optional overrides from UI (provider/model picker)
  if (body.targetProvider && typeof body.targetProvider === 'string') {
    lesson.provider = body.targetProvider;
  }
  if (body.targetModel && typeof body.targetModel === 'string' && body.targetModel.trim()) {
    lesson.model = body.targetModel.trim();
  }

  // 2) Persist lesson into tutorials
  const impStart = Date.now();
  const impCtrl = new AbortController();
  const impTimer = setTimeout(() => impCtrl.abort(), 60_000);
  const impResp = await fetch(backendUrl('/tutorials/import'), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(lesson),
    signal: impCtrl.signal,
  });
  clearTimeout(impTimer);
  if (!impResp.ok) {
    const t = await impResp.text();
    return new Response(`Import failed: ${t}`, { status: 500 });
  }
  const imp = await impResp.json();
  const impMs = Date.now() - impStart;

  // Preview data for instant confirmation UI
  const preview = {
    title: lesson.title,
    description: lesson.description,
    learning_objectives: lesson.learning_objectives || [],
    first_step: lesson.steps?.[0] || null,
    model_maker: lesson.model_maker || null,
  };

  return Response.json({
    success: true,
    tutorialId: imp.tutorialId,
    meta: { repaired: !!gen?.meta?.repaired, timings: { lesson_ms: genMs, import_ms: impMs }, reasoning_summary: gen?.meta?.reasoning_summary },
    preview,
  });
}
