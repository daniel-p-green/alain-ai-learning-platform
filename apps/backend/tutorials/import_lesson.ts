import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";
import { requireUserId } from "../auth";
import { validateLessonLite } from "./validation";

interface LessonInput {
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
    code_template?: string | null;
    expected_output?: string | null;
    model_params?: any;
  }>;
}

interface ImportResponse { tutorialId: number }

export const importLesson = api<LessonInput, ImportResponse>(
  { expose: true, method: "POST", path: "/tutorials/import" },
  async (lesson, ctx) => {
    await requireUserId(ctx);

    // Validate via pure validator (throws on error)
    validateLessonLite({
      title: lesson.title,
      description: lesson.description,
      model: lesson.model,
      provider: lesson.provider,
      difficulty: lesson.difficulty,
      tags: lesson.tags,
      steps: lesson.steps.map(s => ({ step_order: s.step_order, title: s.title, content: s.content }))
    });

    const tx = await tutorialsDB.begin();
    try {
      let makerId: number | null = null;
      // Optional model_maker persistence
      const anyLesson: any = lesson as any;
      if (anyLesson.model_maker && anyLesson.model_maker.name && anyLesson.model_maker.org_type) {
        const m = anyLesson.model_maker;
        const makerRow = await tx.queryRow<{ id: number }>`
          INSERT INTO model_makers (name, org_type, homepage, license, repo)
          VALUES (${m.name}, ${m.org_type}, ${m.homepage || null}, ${m.license || null}, ${m.repo || null})
          RETURNING id
        `;
        makerId = makerRow!.id;
      }
      const t = await tx.queryRow<{ id: number }>`
        INSERT INTO tutorials (title, description, model, provider, difficulty, tags, model_maker_id)
        VALUES (${lesson.title}, ${lesson.description}, ${lesson.model}, ${lesson.provider}, ${lesson.difficulty}, ${lesson.tags}, ${makerId})
        RETURNING id
      `;

      const tutorialId = t!.id;

      for (const s of lesson.steps) {
        await tx.exec`
          INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
          VALUES (${tutorialId}, ${s.step_order}, ${s.title}, ${s.content}, ${s.code_template ?? null}, ${s.expected_output ?? null}, ${s.model_params ?? null})
        `;
      }

      await tx.commit();
      return { tutorialId };
    } catch (err) {
      await tx.rollback();
      throw APIError.internal("Failed to import lesson");
    }
  }
);

// No export of encore-specific validator (use validateLessonLite for tests)
