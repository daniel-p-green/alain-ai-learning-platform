import { api } from "encore.dev/api";
import { tutorialsDB } from "./db";

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
    // First, increment the step_order of all existing steps at or after the requested position
    await tutorialsDB.exec`
      UPDATE tutorial_steps 
      SET step_order = step_order + 1 
      WHERE tutorial_id = ${req.tutorialId} AND step_order >= ${req.stepOrder}
    `;

    // Insert the new step
    const step = await tutorialsDB.queryRow<TutorialStep>`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
      VALUES (${req.tutorialId}, ${req.stepOrder}, ${req.title}, ${req.content}, ${req.codeTemplate}, ${req.expectedOutput}, ${req.modelParams})
      RETURNING id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
    `;

    return step!;
  }
);
