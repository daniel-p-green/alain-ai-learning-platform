import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const poeApiKey = secret("POE_API_KEY");

interface TeacherRequest {
  model: "GPT-OSS-20B" | "GPT-OSS-120B";
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  task: "lesson_generation" | "assessment_creation" | "content_adaptation";
  temperature?: number;
  max_tokens?: number;
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

      // Set harmony-compatible parameters based on task
      const harmonyParams = getHarmonyParams(req.task);

      // Prepare harmony-formatted messages
      const harmonyMessages = formatHarmonyMessages(req.messages, req.task);

      const payload = {
        model: req.model,
        messages: harmonyMessages,
        stream: false,
        temperature: req.temperature ?? harmonyParams.temperature,
        top_p: 0.9,
        max_tokens: req.max_tokens ?? harmonyParams.max_tokens,
      };

      const apiKey = poeApiKey();
      if (!apiKey) {
        throw APIError.failedPrecondition("POE_API_KEY not configured");
      }

      const response = await fetch("https://api.poe.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "ALAIN-Teacher/1.0",
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

      return { success: true, content: data.choices?.[0]?.message?.content || '' };
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
function formatHarmonyMessages(messages: Array<{ role: string; content: string }>, task: string) {
  const systemMessage = {
    role: "system",
    content: `You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: ${new Date().toISOString().split('T')[0]}

Reasoning: high

# Valid channels: analysis, commentary, final. Channel must be included for every message.
Calls to these tools must go to the commentary channel: 'functions'.`
  };

  const developerMessage = {
    role: "developer",
    content: getDeveloperInstructions(task)
  };

  return [systemMessage, developerMessage, ...messages];
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
        message: "Teacher model authentication failed. Check POE_API_KEY."
      };
    }

    if (message.includes('404')) {
      return {
        code: "model_not_available",
        message: "Requested GPT-OSS teacher model is not available through Poe."
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
        message: "Teacher model request timed out. GPT-OSS models may be busy."
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
