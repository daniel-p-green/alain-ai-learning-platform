export type HfModelRef = { owner: string; repo: string };

export function parseHfUrl(url: string): HfModelRef {
  // Accept forms like:
  // https://huggingface.co/owner/repo
  // https://huggingface.co/owner/repo/tree/main
  // huggingface.co/owner/repo
  const u = (url || '').trim();
  if (!u || u.length > 2048) throw new Error("Invalid HF URL: empty or too long");
  const m = u.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (!m.startsWith("huggingface.co/")) {
    throw new Error("Invalid HF URL: not a huggingface.co link");
  }
  const parts = m.split("/").slice(1); // drop domain
  if (parts.length < 2) throw new Error("Invalid HF URL: missing owner/repo");
  const [ownerRaw, repoRaw] = parts;
  if (!ownerRaw || !repoRaw) throw new Error("Invalid HF URL: missing owner/repo");

  // Length and charset checks (defensive)
  const owner = ownerRaw.trim();
  const repo = repoRaw.trim();
  if (owner.length < 1 || owner.length > 64) throw new Error("Invalid HF URL: owner length");
  if (repo.length < 1 || repo.length > 128) throw new Error("Invalid HF URL: repo length");
  const nameRe = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
  if (!nameRe.test(owner)) throw new Error("Invalid HF URL: owner characters");
  if (!nameRe.test(repo)) throw new Error("Invalid HF URL: repo characters");
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
