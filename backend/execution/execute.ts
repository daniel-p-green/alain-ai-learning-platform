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
}

interface ExecuteResponse {
  success: boolean;
  content?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Executes LLM requests and returns the complete response.
export const execute = api<ExecuteRequest, ExecuteResponse>(
  { expose: true, method: "POST", path: "/execute" },
  async (req) => {
    try {
      const provider = getProvider(req.provider);
      const content = await provider.execute(req);
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

    const payload = {
      model: req.model,
      messages: req.messages,
      stream: false,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
    };

    try {
      const response = await fetch("https://api.poe.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "ALAIN-Tutorial-Platform/1.0",
        },
        body: JSON.stringify(payload),
      });

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
}

class OpenAICompatibleProvider implements Provider {
  async execute(req: ExecuteRequest): Promise<string> {
    const baseUrl = openaiBaseUrl();
    const apiKey = openaiApiKey();
    
    if (!baseUrl || !apiKey) {
      throw APIError.failedPrecondition("OPENAI_BASE_URL and OPENAI_API_KEY required");
    }

    const payload = {
      model: req.model,
      messages: req.messages,
      stream: false,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
    };

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "ALAIN-Tutorial-Platform/1.0",
        },
        body: JSON.stringify(payload),
      });

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
}

function mapProviderError(error: any): { code: string; message: string; details?: any } {
  if (error instanceof APIError) {
    return {
      code: getCodeFromAPIError(error),
      message: error.message
    };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network') || message.includes('connect') || message.includes('econnreset')) {
      return {
        code: "connection_error",
        message: "Unable to connect to the AI provider. Please check your internet connection and try again."
      };
    }
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        code: "timeout",
        message: "The request took too long to complete. Please try again with a shorter prompt or different parameters."
      };
    }

    if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
      return {
        code: "authentication_failed",
        message: "Authentication failed. Please check your API key configuration."
      };
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return {
        code: "rate_limited",
        message: "Too many requests. Please wait a moment before trying again."
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
        message: "The AI provider is temporarily unavailable. Please try again in a few moments."
      };
    }
    
    return {
      code: "unknown_error",
      message: "An unexpected error occurred. Please try again."
    };
  }
  
  return {
    code: "internal_error",
    message: "An internal error occurred. Please try again."
  };
}

function getCodeFromAPIError(error: APIError): string {
  const errorCode = (error as any).code;
  switch (errorCode) {
    case "unauthenticated":
      return "authentication_failed";
    case "not_found":
      return "model_not_found";
    case "resource_exhausted":
      return "rate_limited";
    case "deadline_exceeded":
      return "timeout";
    case "failed_precondition":
      return "configuration_error";
    case "invalid_argument":
      return "invalid_request";
    default:
      return "internal_error";
  }
}
