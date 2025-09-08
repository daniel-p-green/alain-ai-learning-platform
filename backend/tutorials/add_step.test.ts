import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addStep } from "./add_step";
import { tutorialsDB } from "./db";
import { APIError } from "encore.dev/api";

vi.mock("../auth", () => ({
  requireUserId: vi.fn().mockResolvedValue("test-user"),
}));

describe("addStep", () => {
  let tutorialId: number;

  beforeEach(async () => {
    const tutorial = await tutorialsDB.queryRow`
      INSERT INTO tutorials (title, description, model, provider, difficulty, tags)
      VALUES ('Test Tutorial', 'A test tutorial', 'test-model', 'test-provider', 'beginner', ARRAY['test'])
      RETURNING id
    `;
    tutorialId = tutorial!.id;
    await tutorialsDB.exec`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content)
      VALUES (${tutorialId}, 1, 'Step 1', 'Content 1'),
             (${tutorialId}, 2, 'Step 2', 'Content 2')
    `;
  });

  afterEach(async () => {
    await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorialId}`;
  });

  it("adds a step to the end of a tutorial", async () => {
    const newStep = await addStep({
      tutorialId,
      stepOrder: 3,
      title: "New Step 3",
      content: "Content for new step 3",
    });

    expect(newStep.title).toBe("New Step 3");
    expect(newStep.step_order).toBe(3);

    const steps = await tutorialsDB.queryAll`SELECT * FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order`;
    expect(steps.length).toBe(3);
  });

  it("adds a step in the middle, shifting subsequent steps", async () => {
    const newStep = await addStep({
      tutorialId,
      stepOrder: 2,
      title: "New Middle Step",
      content: "Content for new middle step",
    });

    expect(newStep.title).toBe("New Middle Step");
    expect(newStep.step_order).toBe(2);

    const steps = await tutorialsDB.queryAll`SELECT * FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order`;
    expect(steps.length).toBe(3);
    expect(steps[0].title).toBe("Step 1");
    expect(steps[1].title).toBe("New Middle Step");
    expect(steps[2].title).toBe("Step 2");
    expect(steps[2].step_order).toBe(3);
  });

  it("throws an error for an invalid tutorialId", async () => {
    await expect(
      addStep({
        tutorialId: 9999,
        stepOrder: 1,
        title: "Invalid Step",
        content: "Content",
      })
    ).rejects.toThrow(APIError);
  });

  it("throws an error for empty title", async () => {
    await expect(
      addStep({
        tutorialId,
        stepOrder: 3,
        title: " ",
        content: "Content",
      })
    ).rejects.toThrow("step title cannot be empty");
  });

  it("throws an error for invalid stepOrder (too high)", async () => {
    await expect(
      addStep({
        tutorialId,
        stepOrder: 5, // Current max is 2, so 4 would be next valid, 5 is invalid
        title: "Valid title",
        content: "Content",
      })
    ).rejects.toThrow("step order 5 is invalid. Maximum allowed step order is 3");
  });

  it("adds a step with model_params", async () => {
    const modelParams = { temperature: 0.8, max_tokens: 100 };
    const newStep = await addStep({
      tutorialId,
      stepOrder: 3,
      title: "Step with params",
      content: "Content",
      modelParams,
    });

    expect(newStep.model_params).toEqual(modelParams);
  });

  it("throws an error for invalid model_params", async () => {
    await expect(
      addStep({
        tutorialId,
        stepOrder: 3,
        title: "Invalid params",
        content: "Content",
        modelParams: "not-a-json-object",
      })
    ).rejects.toThrow("invalid model parameters: modelParams must be a JSON object");
  });
});
