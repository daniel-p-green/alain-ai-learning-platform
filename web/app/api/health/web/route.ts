import { backendUrl } from "@/lib/backend";
import { kvEnabled } from "../../../../lib/kv";
import { demoBypassEnabled } from "../../../../lib/auth";

export const runtime = 'nodejs';

export async function GET() {
  const startedAt = Date.now();
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
  const streamVia = (process.env.NEXT_PUBLIC_STREAM_VIA || 'web');
  const executeRPM = Number(process.env.NEXT_PUBLIC_EXECUTE_RPM || 30);
  const clerkDisabled = (process.env.DISABLE_CLERK_MIDDLEWARE || "").toLowerCase() === "1";
  const demoBypass = demoBypassEnabled();
  const kv = kvEnabled();

  // Quick backend health fetch (best-effort, 1s timeout)
  let backendReachable = false;
  let backendStatus: number | null = null;
  let backendDurationMs: number | null = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1000);
    const url = backendUrl('/health');
    const resp = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    backendStatus = resp.status;
    backendReachable = resp.ok;
    backendDurationMs = Date.now() - startedAt;
  } catch {
    backendReachable = false;
  }

  return Response.json({
    ok: true,
    app: {
      runtime,
      now: new Date().toISOString(),
    },
    env: {
      backendBase,
      streamVia,
      executeRPM,
      demoBypass,
      clerkDisabled,
      kvEnabled: kv,
    },
    backend: {
      reachable: backendReachable,
      status: backendStatus,
      durationMs: backendDurationMs,
    },
  });
}
