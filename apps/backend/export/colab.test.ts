import { describe, it, expect } from "vitest";
import { buildNotebook } from "./notebook";

describe("buildNotebook", () => {
  it("creates markdown and code cells", () => {
    const nb = buildNotebook("Title", "Desc", [
      { step_order: 1, title: "Intro", content: "Hello", code_template: null },
      { step_order: 2, title: "Code", content: "Run", code_template: "print('hi')" },
    ]);
    expect(nb.cells[0].cell_type).toBe("markdown");
    expect(nb.cells.some(c => c.cell_type === "code")).toBe(true);
    expect(nb.nbformat).toBe(4);
  });
});
