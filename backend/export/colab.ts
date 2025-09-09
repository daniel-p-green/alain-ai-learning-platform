import { api, APIError } from "encore.dev/api";
import { allowRate } from "../utils/ratelimit";
import { tutorialsDB } from "../tutorials/db";
import type { Notebook } from "./notebook";
import { buildNotebook } from "./notebook";

export const exportColab = api<{ tutorialId: number }, Notebook>(
  { expose: true, method: "GET", path: "/export/colab/:tutorialId" },
  async ({ tutorialId }, ctx) => {
    if (!tutorialId || tutorialId < 1) throw APIError.invalidArgument("tutorialId required");
    // Mild per-IP throttle to prevent scraping (auth not required)
    try {
      const ip = (ctx?.req?.header?.("x-forwarded-for") || ctx?.req?.header?.("x-real-ip") || "anon").toString();
      const ident = ip.split(',')[0].trim() || 'anon';
      const gate = allowRate(ident, 'export_colab', Number(process.env.COLAB_EXPORT_MAX_RPM || 30), 60_000);
      if (!gate.ok) throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);
    } catch {}
    const tut = await tutorialsDB.queryRow<{
      id: number; title: string; description: string; provider: string; model: string;
      maker_name?: string | null; maker_org?: string | null; maker_homepage?: string | null; maker_license?: string | null; maker_repo?: string | null;
    }>`
      SELECT t.id, t.title, t.description, t.provider, t.model,
             mm.name as maker_name, mm.org_type as maker_org, mm.homepage as maker_homepage, mm.license as maker_license, mm.repo as maker_repo
      FROM tutorials t
      LEFT JOIN model_makers mm ON mm.id = t.model_maker_id
      WHERE t.id = ${tutorialId}
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
      assessments,
      tut.maker_name ? {
        name: tut.maker_name,
        org_type: tut.maker_org || 'organization',
        homepage: tut.maker_homepage || undefined,
        license: tut.maker_license || undefined,
        repo: tut.maker_repo || undefined,
      } : null
    );
  }
);

// buildNotebook moved to ./notebook for pure unit testing
