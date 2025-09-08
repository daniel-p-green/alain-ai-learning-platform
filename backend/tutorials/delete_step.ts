import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";
import { requireUserId } from "../auth";

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
  async ({ stepId }, ctx) => {
    await requireUserId(ctx);
    if (!stepId || stepId < 1) {
      throw APIError.invalidArgument("step ID must be a positive integer");
    }

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
      throw APIError.notFound("tutorial step not found");
    }

    const stepCount = await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM tutorial_steps
      WHERE tutorial_id = ${stepToDelete.tutorial_id}
    `;

    if (stepCount?.count === 1) {
      throw APIError.failedPrecondition("cannot delete the only step in tutorial");
    }

    const userProgressExists = await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM user_progress
      WHERE tutorial_id = ${stepToDelete.tutorial_id}
        AND (current_step = ${stepToDelete.step_order} OR ${stepToDelete.step_order} = ANY(completed_steps))
    `;

    if (userProgressExists && userProgressExists.count > 0) {
      throw APIError.failedPrecondition("cannot delete step as users have progress on this step");
    }

    const tx = await tutorialsDB.begin();

    try {
      const stepsToReorder = await tx.queryAll<{ id: number; step_order: number }>`
        SELECT id, step_order
        FROM tutorial_steps
        WHERE tutorial_id = ${stepToDelete.tutorial_id} AND step_order > ${stepToDelete.step_order}
        ORDER BY step_order ASC
      `;

      await tx.exec`
        DELETE FROM tutorial_steps
        WHERE id = ${stepId}
      `;

      if (stepsToReorder.length > 0) {
        await tx.exec`
          UPDATE tutorial_steps 
          SET step_order = step_order - 1 
          WHERE tutorial_id = ${stepToDelete.tutorial_id} AND step_order > ${stepToDelete.step_order}
        `;
      }

      await tx.exec`
        UPDATE user_progress
        SET current_step = current_step - 1,
            last_accessed = NOW()
        WHERE tutorial_id = ${stepToDelete.tutorial_id} 
          AND current_step > ${stepToDelete.step_order}
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
      throw error;
    }
  }
);
