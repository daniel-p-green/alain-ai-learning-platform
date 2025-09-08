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
    recoveryActions?: string[];
    retryAfter?: number;
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

function mapProviderError(error: any): { 
  code: string; 
  message: string; 
  details?: any; 
  recoveryActions?: string[];
  retryAfter?: number;
} {
  if (error instanceof APIError) {
    return {
      code: getCodeFromAPIError(error),
      message: error.message,
      recoveryActions: getRecoveryActionsFromAPIError(error)
    };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        code: "request_timeout",
        message: "The request timed out while waiting for a response from the AI provider.",
        recoveryActions: [
          "Try reducing the length of your prompt",
          "Reduce the max_tokens parameter if specified",
          "Check if the AI provider is experiencing high load",
          "Try again in a few moments"
        ]
      };
    }

    if (message.includes('fetch') || message.includes('network') || message.includes('connect') || message.includes('econnreset')) {
      return {
        code: "network_connectivity_error",
        message: "Unable to establish a connection to the AI provider.",
        recoveryActions: [
          "Check your internet connection",
          "Verify the provider's service status",
          "Check if the provider URL is correct",
          "Try again in a few moments",
          "Contact your network administrator if the issue persists"
        ]
      };
    }

    if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
      return {
        code: "authentication_failed",
        message: "Authentication failed. Please verify your API key.",
        recoveryActions: [
          "Verify that your API key is correct and active",
          "Check if your API key has the necessary permissions",
          "Ensure the API key hasn't expired",
          "Try regenerating your API key from the provider's dashboard",
          "Contact the provider's support if the key appears valid"
        ]
      };
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return {
        code: "rate_limit_exceeded",
        message: "Rate limit exceeded. Please wait before making another request.",
        recoveryActions: [
          "Wait a few moments before retrying",
          "Consider reducing the frequency of your requests",
          "Implement exponential backoff in your retry logic",
          "Check your usage limits and consider upgrading your plan",
          "Use request batching if supported by the provider"
        ]
      };
    }

    if (message.includes('404') || message.includes('model')) {
      return {
        code: "model_not_available",
        message: "The requested model is not available.",
        recoveryActions: [
          "Verify the model name is spelled correctly",
          "Check the provider's documentation for available models",
          "Ensure you have access to the requested model",
          "Try using a different model that's known to be available",
          "Contact the provider to confirm model availability"
        ]
      };
    }

    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return {
        code: "provider_server_error",
        message: "The AI provider is experiencing server issues.",
        recoveryActions: [
          "Try again in a few moments as this is likely temporary",
          "Check the provider's status page for known issues",
          "Implement exponential backoff for retries",
          "Consider using a different provider as a fallback",
          "Report the issue to the provider if it persists"
        ]
      };
    }
    
    return {
      code: "unknown_error",
      message: "An unexpected error occurred while processing your request.",
      details: { originalMessage: error.message },
      recoveryActions: [
        "Try again in a few moments",
        "Check your request parameters",
        "Contact support if the issue persists"
      ]
    };
  }
  
  return {
    code: "internal_error",
    message: "An internal error occurred. Please try again.",
    recoveryActions: [
      "Try again in a few moments",
      "Contact support if the issue persists"
    ]
  };
}

function getCodeFromAPIError(error: APIError): string {
  const errorCode = (error as any).code;
  switch (errorCode) {
    case "unauthenticated":
      return "authentication_failed";
    case "not_found":
      return "model_not_available";
    case "resource_exhausted":
      return "rate_limit_exceeded";
    case "deadline_exceeded":
      return "request_timeout";
    case "failed_precondition":
      return "configuration_error";
    case "invalid_argument":
      return "invalid_request_parameters";
    case "permission_denied":
      return "access_forbidden";
    default:
      return "internal_error";
  }
}

function getRecoveryActionsFromAPIError(error: APIError): string[] {
  const errorCode = (error as any).code;
  switch (errorCode) {
    case "unauthenticated":
      return [
        "Verify your API key configuration",
        "Check if the API key has the necessary permissions",
        "Ensure the API key hasn't expired"
      ];
    case "not_found":
      return [
        "Verify the model name is correct",
        "Check the provider's available models",
        "Ensure you have access to the requested model"
      ];
    case "resource_exhausted":
      return [
        "Wait a few moments before retrying",
        "Consider reducing request frequency",
        "Check your usage limits"
      ];
    case "deadline_exceeded":
      return [
        "Try with a shorter prompt",
        "Reduce the max_tokens parameter",
        "Try again in a few moments"
      ];
    case "failed_precondition":
      return [
        "Check your configuration settings",
        "Verify all required secrets are set",
        "Review the provider setup documentation"
      ];
    case "invalid_argument":
      return [
        "Check your request parameters",
        "Verify the request format",
        "Review the API documentation"
      ];
    default:
      return [
        "Try again in a few moments",
        "Contact support if the issue persists"
      ];
  }
}
