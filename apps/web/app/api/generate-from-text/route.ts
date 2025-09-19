export const runtime = 'nodejs';

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
  } catch (e) {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!body?.textContent || typeof body.textContent !== 'string') return new Response("textContent required", { status: 400 });

  const teacherModel = body.teacherModel || "GPT-OSS-20B";
  const difficulty = body.difficulty || "beginner";
  const includeAssessment = Boolean(body.includeAssessment);
  const provider = (body.provider || process.env.TEACHER_PROVIDER || 'poe') as 'poe' | 'openai-compatible';
  const includeReasoning = Boolean(body.showReasoning);
  const customPrompt = normalizeCustomPrompt(body.customPrompt);
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
        body: JSON.stringify({ textContent: body.textContent, difficulty, teacherModel, includeAssessment, provider, includeReasoning, customPrompt }),
        signal: genCtrl.signal,
      });
      try {
        gen = await genResp.json();
      } catch {
        clearTimeout(genTimer);
        return new Response("Upstream generation returned invalid JSON", { status: 502 });
      }
      clearTimeout(genTimer);
      if (!gen.success) return Response.json(gen, { status: 422 });
    }
  } catch (e) {
    // Preserve fallback behavior; proceed to local generation below
  }
  clearTimeout(genTimer);

  let lesson = gen?.lesson;
  if (!lesson) {
    // Title: first non-empty line, strip URLs, trim to 80
    const firstLine = (body.textContent as string).split(/\r?\n/).find((l:string)=>l.trim().length>0) || '';
    const withoutUrls = firstLine.replace(/https?:\/\/\S+/g, '').replace(/\S+@\S+\.[\w]+/g, '').trim();
    const fallbackTitle = customPrompt?.title || withoutUrls || 'Generated Lesson';
    lesson = {
      title: fallbackTitle.slice(0, 80),
      description: customPrompt?.context || 'Generated from pasted text (local fallback).',
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
  if (customPrompt?.title && (!lesson.title || !String(lesson.title).trim())) {
    lesson.title = customPrompt.title;
  }
  if (customPrompt?.context && (!lesson.description || !String(lesson.description).trim())) {
    lesson.description = customPrompt.context;
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
