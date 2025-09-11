import { backendUrl } from "../../../lib/backend";

export async function GET() {
  const resp = await fetch(backendUrl('/health'), { cache: 'no-store' });
  const data = await resp.json();
  return Response.json(data, { status: resp.status });
}

