import list from '@/data/featured-notebooks.json';

export const runtime = 'edge';

export async function GET() {
  return Response.json({ items: list });
}

