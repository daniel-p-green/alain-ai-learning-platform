import { safeAuth, demoBypassEnabled } from "../../../lib/auth";
import { backendUrl } from "../../../lib/backend";

export async function GET() {
  // Allow unauthenticated probe to make onboarding easy
  try {
    const response = await fetch(backendUrl('/setup/probe'), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Backend responded with ${response.status}`);
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({
      offlineMode: false,
      teacherProvider: 'unknown',
      openaiBaseUrl: null,
      ollamaDetected: false,
      poeConfigured: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}

export async function POST(request: Request) {
  // Require auth to change server runtime config
  const { userId } = await safeAuth();
  if (!userId && !demoBypassEnabled()) return new Response("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const response = await fetch(backendUrl('/setup/switch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Backend responded with ${response.status}`);
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
