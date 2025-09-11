export const runtime = 'nodejs';

import { safeAuth, demoBypassEnabled } from "../../../lib/auth";
import { backendUrl } from "../../../lib/backend";

export async function POST(req: Request) {
  const { userId, getToken } = await safeAuth();
  if (!userId && !demoBypassEnabled()) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.textContent) return new Response("textContent required", { status: 400 });

  const teacherModel = body.teacherModel || "GPT-OSS-20B";
  const difficulty = body.difficulty || "beginner";
  const includeAssessment = Boolean(body.includeAssessment);
  const provider = (body.provider || process.env.TEACHER_PROVIDER || 'poe') as 'poe' | 'openai-compatible';
  const includeReasoning = Boolean(body.showReasoning);
  const token = await getToken();

  // 1) Generate lesson structure from pasted text
  const genCtrl = new AbortController();
  const genTimer = setTimeout(() => genCtrl.abort(), 60_000);
  const genResp = await fetch(backendUrl('/lessons/generate-from-text'), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ textContent: body.textContent, difficulty, teacherModel, includeAssessment, provider, includeReasoning }),
    signal: genCtrl.signal,
  });
  const gen = await genResp.json();
  clearTimeout(genTimer);
  if (!gen.success) return Response.json(gen, { status: 200 });

  const lesson = gen.lesson;
  // Optional overrides from UI (provider/model picker)
  if (body.targetProvider && typeof body.targetProvider === 'string') {
    lesson.provider = body.targetProvider;
  }
  if (body.targetModel && typeof body.targetModel === 'string' && body.targetModel.trim()) {
    lesson.model = body.targetModel.trim();
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
