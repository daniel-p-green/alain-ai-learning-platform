import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.current_content || typeof body.current_content !== 'string') {
    return new Response("current_content required", { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
  const token = await getToken();
  const resp = await fetch(`${base}/adapt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return Response.json(data, { status: resp.status });
}

