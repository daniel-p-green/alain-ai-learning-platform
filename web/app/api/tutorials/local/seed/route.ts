import { putLocalTutorial, type Tutorial } from "../../../../../lib/localTutorialStore";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const id = String((body as any)?.id || 'local-seeded-1');
    const tutorial: Tutorial = {
      id,
      title: (body as any)?.title || 'Seeded Tutorial',
      description: 'A locally seeded tutorial for UI tests.',
      model: 'gpt-oss:20b',
      provider: 'openai-compatible',
      difficulty: 'beginner',
      tags: ['test'],
      steps: [
        { id: 1, step_order: 1, title: 'Intro', content: 'Welcome to the seeded tutorial.', code_template: 'hello' }
      ],
      model_maker: null,
    };
    putLocalTutorial(tutorial);
    return new Response(JSON.stringify({ ok: true, id }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'seed failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

