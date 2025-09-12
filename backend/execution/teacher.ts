import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { mapModelForProvider } from "./providers/aliases";
import { loadAlainKitPrompt } from "./prompts/loader";

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
  { expose: false, method: "POST", path: "/teacher/generate" },
  async (req, ctx) => {
    try {
      // Validate teacher model
      if (req.model !== "GPT-OSS-20B" && req.model !== "GPT-OSS-120B") {
        throw APIError.invalidArgument("Only GPT-OSS-20B and GPT-OSS-120B are supported for teacher tasks");
      }

      // Resolve provider (request overrides env default)
      const initialProvider: "poe" | "openai-compatible" =
        req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe');
      const provider = resolveTeacherProvider(initialProvider, req.model, !!poeApiKey());

      // Set harmony-compatible parameters based on task
      const harmonyParams = getHarmonyParams(req.task);

      // Prepare messages: use standard OpenAI format for Poe, Harmony for local
      const supportsHarmonyRoles = provider === 'openai-compatible';
      const phase = (process.env.TEACHER_PROMPT_PHASE || '').trim() as any;
      let harmonyMessages: Array<{ role: string; content: string }>; 
      if (phase && supportsHarmonyRoles) {
        try {
          const { system, developer } = loadAlainKitPrompt(phase);
          harmonyMessages = composeMessagesWithFile(system, developer, req.messages, supportsHarmonyRoles);
        } catch {
          // Fallback to default formatter if loading fails
          harmonyMessages = formatHarmonyMessages(req.messages, req.task, supportsHarmonyRoles);
        }
      } else {
        harmonyMessages = formatHarmonyMessages(req.messages, req.task, supportsHarmonyRoles);
      }
      
      // Provider-specific execution
      const payload: any = {
        model: mapModelForProvider(provider, req.model),
        messages: harmonyMessages,
        stream: false,
        temperature: req.temperature ?? harmonyParams.temperature,
        top_p: 0.9,
        max_tokens: req.max_tokens ?? harmonyParams.max_tokens,
      };

      // Tools scaffold: enable by default for lesson_generation unless explicitly disabled
      const enableTools = req.task === 'lesson_generation' && process.env.TEACHER_ENABLE_TOOLS !== '0';
      if (enableTools) {
        payload.tools = [
          {
            type: 'function',
            function: {
              name: 'emit_lesson',
              description: 'Return a structured lesson object',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  reasoning_summary: { type: 'string' },
                  learning_objectives: { type: 'array', items: { type: 'string' } },
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        step_order: { type: 'integer' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        code_template: { type: 'string' },
                        expected_output: { type: 'string' },
                        model_params: { type: 'object' },
                      },
                      required: ['step_order','title','content']
                    }
                  },
                },
                required: ['title','description','steps']
              }
            }
          }
        ];
      }

      // Helper to extract content, honoring tool-calls when enabled
      const extractContent = (data: any): string => {
        try {
          const choice = data?.choices?.[0];
          const msg = choice?.message || {};
          const toolCalls = (msg as any).tool_calls;
          if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            const fn = toolCalls[0]?.function;
            const args = fn?.arguments;
            if (args && typeof args === 'string') {
              // Return the function arguments verbatim as JSON string
              return args;
            }
          }
          return msg?.content || '';
        } catch { return ''; }
      };

      const looksLikeJsonObject = (s: string): boolean => {
        try {
          let t = (s || '').trim();
          if (!t) return false;
          if (t.startsWith('```')) t = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
          const parsed = JSON.parse(t);
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed);
        } catch { return false; }
      };

      if (provider === 'poe') {
        const apiKey = poeApiKey();
        if (!apiKey) {
          throw APIError.failedPrecondition("POE_API_KEY not configured");
        }
        const runOnce = async (signal: AbortSignal, extraUserHint?: string) => {
          const body = { ...payload } as any;
          if (extraUserHint) {
            body.messages = [...(payload.messages || []), { role: 'user', content: extraUserHint }];
          }
          const response = await fetch("https://api.poe.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "User-Agent": "ALAIN-Teacher/1.0",
            },
            body: JSON.stringify(body),
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
        };
        const data = await withRetries(async (signal) => {
          return runOnce(signal);
        });
        let content = extractContent(data);
        if (req.task === 'lesson_generation' && process.env.TEACHER_JSON_RETRY === '1' && !looksLikeJsonObject(content)) {
          const retry = await withRetries(async (signal) => runOnce(signal, 'Output only a strict JSON object per the schema. No prose or markdown fences.'));
          content = extractContent(retry);
        }
        return { success: true, content };
      } else {
        // Use Encore secrets for OpenAI-compatible provider
        const baseUrl = openaiBaseUrl();
        const apiKey = openaiApiKey();
        if (!baseUrl || !apiKey) {
          throw APIError.failedPrecondition("OPENAI_BASE_URL and OPENAI_API_KEY required for openai-compatible provider");
        }
        const runOnce = async (signal: AbortSignal, extraUserHint?: string) => {
          const body = { ...payload } as any;
          if (req.task === 'lesson_generation') {
            // Prefer JSON mode when supported
            body.response_format = { type: 'json_object' };
          }
          if (extraUserHint) {
            body.messages = [...(payload.messages || []), { role: 'user', content: extraUserHint }];
          }
          const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "User-Agent": "ALAIN-Teacher/1.0",
            },
            body: JSON.stringify(body),
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
        };
        const data = await withRetries(async (signal) => runOnce(signal));
        let content = extractContent(data);
        if (req.task === 'lesson_generation' && process.env.TEACHER_JSON_RETRY === '1' && !looksLikeJsonObject(content)) {
          const retry = await withRetries(async (signal) => runOnce(signal, 'Output only a strict JSON object per the schema. No prose or markdown fences.'));
          content = extractContent(retry);
        }
        return { success: true, content };
      }
    } catch (error) {
      const errorData = mapTeacherError(error);
      // Mask detailed provider messages in production
      const isProd = process.env.NODE_ENV === 'production';
      return {
        success: false,
        error: isProd ? { code: errorData.code, message: 'Teacher model request failed. Please try again later.' } : errorData
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

// Compose messages using file-based system/developer content, with provider downgrade if needed
function composeMessagesWithFile(
  systemBody: string,
  developerBody: string,
  messages: Array<{ role: string; content: string }>,
  supportsHarmonyRoles: boolean
) {
  if (supportsHarmonyRoles) {
    return [
      { role: 'system', content: systemBody },
      { role: 'developer', content: developerBody },
      ...messages,
    ] as any;
  }
  // Provider without developer support: fold developer into system
  const downgraded = {
    role: 'system',
    content: `${systemBody}\n\n${developerBody}`,
  } as any;
  return [downgraded, ...messages] as any;
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

// Model aliasing handled by shared helper imported from ./providers/aliases

// Exported for unit tests and reuse
export function resolveTeacherProvider(
  requested: "poe" | "openai-compatible",
  model: "GPT-OSS-20B" | "GPT-OSS-120B",
  poeAvailable: boolean,
): "poe" | "openai-compatible" {
  if (requested === 'openai-compatible' && model === 'GPT-OSS-120B') {
    if (poeAvailable) return 'poe';
    // Mirror the same message thrown in API path
    throw APIError.failedPrecondition(
      'GPT-OSS-120B is not supported on local endpoints. Configure POE_API_KEY or switch to GPT-OSS-20B for local runs.'
    );
  }
  return requested;
}
