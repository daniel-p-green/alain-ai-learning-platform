import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const poeApiKey = secret("POE_API_KEY");
const openaiBaseUrl = secret("OPENAI_BASE_URL");
const openaiApiKey = secret("OPENAI_API_KEY");

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ExecuteRequest {
  provider: "poe" | "openai-compatible";
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream: true;
}

// Executes LLM requests with streaming response.
export const execute = api<ExecuteRequest, void>(
  { expose: true, method: "POST", path: "/execute" },
  async (req, ctx) => {
    if (!req.stream) {
      throw APIError.invalidArgument("streaming is required");
    }

    // Set SSE headers
    ctx.response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    ctx.response.setHeader("Cache-Control", "no-cache");
    ctx.response.setHeader("Connection", "keep-alive");
    ctx.response.setHeader("Access-Control-Allow-Origin", "*");

    try {
      const provider = getProvider(req.provider);
      await provider.stream(req, ctx.response);
    } catch (error) {
      const errorData = mapProviderError(error);
      ctx.response.write(`data: ${JSON.stringify({ error: errorData })}\n\n`);
    } finally {
      ctx.response.write("data: [DONE]\n\n");
      ctx.response.end();
    }
  }
);

interface Provider {
  stream(req: ExecuteRequest, response: any): Promise<void>;
}

function getProvider(providerName: string): Provider {
  switch (providerName) {
    case "poe":
      return new PoeProvider();
    case "openai-compatible":
      return new OpenAICompatibleProvider();
    default:
      throw APIError.invalidArgument("unsupported provider");
  }
}

class PoeProvider implements Provider {
  async stream(req: ExecuteRequest, response: any): Promise<void> {
    const apiKey = poeApiKey();
    if (!apiKey) {
      throw APIError.failedPrecondition("POE_API_KEY not configured");
    }

    const payload = {
      model: req.model,
      messages: req.messages,
      stream: true,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
    };

    const fetchResponse = await fetch("https://api.poe.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
    }

    const reader = fetchResponse.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              response.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

class OpenAICompatibleProvider implements Provider {
  async stream(req: ExecuteRequest, response: any): Promise<void> {
    const baseUrl = openaiBaseUrl();
    const apiKey = openaiApiKey();
    
    if (!baseUrl || !apiKey) {
      throw APIError.failedPrecondition("OPENAI_BASE_URL and OPENAI_API_KEY required");
    }

    const payload = {
      model: req.model,
      messages: req.messages,
      stream: true,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
    };

    const fetchResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
    }

    const reader = fetchResponse.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              response.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

function mapProviderError(error: any): { code: string; message: string } {
  if (error instanceof Error) {
    const message = error.message;
    
    if (message.includes("401") || message.includes("403")) {
      return { code: "auth_error", message: "Authentication failed" };
    }
    if (message.includes("404")) {
      return { code: "model_not_found", message: "Model not found" };
    }
    if (message.includes("408") || message.includes("timeout")) {
      return { code: "timeout", message: "Request timeout" };
    }
    if (message.includes("409")) {
      return { code: "conflict", message: "Request conflict" };
    }
    if (message.includes("429")) {
      return { code: "rate_limited", message: "Rate limit exceeded" };
    }
    if (message.includes("500") || message.includes("502") || message.includes("503")) {
      return { code: "provider_unavailable", message: "Provider temporarily unavailable" };
    }
    
    return { code: "internal", message: message };
  }
  
  return { code: "internal", message: "Unknown error" };
}
