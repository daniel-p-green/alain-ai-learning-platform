export interface RequestOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

export async function httpJson<T = any>(opts: RequestOptions): Promise<{ resp: Response; json: T }> {
  const { url, method = "POST", headers = {}, body, signal } = opts;
  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "ALAIN-Tutorial-Platform/1.0",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  let json: any = null;
  try {
    json = await resp.json();
  } catch {
    // ignore JSON parse errors for non-JSON responses
  }
  return { resp, json };
}

export async function ensureOk(resp: Response, providerName: string, payload?: any) {
  if (!resp.ok) {
    let text = '';
    try { text = await resp.text(); } catch {}
    const err = new Error(`${providerName} API error (${resp.status}): ${text || 'Unknown error'}`);
    throw err;
  }
}

export async function streamSSE(resp: Response, onData: (data: any) => void) {
  if (!resp.body) throw new Error("No response stream body");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
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

export function toAuthHeader(key: string) {
  return { Authorization: `Bearer ${key}` };
}

export function classifyError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('401') || msg.includes('unauthorized')) return 'auth_expired';
  if (msg.includes('429') || msg.includes('rate limit')) return 'quota_exceeded';
  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('econnreset')) return 'network_timeout';
  if (msg.includes('404')) return 'model_not_found';
  if (msg.includes('502') || msg.includes('503') || msg.includes('504')) return 'provider_unavailable';
  return 'unknown_error';
}

