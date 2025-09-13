import list from '../../../../data/notebooks-index.json';

export const runtime = 'edge';

export async function GET() {
  return Response.json({ items: list });
}

