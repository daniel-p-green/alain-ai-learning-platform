import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface UpdateStepRequest {
  stepId: number;
  title?: string;
  content?: string;
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

// Updates an existing tutorial step.
export const updateStep = api<UpdateStepRequest, TutorialStep>(
  { expose: true, method: "PUT", path: "/tutorials/steps/:stepId" },
  async (req) => {
    if (!req.stepId || req.stepId < 1) {
      throw APIError.invalidArgument("step ID must be a positive integer");
    }

    // Validate input fields
    if (req.title !== undefined && !req.title.trim()) {
      throw APIError.invalidArgument("step title cannot be empty");
    }

    if (req.content !== undefined && !req.content.trim()) {
      throw APIError.invalidArgument("step content cannot be empty");
    }

    // Validate model_params if provided
    let validatedModelParams = req.modelParams;
    if (req.modelParams !== undefined) {
      try {
        // Ensure it's a valid JSON object or null
        if (validatedModelParams !== null && typeof validatedModelParams !== 'object') {
          throw new Error("modelParams must be a JSON object or null");
        }
      } catch (error) {
        throw APIError.invalidArgument(`invalid model parameters: ${error instanceof Error ? error.message : 'must be valid JSON'}`);
      }
    }

    // Check if step exists and get current data
    const existingStep = await tutorialsDB.queryRow<TutorialStep & { tutorial_title: string }>`
      SELECT ts.id, ts.tutorial_id, ts.step_order, ts.title, ts.content, 
             ts.code_template, ts.expected_output, ts.model_params, ts.created_at,
             t.title as tutorial_title
      FROM tutorial_steps ts
      JOIN tutorials t ON t.id = ts.tutorial_id
      WHERE ts.id = ${req.stepId}
    `;

    if (!existingStep) {
      throw APIError.notFound(`tutorial step with ID ${req.stepId} not found`);
    }

    // Check if there are any fields to update
    const hasUpdates = req.title !== undefined || 
                       req.content !== undefined || 
                       req.codeTemplate !== undefined || 
                       req.expectedOutput !== undefined || 
                       req.modelParams !== undefined;

    if (!hasUpdates) {
      throw APIError.invalidArgument("at least one field must be provided for update");
    }

    // Check for user progress implications if content is being significantly changed
    if (req.content !== undefined && req.content.trim() !== existingStep.content.trim()) {
      const userProgressExists = await tutorialsDB.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM user_progress
        WHERE tutorial_id = ${existingStep.tutorial_id}
          AND (current_step = ${existingStep.step_order} OR ${existingStep.step_order} = ANY(completed_steps))
      `;

      if (userProgressExists && userProgressExists.count > 0) {
        // This is just a warning in the response, not blocking the update
        // In a real application, you might want to version steps or notify users
      }
    }

    try {
      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];

      if (req.title !== undefined) {
        updates.push(`title = $${values.length + 1}`);
        values.push(req.title.trim());
      }
      if (req.content !== undefined) {
        updates.push(`content = $${values.length + 1}`);
        values.push(req.content.trim());
      }
      if (req.codeTemplate !== undefined) {
        updates.push(`code_template = $${values.length + 1}`);
        values.push(req.codeTemplate || null);
      }
      if (req.expectedOutput !== undefined) {
        updates.push(`expected_output = $${values.length + 1}`);
        values.push(req.expectedOutput || null);
      }
      if (req.modelParams !== undefined) {
        updates.push(`model_params = $${values.length + 1}`);
        values.push(validatedModelParams);
      }

      const query = `
        UPDATE tutorial_steps 
        SET ${updates.join(', ')}
        WHERE id = $${values.length + 1}
        RETURNING id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
      `;
      values.push(req.stepId);

      const updatedStep = await tutorialsDB.rawQueryRow<TutorialStep>(query, ...values);
      
      if (!updatedStep) {
        throw APIError.internal("failed to update tutorial step");
      }

      return updatedStep;
    } catch (error) {
      // Re-throw API errors as-is
      if (error instanceof APIError) {
        throw error;
      }

      // Handle database constraint violations
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          throw APIError.notFound(`tutorial step with ID ${req.stepId} not found`);
        }
        if (error.message.includes('check constraint')) {
          throw APIError.invalidArgument("one or more field values violate database constraints");
        }
      }

      throw APIError.internal(`failed to update step: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
);
