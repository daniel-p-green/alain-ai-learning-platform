import { describe, it, expect } from "vitest";
import { isCorrect } from "./logic";

describe("isCorrect", () => {
  it("matches equality", () => {
    expect(isCorrect(2, 2)).toBe(true);
    expect(isCorrect(1, 2)).toBe(false);
  });
});

