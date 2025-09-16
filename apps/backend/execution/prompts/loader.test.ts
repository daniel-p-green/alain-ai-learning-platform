import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parseHarmonyPrompt, loadHarmonyPrompt, loadAlainKitPrompt } from "./loader";

const SAMPLE = `<|start|>system<|message|>You are ChatGPT.<|end|><|start|>developer<|message|>Follow ALAIN rules.<|end|>`;

describe("prompt loader", () => {
  it("parses system and developer from SAMPLE", () => {
    const { system, developer } = parseHarmonyPrompt(SAMPLE);
    expect(system).toContain("You are ChatGPT");
    expect(developer).toContain("ALAIN");
  });

  it("loads real research.harmony.txt via absolute path", () => {
    const file = path.resolve(__dirname, "../../../../resources/prompts/alain-kit/research.harmony.txt");
    const { system, developer } = loadHarmonyPrompt(file);
    expect(system.length).toBeGreaterThan(0);
    expect(developer.length).toBeGreaterThan(0);
  });

  it("loads research via loadAlainKitPrompt", () => {
    const { system, developer } = loadAlainKitPrompt("research");
    expect(system.length).toBeGreaterThan(0);
    expect(developer.length).toBeGreaterThan(0);
  });

  it("loads research via extended identifiers", () => {
    const a = loadAlainKitPrompt("research.harmony");
    const b = loadAlainKitPrompt("research.harmony.txt");
    const c = loadAlainKitPrompt("research.offline");
    expect(a.system.length).toBeGreaterThan(0);
    expect(a.developer.length).toBeGreaterThan(0);
    expect(b.system.length).toBeGreaterThan(0);
    expect(c.system.length).toBeGreaterThan(0);
  });
});
