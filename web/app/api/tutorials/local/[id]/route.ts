import { getLocalTutorial } from "../../../../../lib/localTutorialStore";

export const runtime = 'edge';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const t = getLocalTutorial(params.id);
  if (!t) return new Response('Not found', { status: 404 });
  return Response.json(t);
}

