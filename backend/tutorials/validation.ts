export interface LessonInputLite {
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  steps: Array<{
    step_order: number;
    title: string;
    content: string;
  }>;
}

export function validateLessonLite(l: LessonInputLite) {
  if (!l.title?.trim() || !l.description?.trim()) {
    throw new Error("Lesson title and description are required");
  }
  if (!l.model?.trim() || !l.provider?.trim()) {
    throw new Error("Lesson model and provider are required");
  }
  if (!["beginner", "intermediate", "advanced"].includes(l.difficulty)) {
    throw new Error("Invalid difficulty");
  }
  if (!Array.isArray(l.tags)) {
    throw new Error("Tags must be an array");
  }
  if (!Array.isArray(l.steps) || l.steps.length === 0) {
    throw new Error("Lesson must include at least one step");
  }
  for (const s of l.steps) {
    if (!s.title?.trim() || !s.content?.trim()) {
      throw new Error("Each step requires title and content");
    }
    if (typeof s.step_order !== "number" || s.step_order < 1) {
      throw new Error("Step order must be a positive integer");
    }
  }
}

