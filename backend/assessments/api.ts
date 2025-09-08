import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "../tutorials/db";
import { requireUserId } from "../auth";

interface Assessment {
  id: number;
  tutorial_id: number;
  step_order: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  difficulty: string;
  tags: string[];
}

export const listByTutorial = api<{ tutorialId: number; stepOrder?: number }, { assessments: Assessment[] }>(
  { expose: true, method: "GET", path: "/assessments/:tutorialId" },
  async ({ tutorialId, stepOrder }) => {
    if (!tutorialId || tutorialId < 1) throw APIError.invalidArgument("tutorialId required");
    const rows = tutorialsDB.query<Assessment>`
      SELECT id, tutorial_id, step_order, question, options, correct_index, explanation, difficulty, tags
      FROM assessments
      WHERE tutorial_id = ${tutorialId}
      ${stepOrder ? tutorialsDB.sql`AND step_order = ${stepOrder}` : tutorialsDB.sql``}
      ORDER BY step_order ASC, id ASC
    ` as any;
    const assessments: Assessment[] = [];
    for await (const r of rows) assessments.push(r);
    return { assessments };
  }
);

export const validate = api<{ assessmentId: number; choice: number }, { correct: boolean; explanation?: string }>(
  { expose: true, method: "POST", path: "/assessments/validate" },
  async ({ assessmentId, choice }, ctx) => {
    const userId = await requireUserId(ctx);
    if (!assessmentId || assessmentId < 1) throw APIError.invalidArgument("assessmentId required");
    const a = await tutorialsDB.queryRow<Assessment>`
      SELECT id, tutorial_id, step_order, question, options, correct_index, explanation, difficulty, tags
      FROM assessments WHERE id = ${assessmentId}
    `;
    if (!a) throw APIError.notFound("assessment not found");
    if (choice == null || choice < 0 || choice >= a.options.length) throw APIError.invalidArgument("invalid choice index");
    const correct = choice === a.correct_index;
    await tutorialsDB.exec`
      INSERT INTO assessment_responses (user_id, assessment_id, selected_index, correct)
      VALUES (${userId}, ${assessmentId}, ${choice}, ${correct})
      ON CONFLICT (user_id, assessment_id) DO UPDATE SET selected_index = ${choice}, correct = ${correct}
    `;
    return { correct, explanation: a.explanation || undefined };
  }
);

