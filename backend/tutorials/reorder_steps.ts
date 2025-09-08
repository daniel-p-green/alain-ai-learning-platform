import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface ReorderStepsRequest {
  tutorialId: number;
  stepOrders: { stepId: number; newOrder: number }[];
}

interface ReorderStepsResponse {
  success: boolean;
}

// Reorders tutorial steps by updating their step_order values.
export const reorderSteps = api<ReorderStepsRequest, ReorderStepsResponse>(
  { expose: true, method: "PUT", path: "/tutorials/:tutorialId/steps/reorder" },
  async (req) => {
    // Validate that all steps belong to the tutorial
    const stepIds = req.stepOrders.map(so => so.stepId);
    const validSteps = await tutorialsDB.queryAll<{ id: number }>`
      SELECT id
      FROM tutorial_steps
      WHERE tutorial_id = ${req.tutorialId} AND id = ANY(${stepIds})
    `;

    if (validSteps.length !== stepIds.length) {
      throw APIError.invalidArgument("some steps do not belong to this tutorial");
    }

    // Use a transaction to ensure atomicity
    const tx = await tutorialsDB.begin();
    
    try {
      // Update each step's order
      for (const { stepId, newOrder } of req.stepOrders) {
        await tx.exec`
          UPDATE tutorial_steps
          SET step_order = ${newOrder}
          WHERE id = ${stepId}
        `;
      }

      await tx.commit();
      return { success: true };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
