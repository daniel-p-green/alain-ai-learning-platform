import type { ExecuteBody, Provider } from "./index";
import { mapModelForProvider } from "./aliases";

async function complete(body: ExecuteBody): Promise<string> {
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) throw new Error("POE_API_KEY not configured");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 30_000);
  const resp = await fetch("https://api.poe.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
    },
    body: JSON.stringify({
      model: mapModelForProvider('poe', body.model),
      messages: body.messages,
      stream: false,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens,
    }),
    signal: ac.signal,
  });
  clearTimeout(timer);
  if (!resp.ok) throw new Error(`Poe API error (${resp.status})`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || "Unknown Poe error");
  return data.choices?.[0]?.message?.content || "";
}

async function stream(body: ExecuteBody, onData: (data: any) => void, signal?: AbortSignal) {
  const apiKey = process.env.POE_API_KEY;
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
      Authorization: `Bearer ${apiKey}`,
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
  if (!resp.ok || !resp.body) throw new Error(`Poe API error (${resp.status})`);
  try {
    await pipeSSE(resp, onData);
  } finally {
    clearAll();
  }
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

export const poeProvider: Provider = { execute: complete, stream };
