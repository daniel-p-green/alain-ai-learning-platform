import type { ExecuteRequest, Provider } from "./index";
import { ensureOk, httpJson, streamSSE, toAuthHeader } from "./base";
import { mapModelForProvider } from "./aliases";
import { secret } from "encore.dev/config";

const poeApiKey = secret("POE_API_KEY");

async function complete(body: ExecuteRequest): Promise<string> {
  const apiKey = poeApiKey();
  if (!apiKey) throw new Error("POE_API_KEY not configured");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 30_000);
  const { resp, json: data } = await httpJson({
    url: "https://api.poe.com/v1/chat/completions",
    headers: {
      ...toAuthHeader(apiKey),
    },
    body: {
      model: mapModelForProvider('poe', body.model),
      messages: body.messages,
      stream: false,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    },
    signal: ac.signal,
  });
  clearTimeout(timer);
  await ensureOk(resp, "Poe");
  if (data.error) throw new Error(data.error.message || "Unknown Poe error");
  return data.choices?.[0]?.message?.content || "";
}

async function stream(body: ExecuteRequest, onData: (data: any) => void, signal?: AbortSignal) {
  const apiKey = poeApiKey();
  if (!apiKey) throw new Error("POE_API_KEY not configured");
  // Combine external abort with a 30s internal timeout
  const ac = new AbortController();
  const timers: any[] = [];
  const clearAll = () => { timers.forEach(clearTimeout); };
  timers.push(setTimeout(() => ac.abort(), 30_000));
  const combined: AbortSignal = (AbortSignal as any).any ? (AbortSignal as any).any([ac.signal, signal].filter(Boolean)) : (signal || ac.signal);
  const resp = await fetch("https://api.poe.com/v1/chat/completions", {
    method: "POST",
    headers: {
      ...toAuthHeader(apiKey),
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
    },
    body: JSON.stringify({
      model: mapModelForProvider('poe', body.model),
      messages: body.messages,
      stream: true,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    }),
    signal: combined,
  });
  await ensureOk(resp, "Poe");
  try {
    await streamSSE(resp, onData);
  } finally {
    clearAll();
  }
}

export const poeProvider: Provider = { execute: complete, stream };
