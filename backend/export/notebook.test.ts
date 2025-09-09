import { describe, it, expect } from "vitest";
import { buildNotebook } from "./notebook";

describe("buildNotebook (Colab export)", () => {
  const meta = { title: "Test Tutorial", description: "Desc", provider: "poe", model: "gpt-oss-20b" };
  const steps = [
    { step_order: 1, title: "Hello", content: "Say hello", code_template: "Write a short greeting." },
    { step_order: 2, title: "JSON", content: "Return JSON", code_template: "Respond with a JSON object with name and version." },
  ];
  const assessments = [
    { step_order: 1, question: "2+2?", options: ["3", "4"], correct_index: 1, explanation: "2+2=4" },
  ];

  it("includes intro, setup, env, and smoke test cells", () => {
    const nb = buildNotebook(meta, steps, assessments);
    expect(nb.cells.length).toBeGreaterThan(4);

    const intro = nb.cells[0];
    expect(intro.cell_type).toBe("markdown");
    expect(intro.source.join(""))
      .toContain("Test Tutorial");

    const pip = nb.cells[1];
    expect(pip.cell_type).toBe("code");
    expect(pip.source.join(""))
      .toContain("pip -q install openai");

    const env = nb.cells[2];
    expect(env.source.join(""))
      .toContain("OPENAI_BASE_URL");
    expect(env.source.join(""))
      .toContain("OPENAI_API_KEY");

    const smoke = nb.cells[3];
    expect(smoke.source.join(""))
      .toContain("client.chat.completions.create");
  });

  it("renders step prompts into runnable code cells", () => {
    const nb = buildNotebook(meta, steps, assessments);
    const codeCells = nb.cells.filter(c => c.cell_type === "code");
    const body = codeCells.map(c => c.source.join("")).join("\n---\n");
    // Accept triple-single or triple-double quotes for PROMPT string.
    expect(body.match(/PROMPT\s*=\s*("""|''')/)).toBeTruthy();
    expect(body).toContain("Write a short greeting.");
    expect(body).toContain("client.chat.completions.create");
  });

  it("includes MCQ cells with grading logic", () => {
    const nb = buildNotebook(meta, steps, assessments);
    const mcqCell = nb.cells.find(c => c.cell_type === "code" && c.source.join("").includes("Assessment for Step 1"));
    expect(mcqCell).toBeTruthy();
    const src = mcqCell!.source.join("");
    expect(src).toContain("question = ");
    expect(src).toContain("options = ");
    expect(src).toContain("correct_index = 1");
    expect(src).toContain("choice = 0");
  });
});
