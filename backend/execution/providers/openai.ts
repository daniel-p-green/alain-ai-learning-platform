import type { ExecuteRequest, Provider } from "./index";

async function complete(body: ExecuteRequest): Promise<string> {
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

async function stream(body: ExecuteRequest, onData: (data: any) => void, signal?: AbortSignal) {
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
    signal,
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
      const prefix = "data:";
      if (line.startsWith(prefix)) {
        const d = line.slice(prefix.length).trim();
        if (d === "[DONE]") return;
        try { onData(JSON.parse(d)); } catch {}
      }
    }
  }
}

export const openAIProvider: Provider = { execute: complete, stream };

