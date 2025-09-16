import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface ListStepsParams {
  tutorialId: number;
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

interface ListStepsResponse {
  steps: TutorialStep[];
}

// Retrieves all steps for a tutorial ordered by step_order.
export const listSteps = api<ListStepsParams, ListStepsResponse>(
  { expose: true, method: "GET", path: "/tutorials/:tutorialId/steps" },
  async ({ tutorialId }) => {
    // Verify tutorial exists
    const tutorial = await tutorialsDB.queryRow<{ id: number }>`
      SELECT id FROM tutorials WHERE id = ${tutorialId}
    `;

    if (!tutorial) {
      throw APIError.notFound("tutorial not found");
    }

    const steps: TutorialStep[] = [];
    const stepRows = tutorialsDB.query<TutorialStep>`
      SELECT id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
      FROM tutorial_steps
      WHERE tutorial_id = ${tutorialId}
      ORDER BY step_order ASC
    `;

    for await (const step of stepRows) {
      steps.push(step);
    }

    return { steps };
  }
);
