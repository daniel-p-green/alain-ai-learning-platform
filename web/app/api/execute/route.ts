import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { poeProvider, openAIProvider, type Provider as WebProvider } from "@/lib/providers";

// Simple in-memory rate limiter per user (RPM)
const BUCKET: Record<string, number[]> = {};
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
  const { userId, getToken } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const stream = body.stream !== false; // default to streaming
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";

  try {
    // Rate limit per user
    const gate = allow(userId);
    if (!gate.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: "rate_limited", message: `Too many requests. Try again in ${gate.retryAfter}s.` }
      }), { status: 429, headers: { 'Retry-After': String(gate.retryAfter || 60) } });
    }

    // Get Clerk JWT token to forward to backend
    const token = await getToken();

    if (stream) {
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
          let flushing = false;
          const flush = () => {
            if (flushing) return;
            flushing = true;
            setTimeout(() => {
              try {
                if (queue.length) {
                  const chunk = queue.splice(0, queue.length).join("");
                  controller.enqueue(enc.encode(chunk));
                }
              } finally {
                flushing = false;
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
              const chunk = queue.splice(0, queue.length).join("");
              controller.enqueue(enc.encode(chunk));
            } else {
              flush();
            }
          };

          const run = async () => {
            try {
              await provider.stream(body, (data) => {
                send(data);
              }, req.signal);
              queue.push("data: [DONE]\n\n");
              const tail = queue.splice(0, queue.length).join("");
              controller.enqueue(enc.encode(tail));
              // Basic metrics (duration, chars/sec) for observability
              const dur = Math.max(1, Date.now() - startAt);
              const cps = Math.round((totalChars / dur) * 1000);
              console.log(`[SSE] provider=${body.provider} model=${body.model} duration_ms=${dur} chars=${totalChars} chars_per_sec=${cps}`);
              controller.close();
            } catch (error) {
              // One quick retry on initial failure
              try {
                await provider.stream(body, (data) => {
                  send(data);
                }, req.signal);
                queue.push("data: [DONE]\n\n");
                const tail = queue.splice(0, queue.length).join("");
                controller.enqueue(enc.encode(tail));
                const dur = Math.max(1, Date.now() - startAt);
                const cps = Math.round((totalChars / dur) * 1000);
                console.log(`[SSE:retry] provider=${body.provider} model=${body.model} duration_ms=${dur} chars=${totalChars} chars_per_sec=${cps}`);
                controller.close();
              } catch (e2) {
                const err = {
                  success: false,
                  error: {
                    code: "provider_error",
                    message: (e2 instanceof Error ? e2.message : 'unknown provider error'),
                  },
                };
                controller.enqueue(new TextEncoder().encode(`event: error\n`));
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(err)}\n\n`));
                const dur = Math.max(1, Date.now() - startAt);
                const cps = Math.round((totalChars / dur) * 1000);
                console.warn(`[SSE:error] provider=${body.provider} model=${body.model} duration_ms=${dur} chars=${totalChars} chars_per_sec=${cps}`);
                controller.close();
              }
            }
          };
          run();

          // Handle client abort
          req.signal.addEventListener("abort", () => {
            // Optionally emit an abort event
            controller.close();
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
