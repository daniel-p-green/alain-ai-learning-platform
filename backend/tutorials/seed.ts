import { api } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface SeedResponse { inserted: boolean; tutorialId?: number }

// Inserts one sample tutorial with 2 steps if none exist.
export const seed = api<void, SeedResponse>(
  { expose: true, method: "POST", path: "/seed" },
  async () => {
    const existing = await tutorialsDB.queryRow<{ count: number }>`SELECT COUNT(*)::int as count FROM tutorials`;
    if ((existing?.count ?? 0) > 0) {
      return { inserted: false };
    }

    const tutorial = await tutorialsDB.queryRow<{ id: number }>`
      INSERT INTO tutorials (title, description, model, provider, difficulty, tags)
      VALUES (
        'Intro to Prompting',
        'Learn how to craft effective prompts and iterate.',
        'gpt-4o-mini',
        'openai-compatible',
        'beginner',
        ARRAY['prompting','basics']
      ) RETURNING id
    `;

    const tId = tutorial!.id;
    await tutorialsDB.exec`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
      VALUES
        (${tId}, 1, 'Write a short bio', 'Write a 2-sentence bio about Ada Lovelace.', 'Write a 2-sentence bio about Ada Lovelace.', NULL, '{"temperature":0.7}'),
        (${tId}, 2, 'Refine tone', 'Refine the bio to a friendly tone.', 'Rewrite the previous bio in a friendly tone.', NULL, '{"temperature":0.7}')
    `;

    return { inserted: true, tutorialId: tId };
  }
);

