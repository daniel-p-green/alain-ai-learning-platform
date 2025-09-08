import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { ExecuteBody } from "../../../lib/providers";
import { poeProvider, openAIProvider, type Provider } from "../../../lib/providers";

type Message = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: ExecuteBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const stream = body.stream !== false; // default to streaming

  // Simple per-user rate limit: 30 RPM
  if (!incrementRate(userId)) {
    return Response.json(
      { success: false, error: { code: "rate_limited", message: "Too many requests. Please try again later." } },
      { status: 429 }
    );
  }

  if (!stream) {
    // Non-streaming passthrough to provider
    try {
      const content = await completeOnce(body);
      return Response.json({ success: true, content });
    } catch (err: any) {
      return Response.json({ success: false, error: mapProviderError(err) }, { status: 200 });
    }
  }

  const encoder = new TextEncoder();

  const s = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Heartbeats every 15s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`:\\n\n`));
      }, 15000);

      try {
        await streamFromProvider(body, (data) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        });
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(mapProviderError(err))}\n\n`));
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(s, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function completeOnce(body: ExecuteBody): Promise<string> {
  return selectProvider(body.provider).execute(body);
}

async function streamFromProvider(
  body: ExecuteBody,
  onData: (data: any) => void
) {
  return selectProvider(body.provider).stream(body, onData);
}
function selectProvider(name: ExecuteBody["provider"]): Provider {
  switch (name) {
    case "poe":
      return poeProvider;
    case "openai-compatible":
      return openAIProvider;
    default:
      throw new Error("unsupported provider");
  }
}

function mapProviderError(error: any) {
  const msg = (error?.message || String(error)).toLowerCase();
  if (msg.includes("401")) return { code: "authentication_failed", message: "Authentication failed." };
  if (msg.includes("404")) return { code: "model_not_found", message: "Model not found." };
  if (msg.includes("429")) return { code: "rate_limited", message: "Too many requests." };
  if (msg.includes("timeout") || msg.includes("econnreset")) return { code: "timeout", message: "Request timed out." };
  return { code: "unknown_error", message: "An unexpected error occurred." };
}

// naive in-memory rate limiter keyed by userId
const bucket: Record<string, number[]> = {};
function incrementRate(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 30;
  const arr = (bucket[userId] ||= []);
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length >= max) return false;
  arr.push(now);
  return true;
}
