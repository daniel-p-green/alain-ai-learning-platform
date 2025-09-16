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
  model_maker?: {
    name: string;
    org_type: string;
    homepage?: string | null;
    license?: string | null;
    repo?: string | null;
  } | null;
}

// Retrieves a tutorial with its steps by ID.
export const get = api<GetTutorialParams, Tutorial>(
  { expose: true, method: "GET", path: "/tutorials/:id" },
  async ({ id }) => {
    const tutorial = await tutorialsDB.queryRow<any>`
      SELECT t.id, t.title, t.description, t.model, t.provider, t.difficulty, t.tags, t.created_at, t.updated_at,
             mm.name as maker_name, mm.org_type as maker_org_type, mm.homepage as maker_homepage, mm.license as maker_license, mm.repo as maker_repo
      FROM tutorials t
      LEFT JOIN model_makers mm ON mm.id = t.model_maker_id
      WHERE t.id = ${id}
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
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      model: tutorial.model,
      provider: tutorial.provider,
      difficulty: tutorial.difficulty,
      tags: tutorial.tags,
      created_at: tutorial.created_at,
      updated_at: tutorial.updated_at,
      steps,
      model_maker: tutorial.maker_name ? {
        name: tutorial.maker_name,
        org_type: tutorial.maker_org_type,
        homepage: tutorial.maker_homepage,
        license: tutorial.maker_license,
        repo: tutorial.maker_repo,
      } : null
    } as Tutorial;
  }
);
