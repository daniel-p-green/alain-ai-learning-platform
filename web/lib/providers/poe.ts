import type { ExecuteBody, Provider } from "./index";

async function complete(body: ExecuteBody): Promise<string> {
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
      model: mapModelName(body.model),
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

async function stream(body: ExecuteBody, onData: (data: any) => void) {
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
      model: mapModelName(body.model),
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

function mapModelName(alainModel: string): string {
  const modelMap: Record<string, string> = {
    // GPT-OSS models (teacher models)
    'GPT-OSS-20B': 'GPT-OSS-20B',
    'GPT-OSS-120B': 'GPT-OSS-120B',
    'gpt-oss-20b': 'GPT-OSS-20B',
    'gpt-oss-120b': 'GPT-OSS-120B',

    // Popular Poe models
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o-mini',
    'claude-3.5-sonnet': 'Claude-3.5-Sonnet',
    'claude-3-haiku': 'Claude-3-Haiku',
    'gemini-1.5-pro': 'Gemini-1.5-Pro',
    'gemini-1.5-flash': 'Gemini-1.5-Flash',
    'grok-2': 'Grok-2',
    'llama-3.1-405b': 'Llama-3.1-405B',

    // Default fallback
    'default': 'GPT-4o-mini'
  };

  return modelMap[alainModel.toLowerCase()] || modelMap['default'];
}

export const poeProvider: Provider = { execute: complete, stream };

