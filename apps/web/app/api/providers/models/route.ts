import { backendUrl } from "../../../../lib/backend";

export async function GET() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const resp = await fetch(backendUrl('/providers/models'), { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    const data = await resp.json();
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json({ provider: 'unknown', baseUrl: null, models: [], error: error instanceof Error ? error.message : 'Failed to load models' }, { status: 200 });
  }
}

