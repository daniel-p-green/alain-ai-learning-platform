import { describe, it, expect } from "vitest";
import { parseHfUrl, normalizeDifficulty, toTags } from "./hf";

describe("parseHfUrl", () => {
  it("parses standard url", () => {
    expect(parseHfUrl("https://huggingface.co/meta-llama/Llama-3.1-8B")).toEqual({ owner: "meta-llama", repo: "Llama-3.1-8B" });
  });
  it("parses url without protocol", () => {
    expect(parseHfUrl("huggingface.co/openai/clip")).toEqual({ owner: "openai", repo: "clip" });
  });
  it("rejects non-HF", () => {
    expect(() => parseHfUrl("https://example.com/x/y")).toThrow();
  });

  it("rejects oversized owner or repo", () => {
    const longOwner = 'a'.repeat(65);
    const longRepo = 'b'.repeat(129);
    expect(() => parseHfUrl(`https://huggingface.co/${longOwner}/repo`)).toThrow();
    expect(() => parseHfUrl(`https://huggingface.co/owner/${longRepo}`)).toThrow();
  });

  it("rejects invalid characters", () => {
    expect(() => parseHfUrl("https://huggingface.co/owner/repo!"))
      .toThrow();
    expect(() => parseHfUrl("https://huggingface.co/ow ner/repo"))
      .toThrow();
  });
});

describe("normalizeDifficulty", () => {
  it("returns supported values or default", () => {
    expect(normalizeDifficulty("beginner")).toBe("beginner");
    expect(normalizeDifficulty("INTERMEDIATE")).toBe("intermediate");
    expect(normalizeDifficulty("x")).toBe("beginner");
  });
});

describe("toTags", () => {
  it("builds tags from owner/repo", () => {
    expect(toTags("Meta-LLaMA", "Llama-3.1-8B")).toContain("meta-llama");
    expect(toTags("Meta-LLaMA", "Llama-3.1-8B")).toContain("llama");
  });
});
