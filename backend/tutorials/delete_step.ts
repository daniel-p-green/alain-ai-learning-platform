import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface DeleteStepParams {
  stepId: number;
}

interface DeleteStepResponse {
  success: boolean;
}

// Deletes a tutorial step and reorders remaining steps.
export const deleteStep = api<DeleteStepParams, DeleteStepResponse>(
  { expose: true, method: "DELETE", path: "/tutorials/steps/:stepId" },
  async ({ stepId }) => {
    // Get the step to be deleted to find its order and tutorial
    const stepToDelete = await tutorialsDB.queryRow<{
      tutorial_id: number;
      step_order: number;
    }>`
      SELECT tutorial_id, step_order
      FROM tutorial_steps
      WHERE id = ${stepId}
    `;

    if (!stepToDelete) {
      throw APIError.notFound("tutorial step not found");
    }

    // Delete the step
    await tutorialsDB.exec`
      DELETE FROM tutorial_steps
      WHERE id = ${stepId}
    `;

    // Reorder remaining steps by decrementing step_order for steps after the deleted one
    await tutorialsDB.exec`
      UPDATE tutorial_steps 
      SET step_order = step_order - 1 
      WHERE tutorial_id = ${stepToDelete.tutorial_id} AND step_order > ${stepToDelete.step_order}
    `;

    return { success: true };
  }
);
