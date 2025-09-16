import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from "vitest";

const runEncoreSuite = process.env.RUN_ENCORE_TESTS === '1';
const describeEncore = runEncoreSuite ? describe : describe.skip;

let updateStep: any;
let tutorialsDB: any;
let APIError: any;

vi.mock("../auth", () => ({
  requireUserId: vi.fn().mockResolvedValue("test-user"),
}));

describeEncore("updateStep", () => {
  beforeAll(async () => {
    ({ updateStep } = await import("./update_step"));
    ({ tutorialsDB } = await import("./db"));
    ({ APIError } = await import("encore.dev/api"));
  });
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

  it("throws an error for empty content when provided", async () => {
    await expect(
      updateStep({ stepId, content: "  " })
    ).rejects.toThrow("step content cannot be empty");
  });

  it("updates codeTemplate and expectedOutput fields", async () => {
    const updated = await updateStep({
      stepId,
      codeTemplate: "print('Hello')",
      expectedOutput: "Hello",
    });

    expect(updated.code_template).toBe("print('Hello')");
    expect(updated.expected_output).toBe("Hello");
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
