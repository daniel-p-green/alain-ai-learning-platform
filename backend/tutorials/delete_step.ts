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
      const stepsToReorder: Array<{ id: number; step_order: number }> = [];
      const toReorderIter = tx.query<{ id: number; step_order: number }>`
        SELECT id, step_order
        FROM tutorial_steps
        WHERE tutorial_id = ${stepToDelete.tutorial_id} AND step_order > ${stepToDelete.step_order}
        ORDER BY step_order ASC
      `;
      for await (const r of toReorderIter) stepsToReorder.push(r);

      // Cascade delete assessments for this step (responses cascade via FK)
      await tx.exec`
        DELETE FROM assessments
        WHERE tutorial_id = ${stepToDelete.tutorial_id} AND step_order = ${stepToDelete.step_order}
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

      // Update completed_steps arrays for all users on this tutorial:
      //  - remove the deleted step if present
      //  - decrement any steps after the deleted position
      const usersIter = tx.query<{ id: number; completed_steps: number[] | null }>`
        SELECT id, completed_steps
        FROM user_progress
        WHERE tutorial_id = ${stepToDelete.tutorial_id}
      `;
      const users: Array<{ id: number; completed_steps: number[] | null }> = [];
      for await (const u of usersIter) users.push(u);

      for (const u of users) {
        const arr = (u.completed_steps || []) as number[];
        if (!arr || arr.length === 0) continue;
        const filtered = arr
          .filter(s => s !== stepToDelete.step_order)
          .map(s => (s > stepToDelete.step_order ? s - 1 : s));
        await tx.exec`
          UPDATE user_progress
          SET completed_steps = ${filtered},
              last_accessed = NOW()
          WHERE id = ${u.id}
        `;
      }

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
