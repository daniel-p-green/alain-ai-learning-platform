import { NextRequest } from "next/server";
import { safeAuth, demoBypassEnabled } from "@/lib/auth";
import { poeProvider, openAIProvider, type Provider as WebProvider } from "@/lib/providers";

// Simple in-memory rate limiter per user (RPM)
const BUCKET: Record<string, number[]> = {};
// Simple per-user concurrency tracker (in-process)
const ACTIVE: Map<string, number> = new Map();
const MAX_USER_CONCURRENCY = Number(process.env.EXECUTE_MAX_CONCURRENCY || 2);
const WINDOW_MS = 60_000;
const MAX_RPM = Number(process.env.NEXT_PUBLIC_EXECUTE_RPM || 30);
const GC_ON_EMPTY = true; // drop user bucket if empty after prune

function allow(userId: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const arr = (BUCKET[userId] ||= []);
  while (arr.length && now - arr[0] > WINDOW_MS) arr.shift();
  if (GC_ON_EMPTY && arr.length === 0) {
    // No recent activity; free the bucket to avoid memory growth
    delete BUCKET[userId];
  }
  if (arr.length >= MAX_RPM) {
    const retryAfterMs = WINDOW_MS - (now - arr[0]);
    return { ok: false, retryAfter: Math.ceil(retryAfterMs / 1000) };
  }
  (BUCKET[userId] ||= []).push(now);
  return { ok: true };
}

export async function POST(req: NextRequest) {
  const { userId, getToken } = await safeAuth();
  if (!userId && !demoBypassEnabled()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  // Clamp request parameters to safe defaults
  const clamp = (n: any, lo: number, hi: number) => {
    const v = Number(n);
    if (!isFinite(v)) return lo;
    return Math.min(Math.max(v, lo), hi);
  };
  const DEFAULT_MAX_TOKENS = Number(process.env.EXECUTE_DEFAULT_MAX_TOKENS || 400);
  const ABS_MAX_TOKENS = Number(process.env.EXECUTE_ABS_MAX_TOKENS || 800);
  body.max_tokens = clamp(body.max_tokens ?? DEFAULT_MAX_TOKENS, 1, ABS_MAX_TOKENS);
  body.temperature = clamp(body.temperature ?? 0.7, 0, 1);
  body.top_p = clamp(body.top_p ?? 0.9, 0, 1);

  const stream = body.stream !== false; // default to streaming
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
  const streamViaBackend = (process.env.NEXT_PUBLIC_STREAM_VIA || 'web') === 'backend';

  const uid = userId ?? 'demo-user';
  const gate = allow(uid);
  if (!gate.ok) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: "rate_limited", message: `Too many requests. Try again in ${gate.retryAfter}s.` }
    }), { status: 429, headers: { 'Retry-After': String(gate.retryAfter || 60) } });
  }

  // Per-user concurrency guard (only increment when request is accepted)
  const current = ACTIVE.get(uid) || 0;
  if (current >= MAX_USER_CONCURRENCY) {
    return new Response(JSON.stringify({ success: false, error: { code: 'too_many_requests', message: `Too many concurrent requests. Try again shortly.` } }), { status: 429 });
  }
  ACTIVE.set(uid, current + 1);
  let released = false;
  const release = () => {
    if (released) return;
    const now = ACTIVE.get(uid) || 1;
    const next = Math.max(0, now - 1);
    if (next <= 0) {
      ACTIVE.delete(uid);
    } else {
      ACTIVE.set(uid, next);
    }
    released = true;
  };

  try {
    // Get Clerk JWT token to forward to backend
    const token = await getToken();

    if (stream) {
      // Option A: proxy streaming from backend SSE (Encore)
      if (streamViaBackend) {
        const token = await getToken();
        const upstream = await fetch(`${backendUrl}/execute/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: req.signal,
        });
        if (!upstream.ok || !upstream.body) {
          const err = await safeJson(upstream);
          release();
          return Response.json(err || { success: false, error: { code: 'upstream_error', message: 'Backend stream failed' } }, { status: upstream.status || 502 });
        }
        const reader = upstream.body.getReader();
        const proxied = new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                release();
                controller.close();
                return;
              }
              if (value) controller.enqueue(value);
            } catch (error) {
              release();
              controller.error(error);
            }
          },
          async cancel(reason) {
            release();
            await reader.cancel(reason);
          }
        });
        return new Response(proxied, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
          },
        });
      }
      // Option B: stream via web providers (default)
      // Stream directly from web providers to client via SSE
      const provider: WebProvider = selectWebProvider(body.provider);
      // Create an SSE stream
      const readable = new ReadableStream({
        start(controller) {
          // Helper to send data frames
          const startAt = Date.now();
          let totalChars = 0;
          const enc = new TextEncoder();
          // Buffered emission to avoid overwhelming clients on fast providers
          const queue: string[] = [];
          const flushIntervalMs = 16; // ~60Hz
          let flushTimer: ReturnType<typeof setTimeout> | null = null;
          let closed = false;

          const stopTimer = () => {
            if (flushTimer) {
              clearTimeout(flushTimer);
              flushTimer = null;
            }
          };

          const flushNow = () => {
            stopTimer();
            if (!queue.length || closed) return;
            const chunk = queue.splice(0, queue.length).join("");
            if (!chunk) return;
            try {
              controller.enqueue(enc.encode(chunk));
            } catch (error) {
              closed = true;
              stopTimer();
              release();
              try {
                controller.error(error);
              } catch {}
            }
          };

          const scheduleFlush = () => {
            if (closed || flushTimer) return;
            flushTimer = setTimeout(() => {
              flushTimer = null;
              flushNow();
              if (queue.length && !closed) {
                scheduleFlush();
              }
            }, flushIntervalMs);
          };
          const send = (obj: any) => {
            const payload = JSON.stringify(obj);
            totalChars += payload.length;
            const line = `data: ${payload}\n\n`;
            queue.push(line);
            // Flush immediately if large, else batch
            if (queue.length > 8 || payload.length > 2048) {
              flushNow();
            } else {
              scheduleFlush();
            }
          };

          const run = async () => {
            try {
              await provider.stream(body, (data) => {
                send(data);
              }, req.signal);
              queue.push("data: [DONE]\n\n");
              flushNow();
              stopTimer();
              // Basic metrics (duration, chars/sec) for observability
              const dur = Math.max(1, Date.now() - startAt);
              const cps = Math.round((totalChars / dur) * 1000);
              console.log(`[SSE] provider=${body.provider} model=${body.model} duration_ms=${dur} chars=${totalChars} chars_per_sec=${cps}`);
              closed = true;
              controller.close();
              // Decrement concurrency on successful close
              release();
            } catch (error) {
              // One quick retry on initial failure
              try {
                await provider.stream(body, (data) => {
                  send(data);
                }, req.signal);
                queue.push("data: [DONE]\n\n");
                flushNow();
                stopTimer();
                const dur = Math.max(1, Date.now() - startAt);
                const cps = Math.round((totalChars / dur) * 1000);
                console.log(`[SSE:retry] provider=${body.provider} model=${body.model} duration_ms=${dur} chars=${totalChars} chars_per_sec=${cps}`);
                closed = true;
                controller.close();
                release();
              } catch (e2) {
                const err = {
                  success: false,
                  error: {
                    code: "provider_error",
                    message: (e2 instanceof Error ? e2.message : 'unknown provider error'),
                  },
                };
                try {
                  controller.enqueue(new TextEncoder().encode(`event: error\n`));
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(err)}\n\n`));
                } catch {}
                const dur = Math.max(1, Date.now() - startAt);
                const cps = Math.round((totalChars / dur) * 1000);
                console.warn(`[SSE:error] provider=${body.provider} model=${body.model} duration_ms=${dur} chars=${totalChars} chars_per_sec=${cps}`);
                stopTimer();
                closed = true;
                controller.close();
                release();
              }
            }
          };
          run();

          // Handle client abort
          req.signal.addEventListener("abort", () => {
            // Optionally emit an abort event
            stopTimer();
            closed = true;
            controller.close();
            release();
          });
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Proxy non-streaming request to Encore execute endpoint
      const encoreResponse = await fetch(`${backendUrl}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await encoreResponse.json();
      return Response.json(data, { status: encoreResponse.status });
    }
  } catch (error) {
    release();
    console.error("Proxy error:", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "proxy_error",
          message: "Failed to connect to backend service"
        }
      },
      { status: 500 }
    );
  }
  finally {
    // Ensure decrement for non-streaming path and any early returns within try
    if (!stream) {
      release();
    }
  }
}

function selectWebProvider(name: "poe" | "openai-compatible"): WebProvider {
  switch (name) {
    case "poe":
      return poeProvider;
    case "openai-compatible":
      return openAIProvider;
    default:
      return poeProvider;
  }
}
export const runtime = 'nodejs';

async function safeJson(resp: Response) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}
