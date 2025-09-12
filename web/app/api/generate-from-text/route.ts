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

  // 1) Generate lesson structure from pasted text (fallback to local if backend unavailable)
  let gen: any = null;
  const genCtrl = new AbortController();
  const genTimer = setTimeout(() => genCtrl.abort(), 60_000);
  try {
    const forceLocal = (new URL(req.url)).searchParams.get('fallback') === '1' || (req.headers.get('x-force-local-fallback') === '1');
    if (!forceLocal) {
      const genResp = await fetch(backendUrl('/lessons/generate-from-text'), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ textContent: body.textContent, difficulty, teacherModel, includeAssessment, provider, includeReasoning }),
        signal: genCtrl.signal,
      });
      gen = await genResp.json();
      clearTimeout(genTimer);
      if (!gen.success) return Response.json(gen, { status: 200 });
    }
  } catch {}
  clearTimeout(genTimer);

  let lesson = gen?.lesson;
  if (!lesson) {
    const title = (body.textContent as string).split(/\n|\./)[0]?.slice(0, 80) || 'Generated Lesson';
    lesson = {
      title,
      description: 'Generated from pasted text (local fallback).',
      provider,
      model: body.targetModel || 'gpt-oss:20b',
      difficulty,
      tags: [],
      steps: [
        { step_order: 1, title: 'Overview', content: body.textContent, code_template: 'Summarize the key points.' },
        { step_order: 2, title: 'Hands-on', content: 'Demonstrate a short example.', code_template: 'Provide a short example relevant to the topic.' }
      ],
    } as any;
  }
  // Optional overrides from UI (provider/model picker)
  if (body.targetProvider && typeof body.targetProvider === 'string') {
    lesson.provider = body.targetProvider;
  }
  if (body.targetModel && typeof body.targetModel === 'string' && body.targetModel.trim()) {
    lesson.model = body.targetModel.trim();
  }

  // 2) Persist lesson into tutorials
  let tutorialId: string | number | null = null;
  if (gen?.lesson) {
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
    tutorialId = imp.tutorialId;
  } else {
    const { putLocalTutorial } = await import("../../../lib/localTutorialStore");
    const id = `local-${crypto.randomUUID()}`;
    putLocalTutorial({ id, title: lesson.title, description: lesson.description, model: lesson.model, provider: lesson.provider, difficulty: lesson.difficulty, tags: lesson.tags || [], steps: lesson.steps || [], model_maker: lesson.model_maker || null });
    tutorialId = id;
  }

  const preview = {
    title: lesson.title,
    description: lesson.description,
    learning_objectives: lesson.learning_objectives || [],
    first_step: lesson.steps?.[0] || null,
    model_maker: lesson.model_maker || null,
  };

  return Response.json({ success: true, tutorialId, meta: { repaired: !!gen?.meta?.repaired, reasoning_summary: gen?.meta?.reasoning_summary }, preview });
}
