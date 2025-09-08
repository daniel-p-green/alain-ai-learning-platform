import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface DeleteStepParams {
  stepId: number;
}

interface DeleteStepResponse {
  success: boolean;
  deletedStep: {
    id: number;
    title: string;
    stepOrder: number;
    tutorialId: number;
  };
  reorderedSteps: number;
}

// Deletes a tutorial step and reorders remaining steps.
export const deleteStep = api<DeleteStepParams, DeleteStepResponse>(
  { expose: true, method: "DELETE", path: "/tutorials/steps/:stepId" },
  async ({ stepId }) => {
    if (!stepId || stepId < 1) {
      throw APIError.invalidArgument("step ID must be a positive integer");
    }

    // Get the step to be deleted with tutorial information
    const stepToDelete = await tutorialsDB.queryRow<{
      id: number;
      tutorial_id: number;
      step_order: number;
      title: string;
      tutorial_title: string;
    }>`
      SELECT ts.id, ts.tutorial_id, ts.step_order, ts.title, t.title as tutorial_title
      FROM tutorial_steps ts
      JOIN tutorials t ON t.id = ts.tutorial_id
      WHERE ts.id = ${stepId}
    `;

    if (!stepToDelete) {
      throw APIError.notFound(`tutorial step with ID ${stepId} not found`);
    }

    // Check if this is the only step in the tutorial
    const stepCount = await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM tutorial_steps
      WHERE tutorial_id = ${stepToDelete.tutorial_id}
    `;

    if (stepCount?.count === 1) {
      throw APIError.failedPrecondition(
        `cannot delete the only step in tutorial "${stepToDelete.tutorial_title}". A tutorial must have at least one step.`
      );
    }

    // Check for user progress dependencies
    const userProgressExists = await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM user_progress
      WHERE tutorial_id = ${stepToDelete.tutorial_id}
        AND (current_step = ${stepToDelete.step_order} OR ${stepToDelete.step_order} = ANY(completed_steps))
    `;

    if (userProgressExists && userProgressExists.count > 0) {
      throw APIError.failedPrecondition(
        `cannot delete step "${stepToDelete.title}" as ${userProgressExists.count} user(s) have progress on this step. Consider updating user progress first or marking the step as archived instead of deleting it.`
      );
    }

    // Use a transaction to ensure atomicity
    const tx = await tutorialsDB.begin();

    try {
      // Get steps that will be reordered (those after the deleted step)
      const stepsToReorder = await tx.queryAll<{ id: number; step_order: number }>`
        SELECT id, step_order
        FROM tutorial_steps
        WHERE tutorial_id = ${stepToDelete.tutorial_id} AND step_order > ${stepToDelete.step_order}
        ORDER BY step_order ASC
      `;

      // Delete the step
      const deleteResult = await tx.exec`
        DELETE FROM tutorial_steps
        WHERE id = ${stepId}
      `;

      // Reorder remaining steps by decrementing step_order for steps after the deleted one
      if (stepsToReorder.length > 0) {
        await tx.exec`
          UPDATE tutorial_steps 
          SET step_order = step_order - 1 
          WHERE tutorial_id = ${stepToDelete.tutorial_id} AND step_order > ${stepToDelete.step_order}
        `;
      }

      // Update user progress for affected users
      // Move users who were on a later step back by one position
      await tx.exec`
        UPDATE user_progress
        SET current_step = current_step - 1,
            last_accessed = NOW()
        WHERE tutorial_id = ${stepToDelete.tutorial_id} 
          AND current_step > ${stepToDelete.step_order}
      `;

      // Remove the deleted step from completed_steps arrays and adjust step numbers
      await tx.exec`
        UPDATE user_progress
        SET completed_steps = (
          SELECT ARRAY(
            SELECT CASE 
              WHEN step_num < ${stepToDelete.step_order} THEN step_num
              WHEN step_num > ${stepToDelete.step_order} THEN step_num - 1
              ELSE NULL
            END
            FROM unnest(completed_steps) AS step_num
            WHERE step_num != ${stepToDelete.step_order}
              AND CASE 
                WHEN step_num < ${stepToDelete.step_order} THEN step_num
                WHEN step_num > ${stepToDelete.step_order} THEN step_num - 1
                ELSE NULL
              END IS NOT NULL
          )
        ),
        last_accessed = NOW()
        WHERE tutorial_id = ${stepToDelete.tutorial_id}
          AND ${stepToDelete.step_order} = ANY(completed_steps)
      `;

      await tx.commit();

      return {
        success: true,
        deletedStep: {
          id: stepToDelete.id,
          title: stepToDelete.title,
          stepOrder: stepToDelete.step_order,
          tutorialId: stepToDelete.tutorial_id,
        },
        reorderedSteps: stepsToReorder.length,
      };
    } catch (error) {
      await tx.rollback();

      // Re-throw API errors as-is
      if (error instanceof APIError) {
        throw error;
      }

      // Handle foreign key constraint violations
      if (error instanceof Error && error.message.includes('foreign key constraint')) {
        throw APIError.failedPrecondition(
          `cannot delete step "${stepToDelete.title}" due to existing dependencies. This may be caused by user progress or other related data.`
        );
      }

      throw APIError.internal(`failed to delete step: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
);
