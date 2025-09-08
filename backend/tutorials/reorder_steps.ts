import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface ReorderStepsRequest {
  tutorialId: number;
  stepOrders: { stepId: number; newOrder: number }[];
}

interface ReorderStepsResponse {
  success: boolean;
  reorderedSteps: Array<{
    stepId: number;
    oldOrder: number;
    newOrder: number;
    title: string;
  }>;
  affectedUsers: number;
}

// Reorders tutorial steps by updating their step_order values.
export const reorderSteps = api<ReorderStepsRequest, ReorderStepsResponse>(
  { expose: true, method: "PUT", path: "/tutorials/:tutorialId/steps/reorder" },
  async (req) => {
    if (!req.tutorialId || req.tutorialId < 1) {
      throw APIError.invalidArgument("tutorial ID must be a positive integer");
    }

    if (!req.stepOrders || req.stepOrders.length === 0) {
      throw APIError.invalidArgument("stepOrders array cannot be empty");
    }

    // Validate tutorial exists
    const tutorial = await tutorialsDB.queryRow<{ id: number; title: string }>`
      SELECT id, title FROM tutorials WHERE id = ${req.tutorialId}
    `;

    if (!tutorial) {
      throw APIError.notFound(`tutorial with ID ${req.tutorialId} not found`);
    }

    // Validate step orders
    const stepIds = req.stepOrders.map(so => so.stepId);
    const newOrders = req.stepOrders.map(so => so.newOrder);

    // Check for duplicate step IDs
    const uniqueStepIds = new Set(stepIds);
    if (uniqueStepIds.size !== stepIds.length) {
      throw APIError.invalidArgument("duplicate step IDs found in stepOrders array");
    }

    // Check for invalid step orders
    if (newOrders.some(order => order < 1)) {
      throw APIError.invalidArgument("all step orders must be positive integers");
    }

    // Check for duplicate new orders
    const uniqueNewOrders = new Set(newOrders);
    if (uniqueNewOrders.size !== newOrders.length) {
      throw APIError.invalidArgument("duplicate new step orders found");
    }

    // Get all existing steps for the tutorial
    const existingSteps = await tutorialsDB.queryAll<{ 
      id: number; 
      step_order: number; 
      title: string;
    }>`
      SELECT id, step_order, title
      FROM tutorial_steps
      WHERE tutorial_id = ${req.tutorialId}
      ORDER BY step_order ASC
    `;

    if (existingSteps.length === 0) {
      throw APIError.notFound(`no steps found for tutorial "${tutorial.title}"`);
    }

    // Validate that all provided step IDs belong to this tutorial
    const validStepIds = new Set(existingSteps.map(step => step.id));
    const invalidStepIds = stepIds.filter(id => !validStepIds.has(id));
    if (invalidStepIds.length > 0) {
      throw APIError.invalidArgument(`steps with IDs [${invalidStepIds.join(', ')}] do not belong to tutorial "${tutorial.title}"`);
    }

    // If reordering all steps, validate that we have a complete sequence
    if (req.stepOrders.length === existingSteps.length) {
      const expectedOrders = Array.from({ length: existingSteps.length }, (_, i) => i + 1);
      const sortedNewOrders = [...newOrders].sort((a, b) => a - b);
      
      if (!expectedOrders.every((order, index) => order === sortedNewOrders[index])) {
        throw APIError.invalidArgument(
          `when reordering all steps, new orders must form a complete sequence from 1 to ${existingSteps.length}`
        );
      }
    } else {
      // Partial reordering - validate that new orders don't conflict with unchanged steps
      const unchangedSteps = existingSteps.filter(step => !stepIds.includes(step.id));
      const unchangedOrders = new Set(unchangedSteps.map(step => step.step_order));
      
      const conflictingOrders = newOrders.filter(order => unchangedOrders.has(order));
      if (conflictingOrders.length > 0) {
        throw APIError.invalidArgument(
          `new step orders [${conflictingOrders.join(', ')}] conflict with existing step orders. Use complete reordering or choose non-conflicting orders.`
        );
      }

      // Validate new orders are within valid range
      const maxOrder = Math.max(...existingSteps.map(s => s.step_order));
      const invalidOrders = newOrders.filter(order => order > maxOrder);
      if (invalidOrders.length > 0) {
        throw APIError.invalidArgument(
          `new step orders [${invalidOrders.join(', ')}] exceed maximum step order ${maxOrder}`
        );
      }
    }

    // Check for users with progress on this tutorial
    const affectedUsersCount = await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM user_progress
      WHERE tutorial_id = ${req.tutorialId}
    `;

    const reorderedSteps: Array<{
      stepId: number;
      oldOrder: number;
      newOrder: number;
      title: string;
    }> = [];

    // Use a transaction to ensure atomicity
    const tx = await tutorialsDB.begin();
    
    try {
      // Collect information about changes
      for (const { stepId, newOrder } of req.stepOrders) {
        const step = existingSteps.find(s => s.id === stepId);
        if (step && step.step_order !== newOrder) {
          reorderedSteps.push({
            stepId,
            oldOrder: step.step_order,
            newOrder,
            title: step.title,
          });
        }
      }

      // If there are actual changes to make
      if (reorderedSteps.length > 0) {
        // Update each step's order
        for (const { stepId, newOrder } of req.stepOrders) {
          await tx.exec`
            UPDATE tutorial_steps
            SET step_order = ${newOrder}
            WHERE id = ${stepId}
          `;
        }

        // Update user progress to reflect the new step ordering
        if (affectedUsersCount && affectedUsersCount.count > 0) {
          // Create a mapping of old orders to new orders
          const orderMapping: Record<number, number> = {};
          for (const { stepId, newOrder } of req.stepOrders) {
            const step = existingSteps.find(s => s.id === stepId);
            if (step) {
              orderMapping[step.step_order] = newOrder;
            }
          }

          // Update current_step for affected users
          for (const [oldOrder, newOrder] of Object.entries(orderMapping)) {
            await tx.exec`
              UPDATE user_progress
              SET current_step = ${newOrder},
                  last_accessed = NOW()
              WHERE tutorial_id = ${req.tutorialId} 
                AND current_step = ${parseInt(oldOrder)}
            `;
          }

          // Update completed_steps arrays
          // This is more complex as we need to update arrays
          const usersWithProgress = await tx.queryAll<{ 
            id: number; 
            completed_steps: number[]; 
          }>`
            SELECT id, completed_steps
            FROM user_progress
            WHERE tutorial_id = ${req.tutorialId}
              AND array_length(completed_steps, 1) > 0
          `;

          for (const user of usersWithProgress) {
            const updatedCompletedSteps = user.completed_steps.map(step => 
              orderMapping[step] !== undefined ? orderMapping[step] : step
            );

            await tx.exec`
              UPDATE user_progress
              SET completed_steps = ${updatedCompletedSteps},
                  last_accessed = NOW()
              WHERE id = ${user.id}
            `;
          }
        }
      }

      await tx.commit();
      
      return { 
        success: true, 
        reorderedSteps,
        affectedUsers: affectedUsersCount?.count || 0,
      };
    } catch (error) {
      await tx.rollback();

      // Re-throw API errors as-is
      if (error instanceof APIError) {
        throw error;
      }

      // Handle database constraint violations
      if (error instanceof Error) {
        if (error.message.includes('tutorial_steps_tutorial_id_step_order_key')) {
          throw APIError.alreadyExists("step order conflict detected during reordering");
        }
        if (error.message.includes('foreign key constraint')) {
          throw APIError.notFound(`tutorial with ID ${req.tutorialId} not found`);
        }
      }

      throw APIError.internal(`failed to reorder steps: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
);
