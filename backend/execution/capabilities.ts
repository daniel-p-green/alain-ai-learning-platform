import { api } from "encore.dev/api";

interface ProviderCapabilities {
  id: string;
  name: string;
  description: string;
  models: ModelInfo[];
  supportsStreaming: boolean;
  requiresAuth: boolean;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
  status: 'available' | 'configuring' | 'unavailable';
}

interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  pricing: {
    inputPerToken?: number;
    outputPerToken?: number;
    flatRate?: string;
  };
  capabilities: string[];
}

interface CapabilitiesResponse {
  providers: ProviderCapabilities[];
  teacherModels: {
    available: boolean;
    provider: string;
    models: string[];
  };
  defaultProvider: string;
}

// Get capabilities of all available providers
export const getCapabilities = api<{}, CapabilitiesResponse>(
  { expose: true, method: "GET", path: "/providers" },
  async () => {
    const providers: ProviderCapabilities[] = [];

    // Poe provider capabilities
    const poeProvider: ProviderCapabilities = {
      id: "poe",
      name: "Poe",
      description: "Single API key for 20+ AI models including GPT-OSS teacher models",
      supportsStreaming: true,
      requiresAuth: true,
      rateLimits: {
        requestsPerMinute: 30,
        tokensPerMinute: 100000
      },
      status: process.env.POE_API_KEY ? 'available' : 'configuring',
      models: [
        {
          id: "GPT-OSS-20B",
          name: "GPT-OSS-20B (Teacher)",
          contextWindow: 32768,
          pricing: { flatRate: "Free tier + paid" },
          capabilities: ["chat", "completion", "lesson_generation", "assessment"]
        },
        {
          id: "GPT-OSS-120B",
          name: "GPT-OSS-120B (Teacher)",
          contextWindow: 32768,
          pricing: { flatRate: "Free tier + paid" },
          capabilities: ["chat", "completion", "lesson_generation", "assessment"]
        },
        {
          id: "GPT-4o",
          name: "GPT-4o",
          contextWindow: 128000,
          pricing: { flatRate: "Free tier + paid" },
          capabilities: ["chat", "completion", "vision"]
        },
        {
          id: "Claude-3.5-Sonnet",
          name: "Claude-3.5-Sonnet",
          contextWindow: 200000,
          pricing: { flatRate: "Free tier + paid" },
          capabilities: ["chat", "completion"]
        },
        {
          id: "Gemini-1.5-Pro",
          name: "Gemini-1.5-Pro",
          contextWindow: 1048576,
          pricing: { flatRate: "Free tier + paid" },
          capabilities: ["chat", "completion", "vision"]
        }
      ]
    };
    providers.push(poeProvider);

    // OpenAI-compatible provider capabilities
    const openAIProvider: ProviderCapabilities = {
      id: "openai-compatible",
      name: "OpenAI Compatible",
      description: "Bring your own OpenAI-compatible API endpoint",
      supportsStreaming: true,
      requiresAuth: true,
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 150000
      },
      status: (process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL) ? 'available' : 'configuring',
      models: [
        {
          id: "gpt-4o",
          name: "GPT-4o",
          contextWindow: 128000,
          pricing: { inputPerToken: 0.000005, outputPerToken: 0.000015 },
          capabilities: ["chat", "completion", "vision"]
        },
        {
          id: "gpt-4o-mini",
          name: "GPT-4o-mini",
          contextWindow: 128000,
          pricing: { inputPerToken: 0.00000015, outputPerToken: 0.0000006 },
          capabilities: ["chat", "completion", "vision"]
        },
        {
          id: "gpt-4-turbo",
          name: "GPT-4-turbo",
          contextWindow: 128000,
          pricing: { inputPerToken: 0.00001, outputPerToken: 0.00003 },
          capabilities: ["chat", "completion", "vision"]
        }
      ]
    };
    providers.push(openAIProvider);

    return {
      providers,
      teacherModels: {
        available: poeProvider.status === 'available',
        provider: "poe",
        models: ["GPT-OSS-20B", "GPT-OSS-120B"]
      },
      defaultProvider: "poe"
    };
  }
);

// Validate provider configuration
export const validateProvider = api<{ providerId: string }, { valid: boolean; message?: string }>(
  { expose: true, method: "POST", path: "/providers/validate" },
  async (req) => {
    try {
      switch (req.providerId) {
        case "poe":
          const hasPoeKey = process.env.POE_API_KEY && process.env.POE_API_KEY.length > 0;
          if (!hasPoeKey) {
            return {
              valid: false,
              message: "Poe API key not configured. Get one at https://poe.com/api_key"
            };
          }
          break;

        case "openai-compatible":
          const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
          const hasOpenAIBase = process.env.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL.length > 0;
          if (!hasOpenAIKey || !hasOpenAIBase) {
            return {
              valid: false,
              message: "OpenAI API key and base URL required. Configure OPENAI_API_KEY and OPENAI_BASE_URL"
            };
          }
          break;

        default:
          return {
            valid: false,
            message: `Unknown provider: ${req.providerId}`
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
