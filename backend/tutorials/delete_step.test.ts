import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { deleteStep } from "./delete_step";
import { tutorialsDB } from "./db";
import { APIError } from "encore.dev/api";

vi.mock("../auth", () => ({
  requireUserId: vi.fn().mockResolvedValue("test-user"),
}));

describe("deleteStep", () => {
  let tutorialId: number;
  let step1Id: number, step2Id: number, step3Id: number;

  beforeEach(async () => {
    const tutorial = await tutorialsDB.queryRow`
      INSERT INTO tutorials (title, description, model, provider, difficulty)
      VALUES ('Test Tutorial', 'Desc', 'model', 'provider', 'beginner')
      RETURNING id
    `;
    tutorialId = tutorial!.id;

    const steps = await tutorialsDB.queryAll`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content)
      VALUES (${tutorialId}, 1, 'Step 1', 'Content 1'),
             (${tutorialId}, 2, 'Step 2', 'Content 2'),
             (${tutorialId}, 3, 'Step 3', 'Content 3')
      RETURNING id
    `;
    [step1Id, step2Id, step3Id] = steps.map(s => s.id);
  });

  afterEach(async () => {
    await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorialId}`;
  });

  it("deletes a step and reorders subsequent steps", async () => {
    const response = await deleteStep({ stepId: step2Id });
    expect(response.success).toBe(true);
    expect(response.deletedStep.id).toBe(step2Id);
    expect(response.reorderedSteps).toBe(1);

    const remainingSteps = await tutorialsDB.queryAll`SELECT * FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order`;
    expect(remainingSteps.length).toBe(2);
    expect(remainingSteps[0].id).toBe(step1Id);
    expect(remainingSteps[0].step_order).toBe(1);
    expect(remainingSteps[1].id).toBe(step3Id);
    expect(remainingSteps[1].step_order).toBe(2); // was 3
  });

  it("throws an error if step does not exist", async () => {
    await expect(deleteStep({ stepId: 9999 })).rejects.toThrow("tutorial step not found");
  });

  it("throws an error when trying to delete the only step", async () => {
    await tutorialsDB.exec`DELETE FROM tutorial_steps WHERE id IN (${step2Id}, ${step3Id})`;
    await expect(deleteStep({ stepId: step1Id })).rejects.toThrow("cannot delete the only step in tutorial");
  });

  it("throws an error if a user has progress on the step", async () => {
    await tutorialsDB.exec`
      INSERT INTO user_progress (user_id, tutorial_id, current_step)
      VALUES ('test-user', ${tutorialId}, 2)
    `;
    await expect(deleteStep({ stepId: step2Id })).rejects.toThrow("cannot delete step as users have progress on this step");
  });

  it("updates user progress when a preceding step is deleted", async () => {
    await tutorialsDB.exec`
      INSERT INTO user_progress (user_id, tutorial_id, current_step)
      VALUES ('test-user-progress', ${tutorialId}, 3)
    `;
    await deleteStep({ stepId: step2Id });
    const progress = await tutorialsDB.queryRow`SELECT * FROM user_progress WHERE user_id = 'test-user-progress'`;
    expect(progress!.current_step).toBe(2); // was 3
  });
});
