import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.hfUrl) return new Response("hfUrl required", { status: 400 });

  const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
  const teacherModel = body.teacherModel || "GPT-OSS-20B";
  const difficulty = body.difficulty || "beginner";
  const includeAssessment = Boolean(body.includeAssessment);
  const provider = (body.provider || process.env.TEACHER_PROVIDER || 'poe') as 'poe' | 'openai-compatible';

  // 1) Generate lesson structure from HF URL
  const genStart = Date.now();
  const genResp = await fetch(`${base}/lessons/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hfUrl: body.hfUrl, difficulty, teacherModel, includeAssessment, provider })
  });
  const gen = await genResp.json();
  const genMs = Date.now() - genStart;
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
  const token = await getToken();
  const impStart = Date.now();
  const impResp = await fetch(`${base}/tutorials/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(lesson),
  });
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
  };

  return Response.json({
    success: true,
    tutorialId: imp.tutorialId,
    meta: { repaired: !!gen?.meta?.repaired, timings: { lesson_ms: genMs, import_ms: impMs } },
    preview,
  });
}
