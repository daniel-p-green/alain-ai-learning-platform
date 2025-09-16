import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";
import { requireUserId } from "../auth";

interface AddStepRequest {
  tutorialId: number;
  stepOrder: number;
  title: string;
  content: string;
  codeTemplate?: string;
  expectedOutput?: string;
  modelParams?: any;
}

interface TutorialStep {
  id: number;
  tutorial_id: number;
  step_order: number;
  title: string;
  content: string;
  code_template: string | null;
  expected_output: string | null;
  model_params: any;
  created_at: Date;
}

// Adds a new step to an existing tutorial.
export const addStep = api<AddStepRequest, TutorialStep>(
  { expose: true, method: "POST", path: "/tutorials/:tutorialId/steps" },
  async (req) => {
    await requireUserId();
    // Validate input parameters
    if (!req.title?.trim()) {
      throw APIError.invalidArgument("step title cannot be empty");
    }

    if (!req.content?.trim()) {
      throw APIError.invalidArgument("step content cannot be empty");
    }

    if (req.stepOrder < 1) {
      throw APIError.invalidArgument("step order must be at least 1");
    }

    // Check if tutorial exists
    const tutorial = await tutorialsDB.queryRow<{ id: number; title: string }>`
      SELECT id, title FROM tutorials WHERE id = ${req.tutorialId}
    `;

    if (!tutorial) {
      throw APIError.notFound(`tutorial with ID ${req.tutorialId} not found`);
    }

    // Get the current maximum step order for the tutorial
    const maxStepOrder = await tutorialsDB.queryRow<{ max_order: number | null }>`
      SELECT MAX(step_order) as max_order 
      FROM tutorial_steps 
      WHERE tutorial_id = ${req.tutorialId}
    `;

    const currentMaxOrder = maxStepOrder?.max_order || 0;

    // Validate step order is not too high
    if (req.stepOrder > currentMaxOrder + 1) {
      throw APIError.invalidArgument(
        `step order ${req.stepOrder} is invalid. Maximum allowed step order is ${currentMaxOrder + 1} (current max: ${currentMaxOrder})`
      );
    }

    // Use a transaction to ensure atomicity
    const tx = await tutorialsDB.begin();

    try {
      // Check if there are any steps at or after the requested position
      const existingSteps: Array<{ id: number; step_order: number }> = [];
      const existingIter = tx.query<{ id: number; step_order: number }>`
        SELECT id, step_order
        FROM tutorial_steps 
        WHERE tutorial_id = ${req.tutorialId} AND step_order >= ${req.stepOrder}
        ORDER BY step_order ASC
      `;
      for await (const row of existingIter) existingSteps.push(row);

      // If inserting in the middle, increment existing step orders
      if (existingSteps.length > 0) {
        await tx.exec`
          UPDATE tutorial_steps 
          SET step_order = step_order + 1 
          WHERE tutorial_id = ${req.tutorialId} AND step_order >= ${req.stepOrder}
        `;

        // Preserve user progress: shift any user current_step and completed_steps
        // at or beyond the inserted position
        await tx.exec`
          UPDATE user_progress
          SET current_step = current_step + 1,
              last_accessed = NOW()
          WHERE tutorial_id = ${req.tutorialId} AND current_step >= ${req.stepOrder}
        `;

        const usersWithProgress: Array<{ id: number; completed_steps: number[] | null }> = [];
        const usersIter = tx.query<{ id: number; completed_steps: number[] | null }>`
          SELECT id, completed_steps
          FROM user_progress
          WHERE tutorial_id = ${req.tutorialId}
        `;
        for await (const u of usersIter) usersWithProgress.push(u);

        for (const u of usersWithProgress) {
          const arr = (u.completed_steps || []) as number[];
          if (!arr || arr.length === 0) continue;
          const updated = arr.map(s => (s >= req.stepOrder ? s + 1 : s));
          await tx.exec`
            UPDATE user_progress
            SET completed_steps = ${updated},
                last_accessed = NOW()
            WHERE id = ${u.id}
          `;
        }
      }

      // Validate model_params if provided
      let validatedModelParams = null;
      if (req.modelParams !== undefined) {
        try {
          validatedModelParams = req.modelParams;
          // Ensure it's a valid JSON object
          if (validatedModelParams !== null && typeof validatedModelParams !== 'object') {
            throw new Error("modelParams must be a JSON object");
          }
        } catch (error) {
          throw APIError.invalidArgument(`invalid model parameters: ${error instanceof Error ? error.message : 'must be valid JSON'}`);
        }
      }

      // Insert the new step
      const step = await tx.queryRow<TutorialStep>`
        INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
        VALUES (${req.tutorialId}, ${req.stepOrder}, ${req.title.trim()}, ${req.content.trim()}, ${req.codeTemplate || null}, ${req.expectedOutput || null}, ${validatedModelParams})
        RETURNING id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
      `;

      if (!step) {
        throw APIError.internal("failed to create tutorial step");
      }

      await tx.commit();
      return step;
    } catch (error) {
      await tx.rollback();
      
      // Re-throw API errors as-is
      if (error instanceof APIError) {
        throw error;
      }

      // Handle database constraint violations
      if (error instanceof Error) {
        if (error.message.includes('tutorial_steps_tutorial_id_step_order_key')) {
          throw APIError.alreadyExists(`step order ${req.stepOrder} already exists for this tutorial`);
        }
        if (error.message.includes('foreign key constraint')) {
          throw APIError.notFound(`tutorial with ID ${req.tutorialId} not found`);
        }
      }

      throw APIError.internal(`failed to add step: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
);
