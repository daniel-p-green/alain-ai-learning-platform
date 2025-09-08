import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { reorderSteps } from "./reorder_steps";
import { tutorialsDB } from "./db";
import { APIError } from "encore.dev/api";

vi.mock("../auth", () => ({
  requireUserId: vi.fn().mockResolvedValue("test-user"),
}));

describe("reorderSteps", () => {
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
      RETURNING id, step_order
    `;
    step1Id = steps[0].id;
    step2Id = steps[1].id;
    step3Id = steps[2].id;
  });

  afterEach(async () => {
    await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorialId}`;
  });

  it("reorders all steps successfully", async () => {
    const response = await reorderSteps({
      tutorialId,
      stepOrders: [
        { stepId: step1Id, newOrder: 3 },
        { stepId: step2Id, newOrder: 1 },
        { stepId: step3Id, newOrder: 2 },
      ],
    });

    expect(response.success).toBe(true);
    expect(response.reorderedSteps.length).toBe(3);

    const newSteps = await tutorialsDB.queryAll`SELECT id, step_order FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order`;
    expect(newSteps[0].id).toBe(step2Id);
    expect(newSteps[1].id).toBe(step3Id);
    expect(newSteps[2].id).toBe(step1Id);
  });

  it("throws an error for duplicate newOrder", async () => {
    await expect(
      reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 1 },
          { stepId: step2Id, newOrder: 1 },
        ],
      })
    ).rejects.toThrow("duplicate new step orders found");
  });

  it("throws an error for incomplete sequence when reordering all steps", async () => {
    await expect(
      reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 1 },
          { stepId: step2Id, newOrder: 2 },
          { stepId: step3Id, newOrder: 4 }, // Should be 3
        ],
      })
    ).rejects.toThrow("when reordering all steps, new orders must form a complete sequence");
  });

  it("throws an error for stepId not belonging to tutorial", async () => {
    await expect(
      reorderSteps({
        tutorialId,
        stepOrders: [{ stepId: 9999, newOrder: 1 }],
      })
    ).rejects.toThrow("do not belong to tutorial");
  });

  it("updates user progress correctly", async () => {
    await tutorialsDB.exec`
      INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps)
      VALUES ('test-user', ${tutorialId}, 2, ARRAY[1])
    `;

    await reorderSteps({
      tutorialId,
      stepOrders: [
        { stepId: step1Id, newOrder: 2 },
        { stepId: step2Id, newOrder: 1 },
        { stepId: step3Id, newOrder: 3 },
      ],
    });

    const progress = await tutorialsDB.queryRow`SELECT * FROM user_progress WHERE user_id = 'test-user'`;
    expect(progress!.current_step).toBe(1); // was 2, which became 1
    expect(progress!.completed_steps).toEqual([2]); // was [1], which became [2]
  });

  it("handles partial reordering", async () => {
    const response = await reorderSteps({
      tutorialId,
      stepOrders: [
        { stepId: step1Id, newOrder: 2 },
        { stepId: step2Id, newOrder: 1 },
      ],
    });
    expect(response.success).toBe(true);
    const newSteps = await tutorialsDB.queryAll`SELECT id, step_order FROM tutorial_steps WHERE tutorial_id = ${tutorialId} ORDER BY step_order`;
    expect(newSteps.find(s => s.id === step2Id)!.step_order).toBe(1);
    expect(newSteps.find(s => s.id === step1Id)!.step_order).toBe(2);
    expect(newSteps.find(s => s.id === step3Id)!.step_order).toBe(3); // Unchanged
  });

  it("throws an error on partial reorder conflict", async () => {
    await expect(
      reorderSteps({
        tutorialId,
        stepOrders: [{ stepId: step1Id, newOrder: 3 }], // Conflicts with step3's order
      })
    ).rejects.toThrow("conflict with existing step orders");
  });
});
