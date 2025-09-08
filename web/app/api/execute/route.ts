import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

type Message = { role: "system" | "user" | "assistant"; content: string };
type ExecuteBody = {
  provider: "poe" | "openai-compatible";
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
};

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
  switch (body.provider) {
    case "poe":
      return poeComplete(body);
    case "openai-compatible":
      return oaiComplete(body);
    default:
      throw new Error("unsupported provider");
  }
}

async function streamFromProvider(
  body: ExecuteBody,
  onData: (data: any) => void
) {
  switch (body.provider) {
    case "poe":
      return poeStream(body, onData);
    case "openai-compatible":
      return oaiStream(body, onData);
    default:
      throw new Error("unsupported provider");
  }
}

async function poeComplete(body: ExecuteBody): Promise<string> {
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) throw new Error("POE_API_KEY not configured");
  const resp = await fetch("https://api.poe.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      stream: false,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    }),
  });
  if (!resp.ok) throw new Error(`Poe API error (${resp.status})`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || "Unknown Poe error");
  return data.choices?.[0]?.message?.content || "";
}

async function poeStream(body: ExecuteBody, onData: (data: any) => void) {
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) throw new Error("POE_API_KEY not configured");
  const resp = await fetch("https://api.poe.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      stream: true,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    }),
  });
  if (!resp.ok || !resp.body) throw new Error(`Poe API error (${resp.status})`);
  await pipeSSE(resp, onData);
}

async function oaiComplete(body: ExecuteBody): Promise<string> {
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("OPENAI_BASE_URL and OPENAI_API_KEY required");
  const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      stream: false,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI API error (${resp.status})`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || "Unknown OpenAI error");
  return data.choices?.[0]?.message?.content || "";
}

async function oaiStream(body: ExecuteBody, onData: (data: any) => void) {
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("OPENAI_BASE_URL and OPENAI_API_KEY required");
  const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      stream: true,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    }),
  });
  if (!resp.ok || !resp.body) throw new Error(`OpenAI API error (${resp.status})`);
  await pipeSSE(resp, onData);
}

async function pipeSSE(resp: Response, onData: (data: any) => void) {
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.trim();
      if (!line) continue;
      // Expect lines like: data: {...}
      const dataPrefix = "data:";
      if (line.startsWith(dataPrefix)) {
        const dataStr = line.slice(dataPrefix.length).trim();
        if (dataStr === "[DONE]") return;
        try {
          const json = JSON.parse(dataStr);
          onData(json);
        } catch {
          // ignore malformed chunks
        }
      }
    }
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

