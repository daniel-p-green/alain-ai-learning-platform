import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateStep } from "./update_step";
import { tutorialsDB } from "./db";
import { APIError } from "encore.dev/api";

vi.mock("../auth", () => ({
  requireUserId: vi.fn().mockResolvedValue("test-user"),
}));

describe("updateStep", () => {
  let tutorialId: number;
  let stepId: number;

  beforeEach(async () => {
    const tutorial = await tutorialsDB.queryRow`
      INSERT INTO tutorials (title, description, model, provider, difficulty)
      VALUES ('Test Tutorial', 'Desc', 'model', 'provider', 'beginner')
      RETURNING id
    `;
    tutorialId = tutorial!.id;
    const step = await tutorialsDB.queryRow`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, model_params)
      VALUES (${tutorialId}, 1, 'Original Title', 'Original Content', '{"temp": 0.5}')
      RETURNING id
    `;
    stepId = step!.id;
  });

  afterEach(async () => {
    await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorialId}`;
  });

  it("updates a step's title and content", async () => {
    const updated = await updateStep({
      stepId,
      title: "Updated Title",
      content: "Updated Content",
    });

    expect(updated.title).toBe("Updated Title");
    expect(updated.content).toBe("Updated Content");

    const dbStep = await tutorialsDB.queryRow`SELECT * FROM tutorial_steps WHERE id = ${stepId}`;
    expect(dbStep!.title).toBe("Updated Title");
  });

  it("throws an error if stepId is invalid", async () => {
    await expect(
      updateStep({ stepId: 9999, title: "Does not matter" })
    ).rejects.toThrow("tutorial step with ID 9999 not found");
  });

  it("throws an error if no update fields are provided", async () => {
    await expect(updateStep({ stepId })).rejects.toThrow("at least one field must be provided for update");
  });

  it("throws an error for an empty title", async () => {
    await expect(
      updateStep({ stepId, title: "" })
    ).rejects.toThrow("step title cannot be empty");
  });

  it("updates model_params", async () => {
    const newParams = { temperature: 0.9 };
    const updated = await updateStep({
      stepId,
      modelParams: newParams,
    });
    expect(updated.model_params).toEqual(newParams);
  });

  it("throws an error for invalid model_params", async () => {
    await expect(
      updateStep({ stepId, modelParams: "invalid-json" })
    ).rejects.toThrow("invalid model parameters: modelParams must be a JSON object or null");
  });
});
