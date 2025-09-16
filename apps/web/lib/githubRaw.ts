export type GhPointer = {
  owner: string;
  repo: string;
  ref: string; // branch or sha
  path: string; // repo-relative path
};

// Parse IDs like:
// - gh:owner/repo@ref:path/to/file.ipynb
// - gh:owner/repo:path/to/file.ipynb (ref defaults to 'main')
export function parseGhId(id: string, defaultRef = 'main'): GhPointer | null {
  if (!id || !id.startsWith('gh:')) return null;
  const body = id.slice(3);
  const atIdx = body.indexOf('@');
  const colonIdx = body.indexOf(':');
  if (colonIdx === -1) return null;
  let ownerRepo = body.slice(0, colonIdx);
  let ref = defaultRef;
  if (atIdx !== -1 && atIdx < colonIdx) {
    ownerRepo = body.slice(0, atIdx);
    ref = body.slice(atIdx + 1, colonIdx) || defaultRef;
  }
  const filePath = body.slice(colonIdx + 1);
  const slash = ownerRepo.indexOf('/');
  if (slash === -1) return null;
  const owner = ownerRepo.slice(0, slash);
  const repo = ownerRepo.slice(slash + 1);
  const ptr = { owner, repo, ref, path: filePath } as GhPointer;
  return isSafeGhPointer(ptr) ? ptr : null;
}

export function isSafeGhPointer(p: GhPointer): boolean {
  const safeName = /^[A-Za-z0-9_.-]+$/;
  if (!safeName.test(p.owner) || !safeName.test(p.repo) || !safeName.test(p.ref)) return false;
  if (!p.path || p.path.startsWith('/') || p.path.includes('..')) return false;
  return true;
}

export function buildRawUrl({ owner, repo, ref, path }: GhPointer): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
}

export async function fetchPublicNotebook(ptr: GhPointer, maxBytes = Number(process.env.NOTEBOOK_RAW_MAX_BYTES || 5 * 1024 * 1024)): Promise<{ nb: any; meta: { id: string; title: string } }>{
  const url = buildRawUrl(ptr);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`github_raw:${res.status}`);
  const text = await res.text();
  if (text.length > maxBytes) throw new Error('file_too_large');
  let nb: any;
  try { nb = JSON.parse(text); } catch { throw new Error('invalid_notebook'); }
  const title = nb?.metadata?.title || nb?.metadata?.colab?.name || ptr.path.split('/').pop()?.replace(/\.ipynb$/, '') || ptr.path;
  const id = `gh:${ptr.owner}/${ptr.repo}@${ptr.ref}:${ptr.path}`;
  return { nb, meta: { id, title } };
}
