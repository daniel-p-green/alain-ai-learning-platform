import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "./db";
import { requireUserId } from "../auth";

interface VersionMeta { version: number; created_at: string; author_id: string | null }

export const createVersion = api<{ tutorialId: number }, { tutorialId: number; version: number }>(
  { expose: true, method: "POST", path: "/tutorials/:tutorialId/versions" },
  async ({ tutorialId }, ctx) => {
    const userId = await requireUserId(ctx);
    // Validate tutorial exists
    const tutorial = await tutorialsDB.queryRow`SELECT * FROM tutorials WHERE id = ${tutorialId}`;
    if (!tutorial) throw APIError.notFound("tutorial not found");

    const tx = await tutorialsDB.begin();
    try {
      const next = await tx.queryRow<{ next: number }>`
        SELECT COALESCE(MAX(version), 0) + 1 as next
        FROM tutorial_versions
        WHERE tutorial_id = ${tutorialId}
      `;

      const snapshot = await buildSnapshot(tutorialId, tx);
      const row = await tx.queryRow<{ version: number }>`
        INSERT INTO tutorial_versions (tutorial_id, version, author_id, snapshot)
        VALUES (${tutorialId}, ${next!.next}, ${userId}, ${snapshot})
        RETURNING version
      `;
      await tx.commit();
      return { tutorialId, version: row!.version };
    } catch (e) {
      await (await tx).rollback();
      throw e;
    }
  }
);

export const listVersions = api<{ tutorialId: number }, { versions: VersionMeta[] }>(
  { expose: true, method: "GET", path: "/tutorials/:tutorialId/versions" },
  async ({ tutorialId }) => {
    const rows = await tutorialsDB.queryAll<VersionMeta>`
      SELECT version, created_at, author_id
      FROM tutorial_versions
      WHERE tutorial_id = ${tutorialId}
      ORDER BY version DESC
    `;
    return { versions: rows };
  }
);

export const restoreVersion = api<{ tutorialId: number; version: number }, { restoredVersion: number }>(
  { expose: true, method: "POST", path: "/tutorials/:tutorialId/versions/:version/restore" },
  async ({ tutorialId, version }, ctx) => {
    await requireUserId(ctx);
    const row = await tutorialsDB.queryRow<{ snapshot: any }>`
      SELECT snapshot FROM tutorial_versions
      WHERE tutorial_id = ${tutorialId} AND version = ${version}
    `;
    if (!row) throw APIError.notFound("version not found");
    const snapshot = row.snapshot as any;

    const tx = await tutorialsDB.begin();
    try {
      // Replace steps with snapshot
      await tx.exec`DELETE FROM tutorial_steps WHERE tutorial_id = ${tutorialId}`;
      const steps: any[] = snapshot.steps || [];
      for (const s of steps) {
        await tx.exec`
          INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
          VALUES (${tutorialId}, ${s.step_order}, ${s.title}, ${s.content}, ${s.code_template || null}, ${s.expected_output || null}, ${s.model_params || null})
        `;
      }

      // Clamp user progress to new step count
      const maxOrder = steps.length;
      await tx.exec`
        UPDATE user_progress
        SET current_step = LEAST(current_step, ${maxOrder}),
            completed_steps = (SELECT ARRAY(SELECT x FROM UNNEST(completed_steps) AS x WHERE x <= ${maxOrder})),
            last_accessed = NOW()
        WHERE tutorial_id = ${tutorialId}
      `;

      await tx.commit();
      return { restoredVersion: version };
    } catch (e) {
      await (await tx).rollback();
      throw e;
    }
  }
);

async function buildSnapshot(tutorialId: number, db?: any): Promise<any> {
  const database = db ?? tutorialsDB;
  const tutorial = await database.queryRow<any>`
    SELECT id, title, description, model, provider, difficulty, tags, model_maker_id, created_at, updated_at
    FROM tutorials WHERE id = ${tutorialId}
  `;
  const steps = await database.queryAll<any>`
    SELECT step_order, title, content, code_template, expected_output, model_params
    FROM tutorial_steps WHERE tutorial_id = ${tutorialId}
    ORDER BY step_order
  `;
  return { tutorial, steps };
}
