import { api, APIError } from "encore.dev/api";

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  models: string[];
  requiresApiKey: boolean;
  isTeacherModelAvailable: boolean;
  pricing: string;
  rateLimits: string;
  setupComplexity: 'easy' | 'medium' | 'hard';
}

interface ProvidersResponse {
  recommended: ProviderInfo;
  alternatives: ProviderInfo[];
  teacherModels: {
    available: boolean;
    provider: string;
    models: string[];
  };
}

// Get available providers with their capabilities and requirements
export const getProviders = api<{}, ProvidersResponse>(
  { expose: true, method: "GET", path: "/providers" },
  async () => {
    const providers: ProviderInfo[] = [
      {
        id: "poe",
        name: "Poe",
        description: "Single API key for 20+ AI models including GPT-OSS teacher models",
        models: ["GPT-OSS-20B", "GPT-OSS-120B", "GPT-4o", "Claude-3.5-Sonnet", "Gemini-1.5-Pro"],
        requiresApiKey: true,
        isTeacherModelAvailable: true,
        pricing: "Free tier + paid plans",
        rateLimits: "Generous limits, good for learning",
        setupComplexity: "easy"
      },
      {
        id: "openai",
        name: "OpenAI (BYOK)",
        description: "Direct access to GPT models with your own API key",
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
        requiresApiKey: true,
        isTeacherModelAvailable: false,
        pricing: "Pay per token",
        rateLimits: "Based on your OpenAI plan",
        setupComplexity: "medium"
      },
      {
        id: "anthropic",
        name: "Anthropic (BYOK)",
        description: "Direct access to Claude models with your own API key",
        models: ["claude-3.5-sonnet", "claude-3-haiku"],
        requiresApiKey: true,
        isTeacherModelAvailable: false,
        pricing: "Pay per token",
        rateLimits: "Based on your Anthropic plan",
        setupComplexity: "medium"
      },
      {
        id: "ollama",
        name: "Ollama (Local)",
        description: "Run AI models locally on your machine",
        models: ["llama3.1", "mistral", "codellama"],
        requiresApiKey: false,
        isTeacherModelAvailable: false,
        pricing: "Free (your hardware)",
        rateLimits: "Limited by your hardware",
        setupComplexity: "hard"
      },
      {
        id: "vllm",
        name: "vLLM Server",
        description: "Self-hosted vLLM server for high-performance inference",
        models: ["Any model you host"],
        requiresApiKey: false,
        isTeacherModelAvailable: false,
        pricing: "Free (your hardware/cloud)",
        rateLimits: "Based on your server capacity",
        setupComplexity: "hard"
      }
    ];

    return {
      recommended: providers.find(p => p.id === "poe")!,
      alternatives: providers.filter(p => p.id !== "poe"),
      teacherModels: {
        available: true,
        provider: "poe",
        models: ["GPT-OSS-20B", "GPT-OSS-120B"]
      }
    };
  }
);

// Validate provider configuration
export const validateProvider = api<{ provider: string }, { valid: boolean; message?: string }>(
  { expose: true, method: "POST", path: "/providers/validate" },
  async (req) => {
    try {
      switch (req.provider) {
        case "poe":
          // Check if Poe API key is configured
          const hasPoeKey = process.env.POE_API_KEY && process.env.POE_API_KEY.length > 0;
          if (!hasPoeKey) {
            return {
              valid: false,
              message: "Poe API key not configured. Get one at https://poe.com/api_key"
            };
          }
          break;

        case "openai":
          const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
          const hasOpenAIUrl = process.env.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL.length > 0;
          if (!hasOpenAIKey || !hasOpenAIUrl) {
            return {
              valid: false,
              message: "OpenAI API key and base URL required. Configure OPENAI_API_KEY and OPENAI_BASE_URL"
            };
          }
          break;

        case "ollama":
          // Check if Ollama is running locally
          try {
            const response = await fetch("http://localhost:11434/api/tags");
            if (!response.ok) {
              return {
                valid: false,
                message: "Ollama not running. Install and start Ollama: https://ollama.com"
              };
            }
          } catch {
            return {
              valid: false,
              message: "Cannot connect to Ollama. Make sure it's running on localhost:11434"
            };
          }
          break;

        default:
          return {
            valid: false,
            message: `Unknown provider: ${req.provider}`
          };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Provider validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
);
