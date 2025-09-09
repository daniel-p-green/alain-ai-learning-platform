import { api, APIError } from "encore.dev/api";
import { teacherGenerate } from "./teacher";
import { validateLesson, applyDefaults } from "./spec/lessonSchema";

interface LessonGenerationRequest {
  hfUrl: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B";
  includeAssessment?: boolean;
}

interface LessonGenerationResponse {
  success: boolean;
  lesson?: {
    id?: string;
    title: string;
    description: string;
    model: string;
    provider: string;
    difficulty: string;
    tags: string[];
    learning_objectives: string[];
    steps: Array<{
      step_order: number;
      title: string;
      content: string;
      code_template?: string;
      expected_output?: string;
      model_params?: any;
    }>;
    assessments?: Array<{
      question: string;
      options: string[];
      correct_index: number;
      explanation: string;
      difficulty: string;
      tags: string[];
    }>;
    model_maker?: {
      name: string;
      org_type: string;
      homepage?: string;
      license?: string;
      repo?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Generate structured lessons from HF URLs using GPT-OSS teacher models
export const generateLesson = api<LessonGenerationRequest, LessonGenerationResponse>(
  { expose: true, method: "POST", path: "/lessons/generate" },
  async (req, ctx) => {
    try {
      // Extract model information from HF URL
      const modelInfo = await extractHFModelInfo(req.hfUrl);

      // Generate lesson content using teacher model
      const lessonPrompt = buildLessonGenerationPrompt(modelInfo, req.difficulty, req.includeAssessment);

      const teacherResponse = await teacherGenerate({
        model: req.teacherModel,
        messages: [
          {
            role: "user",
            content: lessonPrompt
          }
        ],
        task: "lesson_generation"
      });

      if (!teacherResponse.success || !teacherResponse.content) {
        throw new Error(teacherResponse.error?.message || "Teacher model failed to generate lesson");
      }

      // Parse → fill defaults → validate. If invalid, attempt a single repair pass.
      let raw = teacherResponse.content;
      let lesson = applyDefaults(parseGeneratedLesson(raw, modelInfo, req.difficulty), req.difficulty, modelInfo);
      let v1 = validateLesson(lesson);
      if (!v1.valid) {
        const repaired = await attemptRepairJSON(req.teacherModel, raw);
        if (!repaired) {
          return { success: false, error: { code: "validation_error", message: "Generated lesson failed validation", details: v1.errors } } as any;
        }
        lesson = applyDefaults(parseGeneratedLesson(repaired, modelInfo, req.difficulty), req.difficulty, modelInfo);
        const v2 = validateLesson(lesson);
        if (!v2.valid) {
          return { success: false, error: { code: "validation_error", message: "Lesson invalid after repair", details: v2.errors } } as any;
        }
      }

      return { success: true, lesson };
    } catch (error) {
      const errorData = mapLessonGenerationError(error);
      return {
        success: false,
        error: errorData
      };
    }
  }
);

// Extract model information from Hugging Face URL
async function extractHFModelInfo(hfUrl: string) {
  // Extract model name from URL
  const urlMatch = hfUrl.match(/huggingface\.co\/([^\/]+)\/([^\/]+)/);
  if (!urlMatch) {
    throw APIError.invalidArgument("Invalid Hugging Face URL format");
  }

  const [, org, model] = urlMatch;

  try {
    // Try to fetch model card (this would be expanded in production)
    const response = await fetch(`https://huggingface.co/api/models/${org}/${model}`, {
      headers: {
        'User-Agent': 'ALAIN-Lesson-Generator/1.0'
      }
    });

    if (!response.ok) {
      // Fallback to basic info if API fails
      return {
        name: model,
        org: org,
        url: hfUrl,
        card: null
      };
    }

    const card = await response.json();
    return {
      name: model,
      org: org,
      url: hfUrl,
      card: card
    };
  } catch (error) {
    // Fallback if network request fails
    return {
      name: model,
      org: org,
      url: hfUrl,
      card: null
    };
  }
}

// Build comprehensive lesson generation prompt
function buildLessonGenerationPrompt(modelInfo: any, difficulty: string, includeAssessment?: boolean): string {
  const basePrompt = `Generate a comprehensive, structured lesson for the AI model: ${modelInfo.name}

Model Information:
- Organization: ${modelInfo.org}
- URL: ${modelInfo.url}
- Difficulty Level: ${difficulty}

Requirements:
1. Create 3-5 progressive lesson steps
2. Include practical examples and code snippets
3. Focus on real-world applications
4. Provide clear learning objectives
5. Include model maker information when available

${includeAssessment ? '6. Generate 3-5 multiple choice questions with explanations' : ''}

Format your response as a JSON object with this structure:
{
  "title": "Lesson Title",
  "description": "Brief description",
  "learning_objectives": ["Objective 1", "Objective 2"],
  "steps": [
    {
      "step_order": 1,
      "title": "Step Title",
      "content": "Step content in markdown",
      "code_template": "Optional code example",
      "expected_output": "Expected result",
      "model_params": {"temperature": 0.7}
    }
  ],
  "model_maker": {
    "name": "Company/Model Maker Name",
    "org_type": "company|individual|organization",
    "homepage": "https://...",
    "license": "MIT|Apache-2.0|etc",
    "repo": "https://github.com/..."
  }${includeAssessment ? `,
  "assessments": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Why this is correct",
      "difficulty": "beginner|intermediate|advanced",
      "tags": ["tag1", "tag2"]
    }
  ]` : ''}
}

Generate high-quality educational content that follows best practices for AI learning.`;

  return basePrompt;
}

// Parse and validate generated lesson content
function parseGeneratedLesson(content: string, modelInfo: any, difficulty: string) {
  try {
    // Clean up the content (remove markdown code blocks if present)
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    }

    const lessonData = JSON.parse(cleanContent);

    // Basic normalization only; validation and defaults applied later.
    return lessonData;
  } catch (error) {
    throw new Error(`Failed to parse generated lesson: ${error instanceof Error ? error.message : 'Invalid format'}`);
  }
}

/**
 * Validate lesson object against a minimal schema (no external deps).
 */
// moved validate + defaults to ./spec/lessonSchema

/**
 * Attempt a single "repair JSON" pass by asking the teacher to output valid JSON only.
 * Returns a JSON string or null if repair failed.
 */
async function attemptRepairJSON(teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B", broken: string): Promise<string | null> {
  try {
    const prompt = `The following JSON is invalid or incomplete for a lesson package. Repair it to include: title, description, steps (3-5) with { step_order, title, content, code_template?, expected_output?, model_params? }, optional learning_objectives[], optional assessments[]. Output ONLY JSON with valid syntax.\n\nJSON:\n${broken}`;
    const resp = await teacherGenerate({
      model: teacherModel,
      messages: [{ role: 'user', content: prompt }],
      task: 'lesson_generation',
      temperature: 0.1,
      max_tokens: 3000,
    });
    if (!resp.success || !resp.content) return null;
    // Return raw content; caller will parse and validate.
    return resp.content;
  } catch {
    return null;
  }
}

function mapLessonGenerationError(error: any): { code: string; message: string; details?: any } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid_argument')) {
      return {
        code: "invalid_hf_url",
        message: "Invalid Hugging Face URL provided"
      };
    }

    if (message.includes('teacher model') || message.includes('gpt-oss')) {
      return {
        code: "teacher_model_error",
        message: "Teacher model failed to generate lesson content"
      };
    }

    if (message.includes('parse') || message.includes('json')) {
      return {
        code: "parsing_error",
        message: "Failed to parse generated lesson content"
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        code: "network_error",
        message: "Failed to fetch model information from Hugging Face"
      };
    }

    return {
      code: "generation_error",
      message: error.message
    };
  }

  return {
    code: "internal_error",
    message: "Internal lesson generation error"
  };
}
