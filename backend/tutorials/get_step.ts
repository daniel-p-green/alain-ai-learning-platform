import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface GetStepParams {
  stepId: number;
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

// Retrieves a specific tutorial step by ID.
export const getStep = api<GetStepParams, TutorialStep>(
  { expose: true, method: "GET", path: "/tutorials/steps/:stepId" },
  async ({ stepId }) => {
    const step = await tutorialsDB.queryRow<TutorialStep>`
      SELECT id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
      FROM tutorial_steps
      WHERE id = ${stepId}
    `;

    if (!step) {
      throw APIError.notFound("tutorial step not found");
    }

    return step;
  }
);
