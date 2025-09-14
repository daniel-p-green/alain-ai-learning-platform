import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";
import { requireUserId } from "../auth";

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const getProgress = api<{ tutorialId: number }, { tutorialId: number; current_step: number; completed_steps: number[] }>(
  { expose: true, method: 'GET', path: '/tutorials/:tutorialId/progress' },
  async ({ tutorialId }, ctx) => {
    const userId = await requireUserId(ctx);
    const row = await tutorialsDB.queryRow<{ current_step: number; completed_steps: number[] }>`
      SELECT current_step, completed_steps FROM user_progress WHERE user_id = ${userId} AND tutorial_id = ${tutorialId}`;
    return { tutorialId, current_step: row?.current_step || 0, completed_steps: row?.completed_steps || [] };
  }
);

export const completeStep = api<{ tutorialId: number; step_order: number }, { tutorialId: number; current_step: number; completed_steps: number[] }>(
  { expose: true, method: 'POST', path: '/tutorials/:tutorialId/progress/complete' },
  async ({ tutorialId, step_order }, ctx) => {
    if (!step_order || step_order < 1) throw APIError.invalidArgument('step_order must be >= 1');
    const userId = await requireUserId(ctx);
    // Ensure tutorial exists
    const exists = await tutorialsDB.queryRow<{ id: number }>`SELECT id FROM tutorials WHERE id = ${tutorialId}`;
    if (!exists) throw APIError.notFound('tutorial not found');
    // Upsert user_progress; add step_order to completed_steps if not present; update current_step
    const row = await tutorialsDB.queryRow<{ current_step: number; completed_steps: number[] }>`
      INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps)
      VALUES (${userId}, ${tutorialId}, ${step_order}, ARRAY[${step_order}]::int[])
      ON CONFLICT (user_id, tutorial_id) DO UPDATE SET
        current_step = GREATEST(user_progress.current_step, ${step_order}),
        completed_steps = (
          SELECT ARRAY(SELECT DISTINCT e FROM unnest(user_progress.completed_steps || ARRAY[${step_order}]::int[]) AS e ORDER BY e)
        ),
        last_accessed = NOW()
      RETURNING current_step, completed_steps`;
    return { tutorialId, current_step: row!.current_step, completed_steps: row!.completed_steps };
  }
);

