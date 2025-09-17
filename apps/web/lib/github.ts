import { Buffer } from "buffer";

type PutFileParams = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  content: string; // raw text (will be base64-encoded)
  message: string;
  sha?: string; // required for updates
};

let _cachedToken: string | undefined;
async function ghToken(): Promise<string> {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (typeof _cachedToken === 'string' && _cachedToken.length > 0) return _cachedToken;
  try {
    const { kvGet } = await import('@/lib/kv');
    const t = await kvGet<string>('secrets:github_token');
    if (t && t.length > 0) {
      _cachedToken = t;
      return t;
    }
    _cachedToken = undefined;
    return '';
  } catch {
    return '';
  }
}

async function ghFetch(path: string, init: RequestInit = {}) {
  const token = await ghToken();
  if (!token) throw new Error("GITHUB_TOKEN not set");
  const base = "https://api.github.com";
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  } as Record<string, string>;
  init.headers = { ...(init.headers || {}), ...headers };
  const res = await fetch(base + path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getFileSha(owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
  try {
    const json = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
    return json.sha as string | undefined;
  } catch {
    return undefined;
  }
}

export async function putFile(params: PutFileParams) {
  const { owner, repo, branch, path, content, message, sha } = params;
  const body = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  };
  const json = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return json as { content: { path: string; sha: string; html_url: string } };
}

export function ghEnv() {
  const repo = process.env.GITHUB_REPO || ""; // owner/name
  if (!repo.includes("/")) throw new Error("GITHUB_REPO must be 'owner/name'");
  const [owner, name] = repo.split("/", 2);
  const branch = process.env.GITHUB_BRANCH || "main";
  const baseDir = process.env.NOTEBOOKS_DIR || "notebooks";
  return { owner, repo: name, branch, baseDir };
}

export async function ghEnvAsync() {
  let repo = process.env.GITHUB_REPO || "";
  let branch = process.env.GITHUB_BRANCH || "main";
  let baseDir = process.env.NOTEBOOKS_DIR || "notebooks";
  try {
    const { kvGet } = await import('@/lib/kv');
    repo = repo || (await kvGet<string>('secrets:github_repo')) || '';
    branch = (await kvGet<string>('secrets:github_branch')) || branch;
    baseDir = (await kvGet<string>('secrets:notebooks_dir')) || baseDir;
  } catch {}
  if (!repo.includes('/')) throw new Error("GITHUB_REPO must be 'owner/name'");
  const [owner, name] = repo.split('/', 2);
  return { owner, repo: name, branch, baseDir };
}

export async function getFileContent(owner: string, repo: string, path: string, branch: string): Promise<{ content: string; sha?: string } | null> {
  try {
    const json = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
    if (json.encoding !== "base64" || !json.content) return null;
    const buf = Buffer.from(json.content, "base64");
    return { content: buf.toString("utf-8"), sha: json.sha };
  } catch {
    return null;
  }
}

export async function listDir(owner: string, repo: string, path: string, branch: string): Promise<Array<{ path: string; name: string; sha: string }>> {
  try {
    const json = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
    if (!Array.isArray(json)) return [];
    return json.filter((e: any) => e.type === "file").map((e: any) => ({ path: e.path as string, name: e.name as string, sha: e.sha as string }));
  } catch {
    return [];
  }
}

export async function getBranchHeadSha(owner: string, repo: string, branch: string): Promise<string> {
  const json = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  return json.object?.sha as string;
}

export async function createBranch(owner: string, repo: string, newBranch: string, fromSha: string) {
  const body = { ref: `refs/heads/${newBranch}`, sha: fromSha };
  return ghFetch(`/repos/${owner}/${repo}/git/refs`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

export async function createPullRequest(owner: string, repo: string, base: string, head: string, title: string, body: string) {
  const payload = { title, head, base, body };
  return ghFetch(`/repos/${owner}/${repo}/pulls`, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
}
