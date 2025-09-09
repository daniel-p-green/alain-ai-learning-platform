export type LessonStep = {
  step_order?: number;
  title: string;
  content: string;
  code_template?: string | null;
  expected_output?: string | null;
  model_params?: any;
};

export type Lesson = {
  title: string;
  description: string;
  model?: string;
  provider?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  learning_objectives?: string[];
  steps: LessonStep[];
  assessments?: Array<{
    question: string;
    options: string[];
    correct_index: number;
    explanation?: string;
    difficulty?: string;
    tags?: string[];
  }>;
  model_maker?: {
    name: string;
    org_type: string;
    homepage?: string;
    license?: string;
    repo?: string;
  };
};

export function validateLesson(lesson: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!lesson || typeof lesson !== "object") errors.push("lesson must be an object");
  if (!lesson?.title || typeof lesson.title !== "string") errors.push("title is required");
  if (!lesson?.description || typeof lesson.description !== "string") errors.push("description is required");
  if (!Array.isArray(lesson?.steps) || lesson.steps.length === 0) errors.push("steps array is required");
  if (lesson?.difficulty && !["beginner", "intermediate", "advanced"].includes(lesson.difficulty)) errors.push("difficulty invalid");
  if (Array.isArray(lesson?.steps)) {
    lesson.steps.forEach((s: any, i: number) => {
      if (!s || typeof s !== "object") errors.push(`steps[${i}] must be object`);
      if (!s?.title || typeof s.title !== "string") errors.push(`steps[${i}].title required`);
      if (!s?.content || typeof s.content !== "string") errors.push(`steps[${i}].content required`);
      if (s?.step_order != null && typeof s.step_order !== "number") errors.push(`steps[${i}].step_order must be number`);
      if (s?.code_template != null && typeof s.code_template !== "string") errors.push(`steps[${i}].code_template must be string`);
    });
  }
  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  lessonData: any,
  difficulty: "beginner" | "intermediate" | "advanced",
  modelInfo: any
): Lesson {
  const out: Lesson = { ...lessonData };
  out.model = modelInfo?.name || out.model || "gpt-oss-20b";
  out.provider = (out.provider as any) || "poe";
  out.difficulty = (out.difficulty as any) || difficulty || "beginner";
  out.tags = Array.isArray(out.tags) ? out.tags : [];
  if (modelInfo?.org) out.tags = Array.from(new Set([`${modelInfo.org}`, out.difficulty, ...out.tags]));
  out.steps = (out.steps || []).map((step: any, index: number) => {
    const s: LessonStep = { ...step };
    s.step_order = typeof s.step_order === "number" ? s.step_order : index + 1;
    s.model_params = s.model_params || { temperature: 0.7 };
    if (!s.code_template || typeof s.code_template !== "string" || !s.code_template.trim()) {
      s.code_template = synthesizePromptFallback(s.title, s.content);
    }
    return s;
  });
  return out;
}

export function synthesizePromptFallback(title: string, content: string) {
  const snippet = (content || "").replace(/\s+/g, " ").slice(0, 180);
  return `You are a helpful assistant. For the lesson step "${title}", provide a concise response based on this context: ${snippet}`;
}

