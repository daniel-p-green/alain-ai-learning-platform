import { describe, it, expect } from "vitest";
import { validateLessonLite } from "./validation";

describe("validateLessonLite", () => {
  it("accepts a valid lesson", () => {
    expect(() => validateLessonLite({
      title: "Intro to Model",
      description: "Basics",
      model: "gpt-4o-mini",
      provider: "openai-compatible",
      difficulty: "beginner",
      tags: ["hf", "demo"],
      steps: [
        { step_order: 1, title: "Step 1", content: "Do X" },
      ]
    })).not.toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => validateLessonLite({
      title: "",
      description: "",
      model: "",
      provider: "",
      difficulty: "noop" as any,
      tags: [] as any,
      steps: []
    })).toThrow();
  });
});

