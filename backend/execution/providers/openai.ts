import type { ExecuteRequest, Provider } from "./index";
import { ensureOk, httpJson, streamSSE, toAuthHeader } from "./base";
import { mapModelForProvider } from "./aliases";
import { secret } from "encore.dev/config";

const openaiBaseUrl = secret("OPENAI_BASE_URL");
const openaiApiKey = secret("OPENAI_API_KEY");

async function complete(body: ExecuteRequest): Promise<string> {
  const baseUrl = openaiBaseUrl();
  const apiKey = openaiApiKey();
  if (!baseUrl || !apiKey) throw new Error("OPENAI_BASE_URL and OPENAI_API_KEY required");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 30_000);
  const { resp, json: data } = await httpJson({
    url: `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    headers: { ...toAuthHeader(apiKey) },
    body: {
      model: mapModelForProvider('openai-compatible', body.model),
      messages: body.messages,
      stream: false,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    },
    signal: ac.signal,
  });
  clearTimeout(timer);
  await ensureOk(resp, "OpenAI");
  if (data.error) throw new Error(data.error.message || "Unknown OpenAI error");
  return data.choices?.[0]?.message?.content || "";
}

async function stream(body: ExecuteRequest, onData: (data: any) => void, signal?: AbortSignal) {
  const baseUrl = openaiBaseUrl();
  const apiKey = openaiApiKey();
  if (!baseUrl || !apiKey) throw new Error("OPENAI_BASE_URL and OPENAI_API_KEY required");
  // Combine external abort with a 30s internal timeout
  const ac = new AbortController();
  const timers: any[] = [];
  const clearAll = () => { timers.forEach(clearTimeout); };
  timers.push(setTimeout(() => ac.abort(), 30_000));
  const combined: AbortSignal = (AbortSignal as any).any ? (AbortSignal as any).any([ac.signal, signal].filter(Boolean)) : (signal || ac.signal);
  const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      ...toAuthHeader(apiKey),
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
    },
    body: JSON.stringify({
      model: mapModelForProvider('openai-compatible', body.model),
      messages: body.messages,
      stream: true,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    }),
    signal: combined,
  });
  await ensureOk(resp, "OpenAI");
  try {
    await streamSSE(resp, onData);
  } finally {
    clearAll();
  }
}

export const openAIProvider: Provider = { execute: complete, stream };
