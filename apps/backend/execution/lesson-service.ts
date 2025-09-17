import { teacherGenerate } from './teacher';
import { applyDefaults, validateLesson } from './spec/lessonSchema';
import { fileSystemStorage } from '../storage/filesystem';
import { buildNotebook } from '../export/notebook';

export const TEACHER_MAX_TOKENS = Number(process.env.TEACHER_MAX_TOKENS || 4096);

type Provider = 'poe' | 'openai-compatible';

type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

interface LessonContentOptions {
  prompt: string;
  teacherModel: 'GPT-OSS-20B' | 'GPT-OSS-120B';
  provider: Provider;
  modelInfo: any;
  difficulty: LessonDifficulty;
}

export class LessonValidationError extends Error {
  details?: any;
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'LessonValidationError';
    this.details = details;
  }
}

export async function teacherGenerateWithRetry(
  args: Parameters<typeof teacherGenerate>[0],
  maxAttempts = 2
) {
  let attempt = 0;
  let lastErr: any;
  while (attempt < maxAttempts) {
    try {
      return await teacherGenerate(args as any);
    } catch (error) {
      lastErr = error;
      attempt += 1;
      if (attempt >= maxAttempts) break;
      const jitter = 200 + Math.floor(Math.random() * 200);
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }
  throw lastErr;
}

export async function generateLessonContent(options: LessonContentOptions) {
  const { prompt, teacherModel, provider, modelInfo, difficulty } = options;
  const teacherResponse = await teacherGenerateWithRetry({
    model: teacherModel,
    messages: [{ role: 'user', content: prompt }],
    task: 'lesson_generation',
    provider: provider as any,
    max_tokens: TEACHER_MAX_TOKENS,
    temperature: 0.2,
  });

  if (!teacherResponse.success || !teacherResponse.content) {
    throw new Error(teacherResponse.error?.message || 'Teacher model failed to generate lesson');
  }

  let raw = teacherResponse.content;
  let reasoningSummary = extractReasoning(raw);
  let lesson = applyDefaults(
    sanitizeLesson(parseGeneratedLesson(raw, modelInfo, difficulty)),
    difficulty,
    modelInfo
  );
  let validation = validateLesson(lesson);
  let usedRepair = false;

  if (!validation.valid) {
    const repaired = await attemptRepairJSON(teacherModel, raw, provider);
    if (!repaired) {
      throw new LessonValidationError('Generated lesson failed validation', validation.errors);
    }
    lesson = applyDefaults(
      sanitizeLesson(parseGeneratedLesson(repaired, modelInfo, difficulty)),
      difficulty,
      modelInfo
    );
    usedRepair = true;
    if (!reasoningSummary) reasoningSummary = extractReasoning(repaired);
    const revalidation = validateLesson(lesson);
    if (!revalidation.valid) {
      throw new LessonValidationError('Lesson invalid after repair', revalidation.errors);
    }
  }

  return {
    lesson,
    usedRepair,
    reasoningSummary,
    teacherResponse,
  };
}

interface PersistOptions {
  lesson: any;
  modelId: string;
  difficulty: LessonDifficulty;
  userId: string;
  requestProvider: Provider;
  teacherUsed: string;
  teacherDowngraded: boolean;
  enableCatalogIndex?: boolean;
  enableTutorialIngest?: boolean;
  tutorialProvider?: string;
  context?: string;
}

export async function persistLessonArtifacts(options: PersistOptions) {
  const {
    lesson,
    modelId,
    difficulty,
    userId,
    requestProvider,
    teacherUsed,
    teacherDowngraded,
    enableCatalogIndex,
    enableTutorialIngest,
    tutorialProvider,
    context,
  } = options;

  const providerForLesson = lesson.provider || requestProvider || 'openai-compatible';
  const logContext = context ? `[${context}]` : '[lessonArtifacts]';

  try {
    const lessonSave = await fileSystemStorage.saveLesson(modelId, lesson, providerForLesson);

    if (enableCatalogIndex) {
      try {
        const { indexGeneratedLesson } = await import('../catalog/store');
        await indexGeneratedLesson({
          file_path: lessonSave.filePath,
          model: modelId,
          provider: providerForLesson,
          difficulty,
          title: lesson.title || null,
          overview: lesson.description || null,
          maker: lesson.model_maker || null,
          section_count: Array.isArray(lesson.steps) ? lesson.steps.length : null,
          created_by: userId,
          visibility: 'private',
          tags: Array.isArray(lesson.tags) ? lesson.tags : [],
          size_bytes: lessonSave.metadata.size_bytes,
          checksum: lessonSave.metadata.checksum,
          last_generated: new Date().toISOString(),
        });
      } catch (error) {
        console.warn(`${logContext} catalog_lesson_index_failed`, error);
      }
    }

    const notebookMeta = {
      title: lesson.title || 'Generated Lesson',
      description: lesson.description || '',
      provider: providerForLesson,
      model: lesson.model || modelId,
    };

    const steps = (lesson.steps || []).map((step: any, index: number) => ({
      step_order: step.step_order || index + 1,
      title: step.title || '',
      content: step.content || '',
      code_template: step.code_template || null,
      model_params: step.model_params || { temperature: 0.7 },
      expected_output: step.expected_output || undefined,
    }));

    const assessments = (lesson.assessments || []).map((item: any, index: number) => ({
      step_order: item.step_order || index + 1,
      question: item.question || '',
      options: item.options || [],
      correct_index: item.correct_index || 0,
      explanation: item.explanation || null,
      difficulty: item.difficulty || undefined,
      tags: item.tags || [],
    }));

    const notebook = buildNotebook(
      notebookMeta,
      steps,
      assessments,
      lesson.model_maker,
      teacherUsed as any,
      teacherDowngraded
    );
    const nbMeta = await fileSystemStorage.saveNotebook(modelId, difficulty, notebook, 'ipynb', providerForLesson);

    if (enableCatalogIndex) {
      try {
        const { indexGeneratedNotebook } = await import('../catalog/store');
        await indexGeneratedNotebook({
          file_path: nbMeta.filePath,
          model: modelId,
          provider: providerForLesson,
          difficulty,
          title: lesson.title || null,
          overview: lesson.description || null,
          maker: lesson.model_maker || null,
          quality_score: (lesson as any)?.quality_score ?? null,
          colab_compatible: (lesson as any)?.colab_compatible ?? null,
          section_count: Array.isArray(lesson.steps) ? lesson.steps.length : null,
          created_by: userId,
          visibility: 'private',
          tags: Array.isArray(lesson.tags) ? lesson.tags : [],
          size_bytes: nbMeta.metadata.size_bytes,
          checksum: nbMeta.metadata.checksum,
          last_generated: new Date().toISOString(),
        });
      } catch (error) {
        console.warn(`${logContext} catalog_notebook_index_failed`, error);
      }
    }

    if (enableTutorialIngest && tutorialProvider) {
      try {
        const { ingestTutorialFromLesson } = await import('../tutorials/ingest');
        await ingestTutorialFromLesson(lesson as any, difficulty, modelId, tutorialProvider, userId);
      } catch (error) {
        console.warn(`${logContext} tutorials_ingest_failed`, error);
      }
    }
  } catch (error) {
    console.warn(`${logContext} save_error`, error);
  }
}

export function buildLessonGenerationPrompt(
  modelInfo: any,
  difficulty: string,
  includeAssessment?: boolean,
  includeReasoning?: boolean
): string {
  const wantReasoning = includeReasoning === true;
  const basePrompt = `Generate a comprehensive, structured lesson for the AI model: ${modelInfo.name}

Model Information:
- Organization: ${modelInfo.org}
- URL: ${modelInfo.url}
- Difficulty Level: ${difficulty}
${modelInfo.family ? `- Family: ${modelInfo.family}` : ''}
${modelInfo.toolUse ? `- Tool Use: ${modelInfo.toolUse}` : ''}

Requirements:
- Create 3-5 progressive lesson steps
- Include practical examples and code snippets
- Focus on real-world applications
- Provide clear learning objectives
- Include model maker information when available
- Provide a top-level "quality_score" (integer 0-100) that reflects lesson polish and accuracy
- Set "colab_compatible" to true when the notebook can run as-is in Google Colab, otherwise false
${modelInfo.toolUse === 'native' ? '- Include one short step demonstrating Tool Use via OpenAI-compatible "tools" with a simple function (e.g., get_current_time). Keep it safe and local.' : ''}
${includeAssessment ? '- Generate 3-5 multiple choice questions with explanations' : ''}

Format your response as a JSON object with this structure:
{
  "title": "Lesson Title",
  "description": "Brief description",
${wantReasoning ? '  "reasoning_summary": "2-4 sentences explaining why you chose this teaching approach and step ordering.",' : ''}
  "quality_score": 92,
  "colab_compatible": true,
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
    "repo": "https://github.com/...",
    "responsible_use": ["Usage guideline", "Safety consideration"]
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

export function buildLessonFromTextPrompt(
  textContent: string,
  difficulty: string,
  includeAssessment?: boolean,
  includeReasoning?: boolean
): string {
  const snippet = textContent.length > 2000 ? `${textContent.slice(0, 2000)}\n...` : textContent;
  const wantReasoning = includeReasoning === true;
  const prompt = `You are an expert AI educator. Create a structured, practical lesson from the following source material. Focus on clarity, hands-on steps, and real-world utility. Do not include external links unless they are in the source text.\n\nSOURCE MATERIAL (verbatim excerpt):\n---\n${snippet}\n---\n\nDifficulty Level: ${difficulty}\n${includeAssessment ? 'Include 3-5 multiple choice questions with explanations.' : ''}\nInclude a numeric "quality_score" (0-100) and a boolean "colab_compatible" flag describing notebook readiness.\n\nOutput a single JSON object with the following structure:\n{
  "title": "Lesson Title",
  "description": "Brief description",
${wantReasoning ? '  "reasoning_summary": "2-4 sentences explaining your teaching strategy and step ordering.",' : ''}
  "quality_score": 92,
  "colab_compatible": true,
  "learning_objectives": ["Objective 1", "Objective 2"],
  "steps": [
    { "step_order": 1, "title": "Step Title", "content": "Step content in markdown", "code_template": "Optional code", "expected_output": "Optional", "model_params": {"temperature": 0.7} }
  ]${includeAssessment ? `,
  "assessments": [
    { "question": "Question text?", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "Why this is correct", "difficulty": "${difficulty}", "tags": ["core"] }
  ]` : ''}
}`;
  return prompt;
}

export function mapLessonGenerationError(error: any): { code: string; message: string; details?: any } {
  if (error instanceof LessonValidationError) {
    return {
      code: 'validation_error',
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid_argument')) {
      return {
        code: 'invalid_hf_url',
        message: 'Invalid Hugging Face URL provided',
      };
    }

    if (message.includes('teacher model') || message.includes('gpt-oss')) {
      return {
        code: 'teacher_model_error',
        message: 'Teacher model failed to generate lesson content',
      };
    }

    if (message.includes('parse') || message.includes('json')) {
      return {
        code: 'parsing_error',
        message: 'Failed to parse generated lesson content',
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        code: 'network_error',
        message: 'Failed to fetch model information from Hugging Face',
      };
    }

    return {
      code: 'generation_error',
      message: error.message,
    };
  }

  return {
    code: 'internal_error',
    message: 'Internal lesson generation error',
  };
}

function extractReasoning(jsonText: string): string | undefined {
  try {
    let text = jsonText.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    }
    const payload = JSON.parse(text);
    const reasoning = payload?.reasoning_summary;
    if (typeof reasoning === 'string' && reasoning.trim()) return reasoning.trim();
  } catch {}
  return undefined;
}

function parseGeneratedLesson(content: string, modelInfo: any, difficulty: string) {
  try {
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleanContent);
  } catch (error) {
    throw new Error(`Failed to parse generated lesson: ${error instanceof Error ? error.message : 'Invalid format'}`);
  }
}

function sanitizeLesson(lessonData: any) {
  const allowTop = new Set([
    'title',
    'description',
    'model',
    'provider',
    'difficulty',
    'tags',
    'quality_score',
    'colab_compatible',
    'learning_objectives',
    'steps',
    'assessments',
    'model_maker',
  ]);
  const allowStep = new Set(['step_order', 'title', 'content', 'code_template', 'expected_output', 'model_params']);
  const output: any = {};
  for (const key of Object.keys(lessonData || {})) {
    if (allowTop.has(key)) output[key] = lessonData[key];
  }
  if (Array.isArray(output.steps)) {
    output.steps = output.steps.map((step: any) => {
      const clean: any = {};
      for (const key of Object.keys(step || {})) {
        if (allowStep.has(key)) clean[key] = step[key];
      }
      return clean;
    });
  }
  return output;
}

async function attemptRepairJSON(
  teacherModel: 'GPT-OSS-20B' | 'GPT-OSS-120B',
  broken: string,
  provider: Provider
): Promise<string | null> {
  try {
    const prompt = `The following JSON is invalid or incomplete for a lesson package. Repair with valid JSON only. Include: title, description, steps[3-5] with { step_order, title, content, code_template?, expected_output?, model_params? }, optional learning_objectives[], optional assessments[]. Output ONLY JSON.\n\nJSON:\n${broken}`;
    const resp = await teacherGenerate({
      model: teacherModel,
      messages: [{ role: 'user', content: prompt }],
      task: 'lesson_generation',
      provider: provider as any,
      temperature: 0.0,
      max_tokens: TEACHER_MAX_TOKENS,
    });
    if (!resp.success || !resp.content) return null;
    return resp.content;
  } catch {
    return null;
  }
}
