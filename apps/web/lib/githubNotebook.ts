export function toGhId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('gh:')) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const normalizedHost = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  const rawSegments = url.pathname.split('/').filter(Boolean);
  if (rawSegments.length === 0) return null;

  const segments: string[] = [];
  for (const segment of rawSegments) {
    try {
      segments.push(decodeURIComponent(segment));
    } catch {
      return null;
    }
  }

  const makeId = (owner: string, repo: string, ref: string, filePath: string) => {
    if (!owner || !repo || !ref) return null;
    if (!filePath || !filePath.toLowerCase().endsWith('.ipynb')) return null;
    return `gh:${owner}/${repo}@${ref}:${filePath}`;
  };

  if (normalizedHost === 'github.com') {
    if (segments.length < 5) return null;
    const [owner, repo, type, ...rest] = segments;
    if (type !== 'blob' && type !== 'raw') return null;
    const match = splitRefAndPath(rest);
    if (!match) return null;
    return makeId(owner, repo, match.ref, match.filePath);
  }

  if (normalizedHost === 'raw.githubusercontent.com') {
    if (segments.length < 4) return null;
    const [owner, repo, ...rest] = segments;
    const match = splitRefAndPath(rest);
    if (!match) return null;
    return makeId(owner, repo, match.ref, match.filePath);
  }

  return null;
}

function splitRefAndPath(segments: string[]): { ref: string; filePath: string } | null {
  if (segments.length < 2) return null;
  for (let i = 1; i < segments.length; i += 1) {
    const ref = segments.slice(0, i).join('/');
    const filePath = segments.slice(i).join('/');
    if (filePath.toLowerCase().endsWith('.ipynb')) {
      return { ref, filePath };
    }
  }
  return null;
}
