import { api, APIError } from "encore.dev/api";
import { inferModelInfo } from "./models";
import { requireUserId } from "../auth";
import { allowRate } from "../utils/ratelimit";
import { validateBackendEnv } from "../config/env";
import { parseHfUrl } from "../utils/hf";
import {
  LessonValidationError,
  buildLessonGenerationPrompt,
  buildLessonFromTextPrompt,
  generateLessonContent,
  mapLessonGenerationError,
  persistLessonArtifacts,
  CustomPromptConfig,
} from "./lesson-service";

interface LessonGenerationRequest {
  hfUrl: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B";
  includeAssessment?: boolean;
  // Optional provider toggle to select where the Teacher runs
  provider?: "poe" | "openai-compatible";
  // Optional: ask the teacher to include a brief reasoning summary in the output JSON
  includeReasoning?: boolean;
  customPrompt?: CustomPromptConfig;
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
  async (req: LessonGenerationRequest): Promise<LessonGenerationResponse> => {
    validateBackendEnv();
    const userId = await requireUserId();
    const gate = allowRate(userId, 'lessons_generate', Number(process.env.GENERATE_MAX_RPM || 20), 60_000);
    if (!gate.ok) {
      throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
    }
    // Dedupe concurrent requests: same hfUrl+difficulty coalesce to one in-flight promise (short TTL)
    const key = `${req.hfUrl}::${req.difficulty}`;
    const existing = inflight.get(key);
    if (existing) return await existing;
    // Per-user in-process concurrency guard (only count fresh tasks)
    const maxConc = Number(process.env.GENERATE_MAX_CONCURRENCY || 1);
    const current = userConcurrency.get(userId) || 0;
    if (current >= maxConc) {
      throw APIError.resourceExhausted('Too many concurrent generations. Please wait for an active job to finish.');
    }
    userConcurrency.set(userId, current + 1);
    const task = (async (): Promise<LessonGenerationResponse> => {
      try {
        const modelInfo = await extractHFModelInfo(req.hfUrl);
        const lessonPrompt = buildLessonGenerationPrompt(
          modelInfo,
          req.difficulty,
          req.includeAssessment,
          req.includeReasoning,
          req.customPrompt,
        );
        const selectedProvider = (req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe')) as 'poe' | 'openai-compatible';
        const generation = await generateLessonContent({
          prompt: lessonPrompt,
          teacherModel: req.teacherModel,
          provider: selectedProvider,
          modelInfo,
          difficulty: req.difficulty,
        });

        const { lesson, usedRepair, reasoningSummary, teacherResponse } = generation;
        if (req.customPrompt?.title && (!lesson.title || !String(lesson.title).trim())) {
          lesson.title = req.customPrompt.title;
        }
        if (req.customPrompt?.context && (!lesson.description || !String(lesson.description).trim())) {
          lesson.description = req.customPrompt.context;
        }
        const teacherUsed = (teacherResponse as any)?.usedModel || req.teacherModel || 'GPT-OSS-20B';
        const teacherDowngraded = !!(teacherResponse as any)?.downgraded;
        const modelId = modelInfo.name || 'unknown-model';

        await persistLessonArtifacts({
          lesson,
          modelId,
          difficulty: req.difficulty,
          userId,
          requestProvider: selectedProvider,
          teacherUsed,
          teacherDowngraded,
          enableCatalogIndex: (process.env.CATALOG_INDEX || '').toLowerCase() === '1',
          enableTutorialIngest: (process.env.TUTORIALS_INGEST || '').toLowerCase() === '1',
          tutorialProvider: selectedProvider,
          context: 'generateLesson',
        });

        console.log('[generateLesson] success', { model: modelId, difficulty: req.difficulty, repaired: usedRepair });

        return {
          success: true,
          lesson,
          meta: { repaired: usedRepair, reasoning_summary: reasoningSummary },
        } as any;
      } catch (error) {
        if (error instanceof LessonValidationError) {
          return { success: false, error: { code: 'validation_error', message: error.message, details: error.details } } as any;
        }
        const errorData = mapLessonGenerationError(error);
        return { success: false, error: errorData } as any;
      }
    })();
    inflight.set(key, task);
    // Cleanup after a short delay once it resolves
    task.finally(() => setTimeout(() => inflight.delete(key), 5000));
    try { return await task; } finally {
      const now = userConcurrency.get(userId) || 1; userConcurrency.set(userId, Math.max(0, now - 1));
    }
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
  customPrompt?: CustomPromptConfig;
}, LessonGenerationResponse>(
  { expose: true, method: "POST", path: "/lessons/generate-local" },
  async (req) => {
    validateBackendEnv();
    const userId = await requireUserId();
    const gate = allowRate(userId, 'lessons_generate', Number(process.env.GENERATE_MAX_RPM || 20), 60_000);
    if (!gate.ok) {
      throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
    }
    // Per-user in-process concurrency guard
    const key = `local::${req.modelId}::${req.difficulty}`;
    const existing = inflight.get(key);
    if (existing) return await existing;
    const maxConc = Number(process.env.GENERATE_MAX_CONCURRENCY || 1);
    const current = userConcurrency.get(userId) || 0;
    if (current >= maxConc) {
      throw APIError.resourceExhausted('Too many concurrent generations. Please wait for an active job to finish.');
    }
    userConcurrency.set(userId, current + 1);
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
        const lessonPrompt = buildLessonGenerationPrompt(
          modelInfo,
          req.difficulty,
          req.includeAssessment,
          req.includeReasoning,
          req.customPrompt,
        );
        const selectedProvider = (req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe')) as 'poe' | 'openai-compatible';
        const generation = await generateLessonContent({
          prompt: lessonPrompt,
          teacherModel: req.teacherModel,
          provider: selectedProvider,
          modelInfo,
          difficulty: req.difficulty,
        });

        const { lesson, usedRepair, reasoningSummary, teacherResponse } = generation;
        if (req.customPrompt?.title && (!lesson.title || !String(lesson.title).trim())) {
          lesson.title = req.customPrompt.title;
        }
        if (req.customPrompt?.context && (!lesson.description || !String(lesson.description).trim())) {
          lesson.description = req.customPrompt.context;
        }
        const teacherUsed = (teacherResponse as any)?.usedModel || req.teacherModel || 'GPT-OSS-20B';
        const teacherDowngraded = !!(teacherResponse as any)?.downgraded;

        await persistLessonArtifacts({
          lesson,
          modelId: req.modelId || 'local-model',
          difficulty: req.difficulty,
          userId,
          requestProvider: selectedProvider,
          teacherUsed,
          teacherDowngraded,
          enableCatalogIndex: false,
          enableTutorialIngest: false,
          context: 'generateLocalLesson',
        });

        return {
          success: true,
          lesson,
          meta: { repaired: usedRepair, reasoning_summary: reasoningSummary },
        } as any;
      } catch (error: any) {
        if (error instanceof LessonValidationError) {
          return { success: false, error: { code: 'validation_error', message: error.message, details: error.details } } as any;
        }
        return { success: false, error: { code: 'generation_error', message: error?.message || 'Failed to generate' } } as any;
      }
    })();
    inflight.set(key, task);
    task.finally(() => setTimeout(() => inflight.delete(key), 5000));
    try { return await task; } finally {
      const now = userConcurrency.get(userId) || 1; userConcurrency.set(userId, Math.max(0, now - 1));
    }
  }
);

// In-memory map of in-flight generation promises
const inflight = new Map<string, Promise<LessonGenerationResponse>>();
// Simple per-user in-process concurrency tracker for generation
const userConcurrency: Map<string, number> = new Map();

// Extract model information from Hugging Face URL
export async function extractHFModelInfo(hfUrl: string) {
  // Strict HF parsing and host allowlisting
  let ref: import('../utils/hf').HfModelRef;
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

export const generateFromText = api<{
  textContent: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teacherModel: "GPT-OSS-20B" | "GPT-OSS-120B";
  includeAssessment?: boolean;
  provider?: "poe" | "openai-compatible";
  includeReasoning?: boolean;
  customPrompt?: CustomPromptConfig;
}, LessonGenerationResponse>(
  { expose: true, method: "POST", path: "/lessons/generate-from-text" },
  async (req) => {
    validateBackendEnv();
    const userId = await requireUserId();
    const gate = allowRate(userId, 'lessons_generate', Number(process.env.GENERATE_MAX_RPM || 20), 60_000);
    if (!gate.ok) {
      throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
    }
    // Per-user in-process concurrency guard
    const maxConc = Number(process.env.GENERATE_MAX_CONCURRENCY || 1);
    const current = userConcurrency.get(userId) || 0;
    if (current >= maxConc) {
      throw APIError.resourceExhausted('Too many concurrent generations. Please wait for an active job to finish.');
    }
    userConcurrency.set(userId, current + 1);
    const text = (req.textContent || '').trim();
    if (!text) return { success: false, error: { code: 'invalid_argument', message: 'textContent required' } } as any;

    const key = `text::${hashKey(text)}::${req.difficulty}`;
    const existing = inflight.get(key);
    if (existing) return await existing;

    const task = (async (): Promise<LessonGenerationResponse> => {
      try {
        const lessonPrompt = buildLessonFromTextPrompt(
          text,
          req.difficulty,
          req.includeAssessment,
          req.includeReasoning,
          req.customPrompt,
        );
        const selectedProvider = (req.provider ?? (process.env.TEACHER_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'poe')) as 'poe' | 'openai-compatible';
        const modelInfo = { name: 'Custom Content', org: 'user', url: 'about:blank' } as any;
        const generation = await generateLessonContent({
          prompt: lessonPrompt,
          teacherModel: req.teacherModel,
          provider: selectedProvider,
          modelInfo,
          difficulty: req.difficulty,
        });

        const { lesson, usedRepair, reasoningSummary, teacherResponse } = generation;
        if (req.customPrompt?.title && (!lesson.title || !String(lesson.title).trim())) {
          lesson.title = req.customPrompt.title;
        }
        if (req.customPrompt?.context && (!lesson.description || !String(lesson.description).trim())) {
          lesson.description = req.customPrompt.context;
        }
        const teacherUsed = (teacherResponse as any)?.usedModel || req.teacherModel || 'GPT-OSS-20B';
        const teacherDowngraded = !!(teacherResponse as any)?.downgraded;

        await persistLessonArtifacts({
          lesson,
          modelId: 'custom-content',
          difficulty: req.difficulty,
          userId,
          requestProvider: selectedProvider,
          teacherUsed,
          teacherDowngraded,
          enableCatalogIndex: false,
          enableTutorialIngest: false,
          context: 'generateFromText',
        });

        return {
          success: true,
          lesson,
          meta: { repaired: usedRepair, reasoning_summary: reasoningSummary },
        } as any;
      } catch (error: any) {
        if (error instanceof LessonValidationError) {
          return { success: false, error: { code: 'validation_error', message: error.message, details: error.details } } as any;
        }
        return { success: false, error: { code: 'generation_error', message: error?.message || 'Failed to generate' } } as any;
      }
    })();
    inflight.set(key, task);
    task.finally(() => setTimeout(() => inflight.delete(key), 5000));
    try { return await task; } finally {
      const now = userConcurrency.get(userId) || 1; userConcurrency.set(userId, Math.max(0, now - 1));
    }
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
