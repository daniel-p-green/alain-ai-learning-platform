import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { mapModelForProvider } from "./providers/aliases";

const poeApiKey = secret("POE_API_KEY");
const openaiBaseUrl = secret("OPENAI_BASE_URL");
const openaiApiKey = secret("OPENAI_API_KEY");

interface TeacherRequest {
  model: "GPT-OSS-20B" | "GPT-OSS-120B";
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  task: "lesson_generation" | "assessment_creation" | "content_adaptation";
  temperature?: number;
  max_tokens?: number;
  // Provider toggle: default 'poe'; allow OpenAI-compatible for local/offline (e.g., Ollama/vLLM)
  provider?: "poe" | "openai-compatible";
}

interface TeacherResponse {
  success: boolean;
  content?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Dedicated teacher model service for GPT-OSS models using harmony format
export const teacherGenerate = api<TeacherRequest, TeacherResponse>(
  { expose: true, method: "POST", path: "/teacher/generate" },
  async (req, ctx) => {
    try {
      // Validate teacher model
      if (req.model !== "GPT-OSS-20B" && req.model !== "GPT-OSS-120B") {
        throw APIError.invalidArgument("Only GPT-OSS-20B and GPT-OSS-120B are supported for teacher tasks");
      }

      // Resolve provider (request overrides env default)
      const provider: "poe" | "openai-compatible" =
        req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe');

      // Set harmony-compatible parameters based on task
      const harmonyParams = getHarmonyParams(req.task);

      // Prepare harmony-formatted messages
      const provider: "poe" | "openai-compatible" =
        req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe');

      const supportsHarmonyRoles = false; // be conservative across providers
      const harmonyMessages = formatHarmonyMessages(req.messages, req.task, supportsHarmonyRoles);
      
      // Provider-specific execution
      const payload = {
        model: mapModelForProvider(provider, req.model),
        messages: harmonyMessages,
        stream: false,
        temperature: req.temperature ?? harmonyParams.temperature,
        top_p: 0.9,
        max_tokens: req.max_tokens ?? harmonyParams.max_tokens,
      } as any;

      if (provider === 'poe') {
        const apiKey = poeApiKey();
        if (!apiKey) {
          throw APIError.failedPrecondition("POE_API_KEY not configured");
        }
        const data = await withRetries(async (signal) => {
          const response = await fetch("https://api.poe.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "User-Agent": "ALAIN-Teacher/1.0",
            },
            body: JSON.stringify(payload),
            signal,
          });
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Poe API error (${response.status}): ${errorText}`);
          }
          const data = await response.json();
          if (data.error) {
            throw new Error(`Poe API error: ${data.error.message || 'Unknown error'}`);
          }
          return data;
        });
        return { success: true, content: data.choices?.[0]?.message?.content || '' };
      } else {
        const baseUrl = openaiBaseUrl();
        const apiKey = openaiApiKey();
        if (!baseUrl || !apiKey) {
          throw APIError.failedPrecondition("OPENAI_BASE_URL and OPENAI_API_KEY required for openai-compatible provider");
        }
        const data = await withRetries(async (signal) => {
          const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "User-Agent": "ALAIN-Teacher/1.0",
            },
            body: JSON.stringify(payload),
            signal,
          });
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`OpenAI-compatible API error (${response.status}): ${errorText}`);
          }
          const data = await response.json();
          if (data.error) {
            throw new Error(`OpenAI-compatible API error: ${data.error.message || 'Unknown error'}`);
          }
          return data;
        });
        return { success: true, content: data.choices?.[0]?.message?.content || '' };
      }
    } catch (error) {
      const errorData = mapTeacherError(error);
      return {
        success: false,
        error: errorData
      };
    }
  }
);

// Get harmony-compatible parameters for different teacher tasks
function getHarmonyParams(task: string) {
  const baseParams = {
    temperature: 0.3,
    max_tokens: 2048,
    reasoning: "high"
  };

  switch (task) {
    case "lesson_generation":
      return {
        ...baseParams,
        temperature: 0.2, // Lower temperature for structured lesson generation
        max_tokens: 4096, // Longer responses for lessons
      };
    case "assessment_creation":
      return {
        ...baseParams,
        temperature: 0.1, // Very structured for assessments
        max_tokens: 2048,
      };
    case "content_adaptation":
      return {
        ...baseParams,
        temperature: 0.4, // Slightly higher for creative adaptation
        max_tokens: 3072,
      };
    default:
      return baseParams;
  }
}

// Format messages according to harmony format requirements
function formatHarmonyMessages(messages: Array<{ role: string; content: string }>, task: string, supportsHarmonyRoles: boolean) {
  const systemMessage = {
    role: "system",
    content: `You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: ${new Date().toISOString().split('T')[0]}

Reasoning: high

# Valid channels: analysis, commentary, final. Channel must be included for every message.
Calls to these tools must go to the commentary channel: 'functions'.`
  };
  if (supportsHarmonyRoles) {
    const developerMessage = { role: "developer", content: getDeveloperInstructions(task) } as any;
    return [systemMessage as any, developerMessage, ...messages];
  }
  // Downgrade: fold developer content into system preface
  const downgradedSystem = {
    role: "system",
    content: systemMessage.content + "\n\n" + getDeveloperInstructions(task)
  };
  return [downgradedSystem as any, ...messages];
}

// Get task-specific developer instructions following harmony format
function getDeveloperInstructions(task: string): string {
  const baseInstructions = `# Instructions

You are ALAIN's expert teacher AI. Generate high-quality educational content following best practices.

# Tools

## functions

namespace functions {

// Generate structured lesson content from HF model information
type generate_lesson = (_: {
hf_url: string,
difficulty: "beginner" | "intermediate" | "advanced",
learning_objectives: string[],
assessment_needed: boolean,
}) => any;

// Create multiple choice questions with explanations
type create_assessment = (_: {
topic: string,
difficulty: "beginner" | "intermediate" | "advanced",
question_count: number,
include_explanations: boolean,
}) => any;

// Adapt content based on user performance
type adapt_content = (_: {
current_content: string,
user_performance: number,
target_difficulty: "beginner" | "intermediate" | "advanced",
}) => any;

} // namespace functions`;

  switch (task) {
    case "lesson_generation":
      return baseInstructions + `

Generate comprehensive, structured lessons from Hugging Face model information.
Focus on practical examples, clear explanations, and progressive difficulty.`;
    case "assessment_creation":
      return baseInstructions + `

Create challenging but fair multiple choice questions that test understanding.
Include detailed explanations for both correct and incorrect answers.`;
    case "content_adaptation":
      return baseInstructions + `

Adapt educational content based on user performance and learning needs.
Maintain educational quality while adjusting difficulty and pacing.`;
    default:
      return baseInstructions;
  }
}

function mapTeacherError(error: any): { code: string; message: string; details?: any } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('401')) {
      return {
        code: "authentication_failed",
        message: "Teacher model authentication failed. Check provider API key configuration."
      };
    }

    if (message.includes('404')) {
      return {
        code: "model_not_available",
        message: "Requested GPT-OSS teacher model is not available on the selected provider."
      };
    }

    if (message.includes('429')) {
      return {
        code: "rate_limited",
        message: "Teacher model rate limit exceeded. Please try again later."
      };
    }

    if (message.includes('timeout')) {
      return {
        code: "timeout",
        message: "Teacher model request timed out. Provider may be busy."
      };
    }

    return {
      code: "teacher_error",
      message: "Teacher model error: " + error.message
    };
  }

  return {
    code: "internal_error",
    message: "Internal teacher service error."
  };
}

// Retry helper with a 30s timeout and two attempts (300ms/600ms backoff)
async function withRetries<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const attempts = [300, 600];
  let lastErr: any;
  for (let i = 0; i <= attempts.length; i++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30_000);
    try {
      const out = await fn(ac.signal);
      clearTimeout(timer);
      return out;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (i < attempts.length) await new Promise(r => setTimeout(r, attempts[i]));
    }
  }
  throw lastErr;
}

// Map model aliases per provider.
function mapModelForProvider(model: "GPT-OSS-20B" | "GPT-OSS-120B", provider: "poe" | "openai-compatible"): string {
  if (provider === 'poe') return model;
  // For OpenAI-compatible (e.g., Ollama), use checkpoint tags
  const map: Record<string, string> = {
    "GPT-OSS-20B": "gpt-oss:20b",
    "GPT-OSS-120B": "gpt-oss:120b",
  };
  return map[model] || model;
}
