import { api, APIError } from "encore.dev/api";
import { teacherGenerate } from "./teacher";

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

      // Parse and validate the generated lesson
      const lesson = parseGeneratedLesson(teacherResponse.content, modelInfo, req.difficulty);

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

    // Validate required fields
    if (!lessonData.title || !lessonData.description || !lessonData.steps) {
      throw new Error("Generated lesson missing required fields");
    }

    // Add default values and metadata
    lessonData.model = modelInfo.name;
    lessonData.provider = "poe";
    lessonData.difficulty = difficulty;
    lessonData.tags = lessonData.tags || [`${modelInfo.org}`, difficulty];

    // Ensure steps have proper structure
    lessonData.steps = lessonData.steps.map((step: any, index: number) => ({
      step_order: step.step_order || (index + 1),
      title: step.title,
      content: step.content,
      code_template: step.code_template || null,
      expected_output: step.expected_output || null,
      model_params: step.model_params || { temperature: 0.7 }
    }));

    return lessonData;
  } catch (error) {
    throw new Error(`Failed to parse generated lesson: ${error instanceof Error ? error.message : 'Invalid format'}`);
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
