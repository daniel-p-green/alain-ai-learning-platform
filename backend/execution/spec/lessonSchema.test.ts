import { describe, it, expect } from "vitest";
import { validateLesson, applyDefaults } from "./lessonSchema";

describe("lessonSchema", () => {
  it("validates minimal valid lesson", () => {
    const lesson = { title: "T", description: "D", steps: [{ title: "S1", content: "C1" }] };
    const r = validateLesson(lesson);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("collects validation errors", () => {
    const r = validateLesson({});
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toContain("title is required");
    expect(r.errors.join(" ")).toContain("description is required");
    expect(r.errors.join(" ")).toContain("steps array is required");
  });

  it("applies defaults and synthesizes prompt when missing", () => {
    const inLesson = { title: "T", description: "D", steps: [{ title: "S1", content: "C1" }] };
    const out = applyDefaults(inLesson, "beginner", { name: "gpt-oss-20b", org: "hf-org" });
    expect(out.provider).toBe("poe");
    expect(out.difficulty).toBe("beginner");
    expect(out.model).toBe("gpt-oss-20b");
    expect(out.tags).toContain("hf-org");
    expect(out.steps[0].step_order).toBe(1);
    expect(typeof out.steps[0].code_template).toBe("string");
    expect(out.steps[0].code_template!.length).toBeGreaterThan(0);
  });

  it("validates learning_objectives and assessments shape", () => {
    const lesson: any = {
      title: "T", description: "D",
      steps: [{ title: "S1", content: "C1" }],
      learning_objectives: ["a", "b"],
      assessments: [{ question: "Q?", options: ["x","y"], correct_index: 1, explanation: "why" }]
    };
    expect(validateLesson(lesson).valid).toBe(true);

    lesson.assessments[0].correct_index = 3; // invalid
    const r = validateLesson(lesson);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('correct_index invalid');
  });

  it("rejects overly long content", () => {
    const big = 'x'.repeat(5000);
    const lesson = { title: "T", description: "D", steps: [{ title: "S1", content: big }] } as any;
    const r = validateLesson(lesson);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('content too long');
  });
});
