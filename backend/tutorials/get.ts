import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface GetTutorialParams {
  id: number;
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

interface Tutorial {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  steps: TutorialStep[];
}

// Retrieves a tutorial with its steps by ID.
export const get = api<GetTutorialParams, Tutorial>(
  { expose: true, method: "GET", path: "/tutorials/:id" },
  async ({ id }) => {
    const tutorial = await tutorialsDB.queryRow<Omit<Tutorial, 'steps'>>`
      SELECT id, title, description, model, provider, difficulty, tags, created_at, updated_at
      FROM tutorials
      WHERE id = ${id}
    `;

    if (!tutorial) {
      throw APIError.notFound("tutorial not found");
    }

    const steps: TutorialStep[] = [];
    const stepRows = tutorialsDB.query<TutorialStep>`
      SELECT id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at
      FROM tutorial_steps
      WHERE tutorial_id = ${id}
      ORDER BY step_order ASC
    `;

    for await (const step of stepRows) {
      steps.push(step);
    }

    return {
      ...tutorial,
      steps
    };
  }
);
