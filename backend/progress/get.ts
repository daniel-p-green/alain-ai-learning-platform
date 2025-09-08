import { api, APIError } from "encore.dev/api";
import { progressDB } from "./db";

interface GetProgressParams {
  userId: string;
  tutorialId: number;
}

interface UserProgress {
  id: number;
  user_id: string;
  tutorial_id: number;
  current_step: number;
  completed_steps: number[];
  started_at: Date;
  last_accessed: Date;
}

interface GetProgressResponse {
  progress: UserProgress | null;
}

// Retrieves user progress for a tutorial.
export const getProgress = api<GetProgressParams, GetProgressResponse>(
  { expose: true, method: "GET", path: "/progress/:userId/:tutorialId" },
  async ({ userId, tutorialId }) => {
    const progress = await progressDB.queryRow<UserProgress>`
      SELECT id, user_id, tutorial_id, current_step, completed_steps, started_at, last_accessed
      FROM user_progress
      WHERE user_id = ${userId} AND tutorial_id = ${tutorialId}
    `;

    return { progress };
  }
);
