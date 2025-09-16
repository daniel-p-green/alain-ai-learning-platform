export type HfModelRef = { owner: string; repo: string; kind: 'model' | 'dataset' | 'space'; revision?: string };

export function parseHfUrl(url: string): HfModelRef {
  // Accept forms like:
  // https://huggingface.co/owner/repo
  // https://huggingface.co/owner/repo/tree/main
  // https://huggingface.co/models/owner/repo?revision=abc
  // https://huggingface.co/datasets/owner/repo
  // https://huggingface.co/spaces/owner/repo
  // huggingface.co/owner/repo
  const raw = (url || '').trim();
  if (!raw || raw.length > 2048) throw new Error("Invalid HF URL: empty or too long");

  // Ensure we can safely parse with URL; prepend protocol if missing
  const toParse = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u: URL;
  try { u = new URL(toParse); } catch { throw new Error("Invalid HF URL: unparsable"); }

  const host = (u.hostname || '').toLowerCase();
  // Reject subdomains explicitly; allow exactly huggingface.co
  if (host !== 'huggingface.co') {
    throw new Error("Invalid HF URL: not a huggingface.co link");
  }

  const parts = (u.pathname || '').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  let kind: 'model' | 'dataset' | 'space' = 'model';
  let idx = 0;
  if (parts[0] === 'models') { kind = 'model'; idx = 1; }
  else if (parts[0] === 'datasets') { kind = 'dataset'; idx = 1; }
  else if (parts[0] === 'spaces') { kind = 'space'; idx = 1; }

  if (parts.length - idx < 2) throw new Error("Invalid HF URL: missing owner/repo");
  const ownerRaw = parts[idx];
  const repoRaw = parts[idx + 1];

  // Extract optional revision from /tree/<rev> or ?revision=
  let revision: string | undefined = undefined;
  if (parts[idx + 2] === 'tree' && parts[idx + 3]) {
    revision = decodeURIComponent(parts[idx + 3]);
  }
  const qrev = (u.searchParams.get('revision') || '').trim();
  if (qrev) revision = qrev;

  // Length and charset checks (defensive)
  const owner = (ownerRaw || '').trim();
  const repo = (repoRaw || '').trim();
  if (owner.length < 1 || owner.length > 64) throw new Error("Invalid HF URL: owner length");
  if (repo.length < 1 || repo.length > 128) throw new Error("Invalid HF URL: repo length");
  const nameRe = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
  if (!nameRe.test(owner)) throw new Error("Invalid HF URL: owner characters");
  if (!nameRe.test(repo)) throw new Error("Invalid HF URL: repo characters");
  return { owner, repo, kind, revision };
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
