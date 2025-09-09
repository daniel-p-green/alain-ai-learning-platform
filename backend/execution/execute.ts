import { api, APIError } from "encore.dev/api";
import { requireUserId } from "../auth";
import { validateBackendEnv } from "../config/env";
import { allowRate } from "../utils/ratelimit";
import { secret } from "encore.dev/config";
import { mapModelForProvider } from "./providers/aliases";

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
}

interface ExecuteResponse {
  success: boolean;
  content?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
    suggestion?: string;
    retry?: { recommended: boolean; delay_ms?: number; max_attempts?: number };
  };
}

// Executes LLM requests and returns the complete response.
export const execute = api<ExecuteRequest, ExecuteResponse>(
  { expose: true, method: "POST", path: "/execute" },
  async (req, ctx) => {
    try {
      validateBackendEnv();
      const userId = await requireUserId(ctx);
      const gate = allowRate(userId, 'execute', Number(process.env.EXECUTE_MAX_RPM || 60), 60_000);
      if (!gate.ok) {
        throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
      }
      const provider = getProvider(req.provider);
      const content = await withRetries(() => provider.execute(req));
      return { success: true, content };
    } catch (error) {
      const errorData = mapProviderError(error);
      return {
        success: false,
        error: errorData,
      };
    }
  }
);

// Teacher model router for lesson generation using GPT-OSS models (no auth required for internal use)
export const teacherExecute = api<ExecuteRequest, ExecuteResponse>(
  { expose: true, method: "POST", path: "/teacher/execute" },
  async (req, ctx) => {
    try {
      // Force Poe provider and GPT-OSS models for teacher functionality
      const teacherReq = { ...req, provider: "poe" as const };

      // Validate and set teacher model - only allow GPT-OSS-20B and GPT-OSS-120B
      if (!req.model || !req.model.toLowerCase().includes('gpt-oss')) {
        teacherReq.model = 'GPT-OSS-20B'; // Default teacher model
      } else if (req.model !== 'GPT-OSS-20B' && req.model !== 'GPT-OSS-120B') {
        teacherReq.model = 'GPT-OSS-20B'; // Force to valid teacher model
      }

      // Set harmony-compatible parameters for GPT-OSS models
      teacherReq.temperature = req.temperature ?? 0.3; // Lower temperature for more structured output
      teacherReq.max_tokens = req.max_tokens ?? 2048; // Reasonable limit for lesson generation

      const provider = getProvider(teacherReq.provider);
      const content = await withRetries(() => provider.execute(teacherReq));
      return { success: true, content };
    } catch (error) {
      const errorData = mapProviderError(error);
      return {
        success: false,
        error: errorData
      };
    }
  }
);

interface Provider {
  execute(req: ExecuteRequest): Promise<string>;
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
  async execute(req: ExecuteRequest): Promise<string> {
    const apiKey = poeApiKey();
    if (!apiKey) {
      throw APIError.failedPrecondition("POE_API_KEY not configured");
    }

    // Map model aliases using the shared helper (single source of truth)
    const payload = {
      model: mapModelForProvider('poe', req.model),
      messages: req.messages,
      stream: false,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
    };

    try {
      // Add a 30s timeout via AbortController
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 30_000);
      const response = await fetch("https://api.poe.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "ALAIN-Tutorial-Platform/1.0",
        },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Poe API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Poe API error: ${data.error.message || 'Unknown error'}`);
      }

      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw APIError.unauthenticated("Invalid Poe API key. Please check your POE_API_KEY configuration.");
        }
        if (error.message.includes('404')) {
          throw APIError.notFound(`Model "${req.model}" is not available on Poe. Please check the model name.`);
        }
        if (error.message.includes('429')) {
          throw APIError.resourceExhausted("Rate limit exceeded. Please wait a moment before trying again.");
        }
        if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
          throw APIError.deadlineExceeded("Request timed out. Please try again.");
        }
      }
      throw error;
    }
  }

  // Local model alias map removed in favor of shared mapModelForProvider
}

class OpenAICompatibleProvider implements Provider {
  async execute(req: ExecuteRequest): Promise<string> {
    const baseUrl = openaiBaseUrl();
    const apiKey = openaiApiKey();
    
    if (!baseUrl || !apiKey) {
      throw APIError.failedPrecondition("OPENAI_BASE_URL and OPENAI_API_KEY required");
    }

    // Map model aliases using the shared helper (single source of truth)
    const payload = {
      model: mapModelForProvider('openai-compatible', req.model),
      messages: req.messages,
      stream: false,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
    };

    try {
      // Add a 30s timeout via AbortController
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 30_000);
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "ALAIN-Tutorial-Platform/1.0",
        },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
      }

      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw APIError.unauthenticated("Invalid API key for OpenAI-compatible provider. Please check your OPENAI_API_KEY configuration.");
        }
        if (error.message.includes('404')) {
          throw APIError.notFound(`Model "${req.model}" is not available on the configured provider. Please check the model name and provider capabilities.`);
        }
        if (error.message.includes('429')) {
          throw APIError.resourceExhausted("Rate limit exceeded. Please wait a moment before trying again.");
        }
        if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
          throw APIError.deadlineExceeded("Request timed out. Please try again.");
        }
      }
      throw error;
    }
  }

  // Local model alias map removed in favor of shared mapModelForProvider
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 1;
  const maxAttempts = 2;
  let lastErr: any;
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const code = classifyErrorCode(err);
      if (code === 'network_timeout' || code === 'provider_unavailable' || code === 'connection_error') {
        if (attempt < maxAttempts) {
          await delay(300 * attempt);
          attempt++;
          continue;
        }
      }
      break;
    }
  }
  throw lastErr;
}

function mapProviderError(error: any): { code: string; message: string; details?: any; suggestion?: string; retry?: { recommended: boolean; delay_ms?: number; max_attempts?: number } } {
  if (error instanceof APIError) {
    return {
      code: getCodeFromAPIError(error),
      message: error.message,
      suggestion: suggestionForCode(getCodeFromAPIError(error)),
      retry: retryForCode(getCodeFromAPIError(error)),
    };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network') || message.includes('connect') || message.includes('econnreset')) {
      return {
        code: "connection_error",
        message: "Unable to connect to the AI provider. Please check your network.",
        suggestion: "Check connectivity and try again.",
        retry: { recommended: true, delay_ms: 300, max_attempts: 2 },
      };
    }
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        code: "network_timeout",
        message: "The request timed out.",
        suggestion: "Try again or reduce output length.",
        retry: { recommended: true, delay_ms: 300, max_attempts: 2 },
      };
    }

    if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
      return {
        code: "auth_expired",
        message: "Authentication failed or expired.",
        suggestion: "Re-authenticate and refresh API key.",
        retry: { recommended: false },
      };
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return {
        code: "quota_exceeded",
        message: "Rate limited or quota exceeded.",
        suggestion: "Wait before retrying or reduce request frequency.",
        retry: { recommended: true, delay_ms: 1000, max_attempts: 1 },
      };
    }

    if (message.includes('404') || message.includes('model')) {
      return {
        code: "model_not_found",
        message: "The specified AI model is not available. Please try a different model."
      };
    }

    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return {
        code: "provider_unavailable",
        message: "The AI provider is temporarily unavailable.",
        suggestion: "Retry shortly; providers often recover quickly.",
        retry: { recommended: true, delay_ms: 500, max_attempts: 2 },
      };
    }
    
    return {
      code: "unknown_error",
      message: "An unexpected error occurred.",
    };
  }
  
  return {
    code: "internal_error",
    message: "An internal error occurred.",
  };
}

function getCodeFromAPIError(error: APIError): string {
  const errorCode = (error as any).code;
  switch (errorCode) {
    case "unauthenticated":
      return "auth_expired";
    case "not_found":
      return "model_not_found";
    case "resource_exhausted":
      return "quota_exceeded";
    case "deadline_exceeded":
      return "network_timeout";
    case "failed_precondition":
      return "configuration_error";
    case "invalid_argument":
      return "invalid_request";
    default:
      return "internal_error";
  }
}

function classifyErrorCode(error: any): string {
  if (error instanceof APIError) return getCodeFromAPIError(error);
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (msg.includes('timeout') || msg.includes('aborted')) return 'network_timeout';
  if (msg.includes('401') || msg.includes('unauthorized')) return 'auth_expired';
  if (msg.includes('429') || msg.includes('rate limit')) return 'quota_exceeded';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('connect') || msg.includes('econnreset')) return 'connection_error';
  if (msg.includes('502') || msg.includes('503') || msg.includes('504')) return 'provider_unavailable';
  return 'unknown_error';
}

function suggestionForCode(code: string): string | undefined {
  switch (code) {
    case 'network_timeout':
      return 'Try again; consider reducing max tokens or simplifying the prompt.';
    case 'auth_expired':
      return 'Re-authenticate and update your API credentials.';
    case 'quota_exceeded':
      return 'Wait for quota reset, reduce request rate, or upgrade your plan.';
    case 'connection_error':
      return 'Check your connection or provider endpoint configuration.';
    case 'provider_unavailable':
      return 'Wait briefly and retry; provider may be recovering.';
    default:
      return undefined;
  }
}

function retryForCode(code: string): { recommended: boolean; delay_ms?: number; max_attempts?: number } | undefined {
  switch (code) {
    case 'network_timeout':
    case 'connection_error':
    case 'provider_unavailable':
      return { recommended: true, delay_ms: 300, max_attempts: 2 };
    case 'quota_exceeded':
      return { recommended: true, delay_ms: 1000, max_attempts: 1 };
    case 'auth_expired':
      return { recommended: false };
    default:
      return undefined;
  }
}
