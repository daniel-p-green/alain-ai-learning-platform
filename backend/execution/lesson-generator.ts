import { api, APIError } from "encore.dev/api";
import { teacherGenerate } from "./teacher";
import { inferModelInfo } from "./models";
import { requireUserId } from "../auth";
import { allowRate } from "../utils/ratelimit";
import { validateBackendEnv } from "../config/env";
import { validateLesson, applyDefaults } from "./spec/lessonSchema";
import { parseHfUrl } from "../utils/hf";
import { fileSystemStorage } from "../storage/filesystem";
import { buildNotebook } from "../export/notebook";

interface LessonGenerationRequest {
  hfUrl: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B";
  includeAssessment?: boolean;
  // Optional provider toggle to select where the Teacher runs
  provider?: "poe" | "openai-compatible";
  // Optional: ask the teacher to include a brief reasoning summary in the output JSON
  includeReasoning?: boolean;
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
export const generateLesson = api(
  { expose: true, method: "POST", path: "/lessons/generate" },
  async (req: LessonGenerationRequest, ctx: any): Promise<LessonGenerationResponse> => {
    validateBackendEnv();
    const userId = await requireUserId(ctx);
    const gate = allowRate(userId, 'lessons_generate', Number(process.env.GENERATE_MAX_RPM || 20), 60_000);
    if (!gate.ok) {
      throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
    }
    // Dedupe concurrent requests: same hfUrl+difficulty coalesce to one in-flight promise (short TTL)
    const key = `${req.hfUrl}::${req.difficulty}`;
    const existing = inflight.get(key);
    if (existing) return await existing;
    const task = (async (): Promise<LessonGenerationResponse> => {
      try {
      // Extract model information from HF URL
      const modelInfo = await extractHFModelInfo(req.hfUrl);

      // Generate lesson content using teacher model
      const lessonPrompt = buildLessonGenerationPrompt(modelInfo, req.difficulty, req.includeAssessment, req.includeReasoning);

      const selectedProvider = (req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe')) as any;
      const teacherResponse = await teacherGenerateWithRetry({
        model: req.teacherModel,
        messages: [
          {
            role: "user",
            content: lessonPrompt
          }
        ],
        task: "lesson_generation",
        provider: selectedProvider,
      });

      if (!teacherResponse.success || !teacherResponse.content) {
        throw new Error(teacherResponse.error?.message || "Teacher model failed to generate lesson");
      }

      // Parse → fill defaults → validate. If invalid, attempt a single repair pass.
      let raw = teacherResponse.content;

      // Extract optional reasoning_summary before sanitization
      const extractReasoning = (jsonText: string): string | undefined => {
        try {
          let t = jsonText.trim();
          if (t.startsWith('```')) t = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
          const o = JSON.parse(t);
          const r = o?.reasoning_summary;
          return typeof r === 'string' && r.trim() ? r.trim() : undefined;
        } catch { return undefined; }
      };
      let reasoningSummary = extractReasoning(raw);

      let lesson = applyDefaults(sanitizeLesson(parseGeneratedLesson(raw, modelInfo, req.difficulty)), req.difficulty, modelInfo);
      let v1 = validateLesson(lesson);
      let usedRepair = false;
      if (!v1.valid) {
        const repaired = await attemptRepairJSON(req.teacherModel, raw, selectedProvider);
        if (!repaired) {
          return { success: false, error: { code: "validation_error", message: "Generated lesson failed validation", details: v1.errors } } as any;
        }
        lesson = applyDefaults(sanitizeLesson(parseGeneratedLesson(repaired, modelInfo, req.difficulty)), req.difficulty, modelInfo);
        usedRepair = true;
        // Try to re-extract reasoning if not present
        if (!reasoningSummary) reasoningSummary = extractReasoning(repaired);
        const v2 = validateLesson(lesson);
        if (!v2.valid) {
          return { success: false, error: { code: "validation_error", message: "Lesson invalid after repair", details: v2.errors } } as any;
        }
      }

      // Auto-save the generated lesson in both JSON and .ipynb formats
      try {
        const modelId = modelInfo.name || 'unknown-model';
        
        // Save raw lesson JSON (content/lessons/<provider>/<model>/<date>/lesson_<id>.json)
        await fileSystemStorage.saveLesson(modelId, lesson, lesson.provider || 'openai-compatible');
        
        // Convert to proper Jupyter notebook format and save
        const notebookMeta = {
          title: lesson.title || 'Generated Lesson',
          description: lesson.description || '',
          provider: lesson.provider || 'openai-compatible',
          model: lesson.model || modelId
        };
        
        const steps = (lesson.steps || []).map(step => ({
          step_order: step.step_order || 1,
          title: step.title || '',
          content: step.content || '',
          code_template: step.code_template || null,
          model_params: step.model_params || { temperature: 0.7 }
        }));
        
        const assessments = (lesson.assessments || []).map((assessment, index) => ({
          step_order: index + 1,
          question: assessment.question || '',
          options: assessment.options || [],
          correct_index: assessment.correct_index || 0,
          explanation: assessment.explanation || null
        }));
        
        const notebook = buildNotebook(notebookMeta, steps, assessments, lesson.model_maker);
        await fileSystemStorage.saveNotebook(modelId, req.difficulty, notebook, 'ipynb', lesson.provider || 'openai-compatible');
        
        console.log(`Lesson auto-saved for model: ${modelId}, difficulty: ${req.difficulty} (JSON + .ipynb)`);
      } catch (saveError) {
        console.warn('Failed to auto-save lesson:', saveError);
        // Don't fail the request if save fails
      }

      return { success: true, lesson, meta: { repaired: usedRepair, reasoning_summary: reasoningSummary } } as any;
      } catch (error) {
        const errorData = mapLessonGenerationError(error);
        return { success: false, error: errorData } as any;
      }
    })();
    inflight.set(key, task);
    // Cleanup after a short delay once it resolves
    task.finally(() => setTimeout(() => inflight.delete(key), 5000));
    return await task;
  }
);

// Generate structured lessons without an HF URL, using a local/runtime model id
export const generateLocalLesson = api<{
  modelId: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B";
  includeAssessment?: boolean;
  provider?: "poe" | "openai-compatible";
  includeReasoning?: boolean;
}, LessonGenerationResponse>(
  { expose: true, method: "POST", path: "/lessons/generate-local" },
  async (req, ctx) => {
    validateBackendEnv();
    const userId = await requireUserId(ctx);
    const gate = allowRate(userId, 'lessons_generate', Number(process.env.GENERATE_MAX_RPM || 20), 60_000);
    if (!gate.ok) {
      throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
    }

    const key = `local::${req.modelId}::${req.difficulty}`;
    const existing = inflight.get(key);
    if (existing) return await existing;
    const task = (async (): Promise<LessonGenerationResponse> => {
      try {
        const base = (process.env.OPENAI_BASE_URL || '').trim() || 'http://localhost:1234/v1';
        const inferred = inferModelInfo(req.modelId);
        const modelInfo = {
          name: req.modelId,
          org: inferred.maker || 'local',
          url: base.replace(/\/$/, ''),
          toolUse: inferred.toolUse,
          family: inferred.family,
        } as any;
        const lessonPrompt = buildLessonGenerationPrompt(modelInfo, req.difficulty, req.includeAssessment, req.includeReasoning);
        const selectedProvider = (req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe')) as any;
        const teacherResponse = await teacherGenerateWithRetry({
          model: req.teacherModel,
          messages: [ { role: "user", content: lessonPrompt } ],
          task: "lesson_generation",
          provider: selectedProvider,
        });
        if (!teacherResponse.success || !teacherResponse.content) {
          throw new Error(teacherResponse.error?.message || "Teacher model failed to generate lesson");
        }
        let raw = teacherResponse.content;
        const extractReasoning = (jsonText: string): string | undefined => {
          try {
            let t = jsonText.trim();
            if (t.startsWith('```')) t = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
            const o = JSON.parse(t);
            const r = o?.reasoning_summary;
            return typeof r === 'string' && r.trim() ? r.trim() : undefined;
          } catch { return undefined; }
        };
        let reasoningSummary = extractReasoning(raw);
        let lesson = applyDefaults(sanitizeLesson(parseGeneratedLesson(raw, modelInfo, req.difficulty)), req.difficulty, modelInfo);
        let v1 = validateLesson(lesson);
        let usedRepair = false;
        if (!v1.valid) {
          const repaired = await attemptRepairJSON(req.teacherModel, raw, selectedProvider);
          if (!repaired) {
            return { success: false, error: { code: "validation_error", message: "Generated lesson failed validation", details: v1.errors } } as any;
          }
          lesson = applyDefaults(sanitizeLesson(parseGeneratedLesson(repaired, modelInfo, req.difficulty)), req.difficulty, modelInfo);
          usedRepair = true;
          if (!reasoningSummary) reasoningSummary = extractReasoning(repaired);
          const v2 = validateLesson(lesson);
          if (!v2.valid) {
            return { success: false, error: { code: "validation_error", message: "Repaired lesson failed validation", details: v2.errors } } as any;
          }
        }
        return { success: true, lesson, meta: { repaired: usedRepair, reasoning_summary: reasoningSummary } } as any;
      } catch (error: any) {
        return { success: false, error: { code: 'generation_error', message: error?.message || 'Failed to generate' } } as any;
      }
    })();
    inflight.set(key, task);
    task.finally(() => setTimeout(() => inflight.delete(key), 5000));
    return await task;
  }
);

// In-memory map of in-flight generation promises
const inflight = new Map<string, Promise<LessonGenerationResponse>>();

// Minimal retry wrapper to smooth over transient hiccups
async function teacherGenerateWithRetry(args: Parameters<typeof teacherGenerate>[0], maxAttempts = 2) {
  let attempt = 0;
  let lastErr: any;
  while (attempt < maxAttempts) {
    try {
      return await teacherGenerate(args as any);
    } catch (err) {
      lastErr = err;
      attempt++;
      if (attempt >= maxAttempts) break;
      const jitter = 200 + Math.floor(Math.random() * 200);
      await new Promise(r => setTimeout(r, jitter));
    }
  }
  throw lastErr;
}

// Extract model information from Hugging Face URL
export async function extractHFModelInfo(hfUrl: string) {
  // Strict HF parsing and host allowlisting
  let ref: ReturnType<typeof parseHfUrl>;
  try {
    ref = parseHfUrl(hfUrl);
  } catch {
    throw APIError.invalidArgument("Invalid Hugging Face URL format");
  }

  const { owner, repo, kind, revision } = ref;

  // Strict offline mode: never attempt any network calls
  const offline = (() => {
    const v = (process.env.OFFLINE_MODE || '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
  })();
  if (offline) {
    return { name: repo, org: owner, url: `https://huggingface.co/${kind === 'dataset' ? 'datasets/' : kind === 'space' ? 'spaces/' : ''}${owner}/${repo}`, card: null, kind, revision } as any;
  }

  const kindPath = kind === 'dataset' ? 'datasets' : (kind === 'space' ? 'spaces' : 'models');
  const base = `https://huggingface.co/api/${kindPath}/${owner}/${repo}`;
  const apiUrl = revision ? `${base}?revision=${encodeURIComponent(revision)}` : base;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'ALAIN-Lesson-Generator/1.0' },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!response.ok) {
      const err = new Error(`HF fetch failed (${response.status})`);
      (err as any).status = response.status;
      throw err;
    }
    const card = await response.json();
    return { name: repo, org: owner, url: `https://huggingface.co/${kind === 'dataset' ? 'datasets/' : kind === 'space' ? 'spaces/' : ''}${owner}/${repo}`, card, kind, revision } as any;
  } catch (error: any) {
    clearTimeout(t);
    // Surface timeout/abort distinctly
    if (error?.name === 'AbortError') {
      const e = new Error('HF fetch timeout');
      (e as any).status = 408;
      throw e;
    }
    throw error;
  }
}

// Build comprehensive lesson generation prompt
function buildLessonGenerationPrompt(modelInfo: any, difficulty: string, includeAssessment?: boolean, includeReasoning?: boolean): string {
  const wantReasoning = includeReasoning === true; // opt-in only
  const basePrompt = `Generate a comprehensive, structured lesson for the AI model: ${modelInfo.name}

Model Information:
- Organization: ${modelInfo.org}
- URL: ${modelInfo.url}
- Difficulty Level: ${difficulty}
${modelInfo.family ? `- Family: ${modelInfo.family}` : ''}
${modelInfo.toolUse ? `- Tool Use: ${modelInfo.toolUse}` : ''}

Requirements:
1. Create 3-5 progressive lesson steps
2. Include practical examples and code snippets
3. Focus on real-world applications
4. Provide clear learning objectives
5. Include model maker information when available
${modelInfo.toolUse === 'native' ? '6. Include one short step demonstrating Tool Use via OpenAI-compatible "tools" with a simple function (e.g., get_current_time). Keep it safe and local.' : ''}

${includeAssessment ? '6. Generate 3-5 multiple choice questions with explanations' : ''}

Format your response as a JSON object with this structure:
{
  "title": "Lesson Title",
  "description": "Brief description",
${wantReasoning ? '"reasoning_summary": "2-4 sentences explaining why you chose this teaching approach and step ordering.",' : ''}
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

// Build prompt when the source material is raw text pasted by the user
function buildLessonFromTextPrompt(textContent: string, difficulty: string, includeAssessment?: boolean, includeReasoning?: boolean): string {
  const snippet = textContent.length > 2000 ? textContent.slice(0, 2000) + "\n..." : textContent;
  const wantReasoning = includeReasoning === true; // opt-in only
  const prompt = `You are an expert AI educator. Create a structured, practical lesson from the following source material. Focus on clarity, hands-on steps, and real-world utility. Do not include external links unless they are in the source text.\n\nSOURCE MATERIAL (verbatim excerpt):\n---\n${snippet}\n---\n\nDifficulty Level: ${difficulty}\n${includeAssessment ? 'Include 3-5 multiple choice questions with explanations.' : ''}\n\nOutput a single JSON object with the following structure:\n{
  "title": "Lesson Title",
  "description": "Brief description",
  ${wantReasoning ? '"reasoning_summary": "2-4 sentences explaining your teaching strategy and step ordering.",' : ''}
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

// Drop unknown fields defensively
function sanitizeLesson(lessonData: any) {
  const allowTop = new Set([
    'title','description','model','provider','difficulty','tags','learning_objectives','steps','assessments','model_maker'
  ]);
  const allowStep = new Set(['step_order','title','content','code_template','expected_output','model_params']);
  const out: any = {};
  for (const k of Object.keys(lessonData || {})) {
    if (allowTop.has(k)) out[k] = (lessonData as any)[k];
  }
  if (Array.isArray(out.steps)) {
    out.steps = out.steps.map((s: any) => {
      const ss: any = {};
      for (const k of Object.keys(s || {})) if (allowStep.has(k)) ss[k] = s[k];
      return ss;
    });
  }
  return out;
}

/**
 * Validate lesson object against a minimal schema (no external deps).
 */
// moved validate + defaults to ./spec/lessonSchema

/**
 * Attempt a single "repair JSON" pass by asking the teacher to output valid JSON only.
 * Returns a JSON string or null if repair failed.
 */
async function attemptRepairJSON(
  teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B",
  broken: string,
  provider: 'poe' | 'openai-compatible'
): Promise<string | null> {
  try {
    const prompt = `The following JSON is invalid or incomplete for a lesson package. Repair with valid JSON only. Include: title, description, steps[3-5] with { step_order, title, content, code_template?, expected_output?, model_params? }, optional learning_objectives[], optional assessments[]. Output ONLY JSON.\n\nJSON:\n${broken}`;
    const resp = await teacherGenerate({
      model: teacherModel,
      messages: [{ role: 'user', content: prompt }],
      task: 'lesson_generation',
      provider: provider as any,
      temperature: 0.0,
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

// Generate a lesson directly from pasted text input
export const generateFromText = api<{
  textContent: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B";
  includeAssessment?: boolean;
  provider?: "poe" | "openai-compatible";
  includeReasoning?: boolean;
}, LessonGenerationResponse>(
  { expose: true, method: "POST", path: "/lessons/generate-from-text" },
  async (req, ctx) => {
    validateBackendEnv();
    const userId = await requireUserId(ctx);
    const gate = allowRate(userId, 'lessons_generate', Number(process.env.GENERATE_MAX_RPM || 20), 60_000);
    if (!gate.ok) {
      throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
    }
    const text = (req.textContent || '').trim();
    if (!text) return { success: false, error: { code: 'invalid_argument', message: 'textContent required' } } as any;

    const key = `text::${hashKey(text)}::${req.difficulty}`;
    const existing = inflight.get(key);
    if (existing) return await existing;

    const task = (async (): Promise<LessonGenerationResponse> => {
      try {
        const lessonPrompt = buildLessonFromTextPrompt(text, req.difficulty, req.includeAssessment, req.includeReasoning);
        const selectedProvider = (req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe')) as any;
        const teacherResponse = await teacherGenerateWithRetry({
          model: req.teacherModel,
          messages: [ { role: 'user', content: lessonPrompt } ],
          task: 'lesson_generation',
          provider: selectedProvider,
        });
        if (!teacherResponse.success || !teacherResponse.content) {
          throw new Error(teacherResponse.error?.message || 'Teacher model failed to generate lesson');
        }
        let raw = teacherResponse.content;
        const extractReasoning = (jsonText: string): string | undefined => {
          try {
            let t = jsonText.trim();
            if (t.startsWith('```')) t = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
            const o = JSON.parse(t);
            const r = o?.reasoning_summary;
            return typeof r === 'string' && r.trim() ? r.trim() : undefined;
          } catch { return undefined; }
        };
        let reasoningSummary = extractReasoning(raw);
        const modelInfo = { name: 'Custom Content', org: 'user', url: 'about:blank' } as any;
        let lesson = applyDefaults(sanitizeLesson(parseGeneratedLesson(raw, modelInfo, req.difficulty)), req.difficulty, modelInfo);
        let v1 = validateLesson(lesson);
        let usedRepair = false;
        if (!v1.valid) {
          const repaired = await attemptRepairJSON(req.teacherModel, raw, selectedProvider);
          if (!repaired) {
            return { success: false, error: { code: 'validation_error', message: 'Generated lesson failed validation', details: v1.errors } } as any;
          }
          lesson = applyDefaults(sanitizeLesson(parseGeneratedLesson(repaired, modelInfo, req.difficulty)), req.difficulty, modelInfo);
          usedRepair = true;
          if (!reasoningSummary) reasoningSummary = extractReasoning(repaired);
          const v2 = validateLesson(lesson);
          if (!v2.valid) {
            return { success: false, error: { code: 'validation_error', message: 'Lesson invalid after repair', details: v2.errors } } as any;
          }
        }
        return { success: true, lesson, meta: { repaired: usedRepair, reasoning_summary: reasoningSummary } } as any;
      } catch (error: any) {
        return { success: false, error: { code: 'generation_error', message: error?.message || 'Failed to generate' } } as any;
      }
    })();
    inflight.set(key, task);
    task.finally(() => setTimeout(() => inflight.delete(key), 5000));
    return await task;
  }
);

function hashKey(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(Math.abs(h));
}
