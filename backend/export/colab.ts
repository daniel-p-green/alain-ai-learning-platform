import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "../tutorials/db";
import type { Notebook } from "./notebook";
import { buildNotebook } from "./notebook";

export const exportColab = api<{ tutorialId: number }, Notebook>(
  { expose: true, method: "GET", path: "/export/colab/:tutorialId" },
  async ({ tutorialId }) => {
    if (!tutorialId || tutorialId < 1) throw APIError.invalidArgument("tutorialId required");
    const tut = await tutorialsDB.queryRow<{ id: number; title: string; description: string }>`
      SELECT id, title, description FROM tutorials WHERE id = ${tutorialId}
    `;
    if (!tut) throw APIError.notFound("tutorial not found");
    const steps: Array<{ step_order: number; title: string; content: string; code_template: string | null }>= [];
    const rows = tutorialsDB.query<{ step_order: number; title: string; content: string; code_template: string | null }>`
      SELECT step_order, title, content, code_template
      FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order ASC
    `;
    for await (const r of rows) steps.push(r);
    return buildNotebook(tut.title, tut.description, steps);
  }
);

// buildNotebook moved to ./notebook for pure unit testing
