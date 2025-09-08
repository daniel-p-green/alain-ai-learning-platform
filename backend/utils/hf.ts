export type HfModelRef = { owner: string; repo: string };

export function parseHfUrl(url: string): HfModelRef {
  // Accept forms like:
  // https://huggingface.co/owner/repo
  // https://huggingface.co/owner/repo/tree/main
  // huggingface.co/owner/repo
  const u = url.trim();
  const m = u.replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (!m.startsWith("huggingface.co/")) {
    throw new Error("Not a Hugging Face URL");
  }
  const parts = m.split("/").slice(1); // drop domain
  if (parts.length < 2) throw new Error("Invalid HF URL: missing owner/repo");
  const [owner, repo] = parts;
  if (!owner || !repo) throw new Error("Invalid HF URL: missing owner/repo");
  return { owner, repo };
}

export function normalizeDifficulty(input?: string): "beginner" | "intermediate" | "advanced" {
  const v = (input || "").toLowerCase();
  if (["beginner", "intermediate", "advanced"].includes(v)) return v as any;
  return "beginner";
}

export function toTags(owner: string, repo: string): string[] {
  const tags = new Set<string>(["hf", owner.toLowerCase()]);
  repo.split(/[\-_.]+/).forEach((t) => t && tags.add(t.toLowerCase()));
  return Array.from(tags).slice(0, 8);
}

