import { api, APIError } from "encore.dev/api";
import { tutorialsDB } from "../tutorials/db";
import { requireUserId } from "../auth";

export const getTutorialStats = api<{ tutorialId: number }, {
  tutorialId: number;
  users_total: number;
  users_active_7d: number;
  steps_total: number;
  completed_users: number;
  completion_rate: number;
}>(
  { expose: true, method: "GET", path: "/tutorials/:tutorialId/stats" },
  async ({ tutorialId }, ctx) => {
    await requireUserId(ctx);
    const t = await tutorialsDB.queryRow`SELECT id FROM tutorials WHERE id = ${tutorialId}`;
    if (!t) throw APIError.notFound("tutorial not found");

    const { count: users_total } = (await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM user_progress WHERE tutorial_id = ${tutorialId}
    `) || { count: 0 };

    const { count: users_active_7d } = (await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM user_progress WHERE tutorial_id = ${tutorialId} AND last_accessed >= NOW() - interval '7 days'
    `) || { count: 0 };

    const { steps_total } = (await tutorialsDB.queryRow<{ steps_total: number }>`
      SELECT COALESCE(MAX(step_order), 0) as steps_total FROM tutorial_steps WHERE tutorial_id = ${tutorialId}
    `) || { steps_total: 0 };

    const { count: completed_users } = (await tutorialsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM user_progress
      WHERE tutorial_id = ${tutorialId}
        AND array_length(completed_steps, 1) = ${steps_total}
        AND ${steps_total} > 0
    `) || { count: 0 };

    const completion_rate = users_total > 0 ? completed_users / users_total : 0;

    return { tutorialId, users_total, users_active_7d, steps_total, completed_users, completion_rate };
  }
);

export const getStepAnalytics = api<{ tutorialId: number }, {
  tutorialId: number;
  steps: Array<{ step_order: number; title: string; users_current: number; users_completed: number }>;
}>(
  { expose: true, method: "GET", path: "/tutorials/:tutorialId/steps/analytics" },
  async ({ tutorialId }, ctx) => {
    await requireUserId(ctx);
    const steps = await tutorialsDB.queryAll<{ step_order: number; title: string }>`
      SELECT step_order, title FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order
    `;
    const rows: Array<{ step_order: number; title: string; users_current: number; users_completed: number }> = [];
    for (const s of steps) {
      const { count: users_current } = (await tutorialsDB.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM user_progress WHERE tutorial_id = ${tutorialId} AND current_step = ${s.step_order}
      `) || { count: 0 };
      const { count: users_completed } = (await tutorialsDB.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM user_progress WHERE tutorial_id = ${tutorialId} AND ${s.step_order} = ANY(completed_steps)
      `) || { count: 0 };
      rows.push({ step_order: s.step_order, title: s.title, users_current, users_completed });
    }
    return { tutorialId, steps: rows };
  }
);

export const getUserLearningPaths = api<{ tutorialId: number; limit?: number }, {
  tutorialId: number;
  top_paths: Array<{ path: number[]; users: number }>;
}>(
  { expose: true, method: "GET", path: "/tutorials/:tutorialId/learning-paths" },
  async ({ tutorialId, limit = 10 }, ctx) => {
    await requireUserId(ctx);
    const rows = await tutorialsDB.queryAll<{ path: number[]; users: number }>`
      SELECT completed_steps as path, COUNT(*) as users
      FROM user_progress
      WHERE tutorial_id = ${tutorialId}
      GROUP BY completed_steps
      ORDER BY users DESC
      LIMIT ${limit}
    `;
    return { tutorialId, top_paths: rows };
  }
);

