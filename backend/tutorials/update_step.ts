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
    // Check if step exists
    const existingStep = await tutorialsDB.queryRow<TutorialStep>`
      SELECT id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
      FROM tutorial_steps
      WHERE id = ${req.stepId}
    `;

    if (!existingStep) {
      throw APIError.notFound("tutorial step not found");
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (req.title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(req.title);
    }
    if (req.content !== undefined) {
      updates.push(`content = $${values.length + 1}`);
      values.push(req.content);
    }
    if (req.codeTemplate !== undefined) {
      updates.push(`code_template = $${values.length + 1}`);
      values.push(req.codeTemplate);
    }
    if (req.expectedOutput !== undefined) {
      updates.push(`expected_output = $${values.length + 1}`);
      values.push(req.expectedOutput);
    }
    if (req.modelParams !== undefined) {
      updates.push(`model_params = $${values.length + 1}`);
      values.push(req.modelParams);
    }

    if (updates.length === 0) {
      // No updates provided, return existing step
      return existingStep;
    }

    const query = `
      UPDATE tutorial_steps 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
    `;
    values.push(req.stepId);

    const updatedStep = await tutorialsDB.rawQueryRow<TutorialStep>(query, ...values);
    return updatedStep!;
  }
);
