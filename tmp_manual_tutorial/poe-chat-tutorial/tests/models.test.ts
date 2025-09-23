import { describe, expect, it } from "vitest";
import { isAllowedModel, poeModels } from "@/lib/models";
import { createTelemetryId } from "@/lib/telemetry";

describe("model validation", () => {
  it("accepts every configured Poe model", () => {
    for (const model of poeModels) {
      expect(isAllowedModel(model.id)).toBe(true);
    }
  });

  it("rejects unsupported models", () => {
    expect(isAllowedModel("unknown-model")).toBe(false);
    expect(isAllowedModel(123)).toBe(false);
  });
});

describe("telemetry helpers", () => {
  it("creates unique identifiers", () => {
    const first = createTelemetryId();
    const second = createTelemetryId();
    expect(first).not.toEqual(second);
    expect(first.startsWith("evt_")).toBe(true);
  });
});
