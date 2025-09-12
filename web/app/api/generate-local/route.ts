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
  if (!body?.modelId || typeof body.modelId !== 'string') return new Response("modelId required", { status: 400 });

  const teacherModel = body.teacherModel || "GPT-OSS-20B";
  const difficulty = body.difficulty || "beginner";
  const includeAssessment = Boolean(body.includeAssessment);
  const provider = (body.provider || process.env.TEACHER_PROVIDER || 'openai-compatible') as 'poe' | 'openai-compatible';
  const includeReasoning = Boolean(body.showReasoning);
  const token = await getToken();

  // 1) Generate lesson structure from local model id
  const genCtrl = new AbortController();
  const genTimer = setTimeout(() => genCtrl.abort(), 60_000);
  const genResp = await fetch(backendUrl('/lessons/generate-local'), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ modelId: body.modelId, difficulty, teacherModel, includeAssessment, provider, includeReasoning }),
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
  if (!genResp.ok) {
    return Response.json({ success: false, error: { code: 'backend_error', message: gen?.error?.message || 'Generation failed' } }, { status: genResp.status });
  }
  if (!gen.success) return Response.json(gen, { status: 422 });

  const lesson = gen.lesson;
  // Optional overrides from UI
  if (body.targetProvider && typeof body.targetProvider === 'string') {
    lesson.provider = body.targetProvider;
  }
  if (body.targetModel && typeof body.targetModel === 'string' && body.targetModel.trim()) {
    lesson.model = body.targetModel.trim();
  } else {
    lesson.model = body.modelId;
    lesson.provider = provider;
  }

  // 2) Persist lesson into tutorials
  const impCtrl = new AbortController();
  const impTimer = setTimeout(() => impCtrl.abort(), 60_000);
  const impResp = await fetch(backendUrl('/tutorials/import'), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(lesson),
    signal: impCtrl.signal,
  });
  clearTimeout(impTimer);
  if (!impResp.ok) {
    const t = await impResp.text();
    return new Response(`Import failed: ${t}`, { status: 500 });
  }
  const imp = await impResp.json();

  const preview = {
    title: lesson.title,
    description: lesson.description,
    learning_objectives: lesson.learning_objectives || [],
    first_step: lesson.steps?.[0] || null,
    model_maker: lesson.model_maker || null,
  };

  return Response.json({ success: true, tutorialId: imp.tutorialId, meta: { repaired: !!gen?.meta?.repaired, reasoning_summary: gen?.meta?.reasoning_summary }, preview });
}
