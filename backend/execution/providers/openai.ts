import type { ExecuteRequest, Provider } from "./index";
import { ensureOk, httpJson, streamSSE, toAuthHeader } from "./base";

async function complete(body: ExecuteRequest): Promise<string> {
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("OPENAI_BASE_URL and OPENAI_API_KEY required");
  const { resp, json: data } = await httpJson({
    url: `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    headers: { ...toAuthHeader(apiKey) },
    body: {
      model: body.model,
      messages: body.messages,
      stream: false,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    },
  });
  await ensureOk(resp, "OpenAI");
  if (data.error) throw new Error(data.error.message || "Unknown OpenAI error");
  return data.choices?.[0]?.message?.content || "";
}

async function stream(body: ExecuteRequest, onData: (data: any) => void, signal?: AbortSignal) {
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("OPENAI_BASE_URL and OPENAI_API_KEY required");
  const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      ...toAuthHeader(apiKey),
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
    signal,
  });
  await ensureOk(resp, "OpenAI");
  await streamSSE(resp, onData);
}

export const openAIProvider: Provider = { execute: complete, stream };
