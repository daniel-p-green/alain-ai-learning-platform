import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "../tutorials/db";
import type { Notebook } from "./notebook";
import { buildNotebook } from "./notebook";

export const exportColab = api<{ tutorialId: number }, Notebook>(
  { expose: true, method: "GET", path: "/export/colab/:tutorialId" },
  async ({ tutorialId }) => {
    if (!tutorialId || tutorialId < 1) throw APIError.invalidArgument("tutorialId required");
    const tut = await tutorialsDB.queryRow<{ id: number; title: string; description: string; provider: string; model: string }>`
      SELECT id, title, description, provider, model FROM tutorials WHERE id = ${tutorialId}
    `;
    if (!tut) throw APIError.notFound("tutorial not found");
    const steps: Array<{ step_order: number; title: string; content: string; code_template: string | null; model_params?: any }>= [];
    const rows = tutorialsDB.query<{ step_order: number; title: string; content: string; code_template: string | null }>`
      SELECT step_order, title, content, code_template
      FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order ASC
    `;
    for await (const r of rows) steps.push(r);

    // Load assessments per step
    const assessments: Array<{ step_order: number; question: string; options: string[]; correct_index: number; explanation: string | null }>= [];
    const arows = tutorialsDB.query<{
      step_order: number; question: string; options: string[]; correct_index: number; explanation: string | null
    }>`
      SELECT step_order, question, options, correct_index, explanation
      FROM assessments WHERE tutorial_id = ${tutorialId}
      ORDER BY step_order ASC, id ASC
    ` as any;
    for await (const a of arows) assessments.push(a);

    return buildNotebook(
      {
        title: tut.title,
        description: tut.description,
        provider: tut.provider,
        model: tut.model,
      },
      steps,
      assessments
    );
  }
);

// buildNotebook moved to ./notebook for pure unit testing
