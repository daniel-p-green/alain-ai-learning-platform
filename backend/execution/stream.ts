import { api, APIError } from "encore.dev/api";
import type { ExecuteRequest } from "./providers";
import { poeProvider, openAIProvider, type Provider } from "./providers";
import { requireUserId } from "../auth";

function selectProvider(name: ExecuteRequest["provider"]): Provider {
  switch (name) {
    case "poe":
      return poeProvider;
    case "openai-compatible":
      return openAIProvider;
    default:
      throw new Error("unsupported provider");
  }
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


export const executeStream = api<ExecuteRequest, void>(
  { expose: true, method: "POST", path: "/execute/stream", raw: true },
  async (req, ctx) => {
    const userId = await requireUserId(ctx);
    if (!incrementRate(userId)) {
      ctx.res.statusCode = 429;
      ctx.res.end("Rate limited");
      return;
    }

    ctx.res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    ctx.res.setHeader("Cache-Control", "no-cache");
    ctx.res.setHeader("Connection", "keep-alive");

    const write = (s: string) => ctx.res.write(s);

    const heartbeat = setInterval(() => {
      write(`:\n\n`);
    }, 15000);

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 120000);

    try {
      const provider = selectProvider(req.provider);
      await provider.stream(req, (data) => {
        write(`data: ${JSON.stringify(data)}\n\n`);
      }, ac.signal);
      write(`data: [DONE]\n\n`);
    } catch (err: any) {
      write(`event: error\n`);
      write(`data: ${JSON.stringify({ message: err?.message || "stream error" })}\n\n`);
    } finally {
      clearInterval(heartbeat);
      clearTimeout(timeout);
      ctx.res.end();
    }
  }
);
