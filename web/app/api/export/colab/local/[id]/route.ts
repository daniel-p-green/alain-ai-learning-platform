import { getLocalTutorial } from "../../../../../../lib/localTutorialStore";
import { buildNotebookFromLesson } from "../../../../../../lib/notebookExport";

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const t = getLocalTutorial(params.id);
  if (!t) return new Response('Not found', { status: 404 });
  const nb = buildNotebookFromLesson(t);
  return Response.json(nb);
}

