import { api } from "encore.dev/api";
import { progressDB } from "./db";

interface UpdateProgressRequest {
  userId: string;
  tutorialId: number;
  currentStep: number;
  completedSteps: number[];
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

// Updates or creates user progress for a tutorial.
export const updateProgress = api<UpdateProgressRequest, UserProgress>(
  { expose: true, method: "POST", path: "/progress" },
  async (req) => {
    const progress = await progressDB.queryRow<UserProgress>`
      INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps, last_accessed)
      VALUES (${req.userId}, ${req.tutorialId}, ${req.currentStep}, ${req.completedSteps}, NOW())
      ON CONFLICT (user_id, tutorial_id)
      DO UPDATE SET
        current_step = ${req.currentStep},
        completed_steps = ${req.completedSteps},
        last_accessed = NOW()
      RETURNING id, user_id, tutorial_id, current_step, completed_steps, started_at, last_accessed
    `;

    return progress!;
  }
);
