import { describe, it, expect } from "vitest";
import { parseHfUrl, normalizeDifficulty, toTags } from "./hf";

describe("parseHfUrl", () => {
  it("parses standard url", () => {
    expect(parseHfUrl("https://huggingface.co/meta-llama/Llama-3.1-8B")).toEqual({ owner: "meta-llama", repo: "Llama-3.1-8B", kind: 'model', revision: undefined });
  });
  it("parses url without protocol", () => {
    expect(parseHfUrl("huggingface.co/openai/clip")).toEqual({ owner: "openai", repo: "clip", kind: 'model', revision: undefined });
  });
  it("accepts uppercase host and extracts revision via tree", () => {
    expect(parseHfUrl("HTTPS://HUGGINGFACE.CO/openai/clip/tree/main")).toEqual({ owner: "openai", repo: "clip", kind: 'model', revision: 'main' });
  });
  it("extracts revision via query parameter", () => {
    expect(parseHfUrl("https://huggingface.co/openai/clip?revision=abc123")).toEqual({ owner: "openai", repo: "clip", kind: 'model', revision: 'abc123' });
  });
  it("parses datasets and spaces kinds", () => {
    expect(parseHfUrl("https://huggingface.co/datasets/hf-internal-testing/dummy")).toEqual({ owner: "hf-internal-testing", repo: "dummy", kind: 'dataset', revision: undefined });
    expect(parseHfUrl("https://huggingface.co/spaces/someone/cool-app")).toEqual({ owner: "someone", repo: "cool-app", kind: 'space', revision: undefined });
  });
  it("rejects non-HF", () => {
    expect(() => parseHfUrl("https://example.com/x/y")).toThrow();
  });
  it("rejects subdomains like www.", () => {
    expect(() => parseHfUrl("https://www.huggingface.co/x/y")).toThrow();
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
