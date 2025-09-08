import { api } from "encore.dev/api";
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


export const executeStream = api<ExecuteRequest, { success: false; error: { code: string; message: string } }>(
  { expose: true, method: "POST", path: "/execute/stream" },
  async (req, ctx) => {
    await requireUserId(ctx);
    // Streaming via raw endpoints is not available with current Encore TS config.
    // Use the Next.js App Router SSE at /api/execute instead.
    return {
      success: false,
      error: {
        code: "not_supported",
        message: "Streaming over Encore TS is disabled here. Use web /api/execute for SSE."
      }
    };
  }
);
