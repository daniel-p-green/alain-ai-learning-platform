import { tutorialsDB } from './db';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LessonLike {
  title: string;
  description: string;
  model?: string;
  provider?: string;
  difficulty?: Difficulty;
  tags?: string[];
  learning_objectives?: string[];
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
    explanation?: string;
    difficulty?: Difficulty;
    tags?: string[];
  }>;
  model_maker?: {
    name?: string;
    org_type?: string;
    homepage?: string;
    license?: string;
    repo?: string;
  };
}

export async function ingestTutorialFromLesson(
  lesson: LessonLike,
  difficulty: Difficulty,
  model: string,
  provider: string,
  authorId?: string,
): Promise<number> {
  // Optional model maker entry
  let makerId: number | null = null;
  if (lesson.model_maker?.name && lesson.model_maker.org_type) {
    const mk = await tutorialsDB.queryRow<{ id: number }>`
      INSERT INTO model_makers (name, org_type, homepage, license, repo)
      VALUES (${lesson.model_maker.name}, ${lesson.model_maker.org_type}, ${lesson.model_maker.homepage || null}, ${lesson.model_maker.license || null}, ${lesson.model_maker.repo || null})
      ON CONFLICT (name) DO UPDATE SET org_type = EXCLUDED.org_type, homepage = EXCLUDED.homepage, license = EXCLUDED.license, repo = EXCLUDED.repo
      RETURNING id`;
    makerId = mk?.id ?? null;
  }

  // Create tutorial row
  const tut = await tutorialsDB.queryRow<{ id: number }>`
    INSERT INTO tutorials (title, description, model, provider, difficulty, tags, model_maker_id, updated_at)
    VALUES (${lesson.title}, ${lesson.description}, ${model}, ${provider}, ${difficulty}, ${lesson.tags || []}, ${makerId}, NOW())
    RETURNING id`;
  const tutorialId = tut!.id;

  // Insert steps
  for (const s of (lesson.steps || [])) {
    await tutorialsDB.exec`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
      VALUES (${tutorialId}, ${s.step_order || 1}, ${s.title || ''}, ${s.content || ''}, ${s.code_template || null}, ${s.expected_output || null}, ${s.model_params || null})`;
  }

  // Insert assessments
  for (const a of (lesson.assessments || [])) {
    await tutorialsDB.exec`
      INSERT INTO assessments (tutorial_id, step_order, question, options, correct_index, explanation, difficulty, tags)
      VALUES (${tutorialId}, ${1}, ${a.question || ''}, ${a.options || []}, ${a.correct_index || 0}, ${a.explanation || null}, ${a.difficulty || difficulty}, ${a.tags || []})`;
  }

  // Create initial version snapshot (optional, store minimal)
  await tutorialsDB.exec`
    INSERT INTO tutorial_versions (tutorial_id, version, snapshot)
    VALUES (${tutorialId}, ${1}, ${lesson as any})`;

  return tutorialId;
}

