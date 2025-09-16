import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseGhId, buildRawUrl, fetchPublicNotebook } from '../lib/githubRaw';

describe('githubRaw helpers', () => {
  it('parses gh ids with ref', () => {
    const p = parseGhId('gh:owner/repo@dev:path/to/file.ipynb');
    expect(p).toEqual({ owner: 'owner', repo: 'repo', ref: 'dev', path: 'path/to/file.ipynb' });
  });

  it('parses gh ids without ref', () => {
    const p = parseGhId('gh:owner/repo:path/to/file.ipynb');
    expect(p).toEqual({ owner: 'owner', repo: 'repo', ref: 'main', path: 'path/to/file.ipynb' });
  });

  it('rejects unsafe ids', () => {
    expect(parseGhId('gh:owner/repo@main:../secret.ipynb')).toBeNull();
    expect(parseGhId('gh:owner/repo@main:/abs.ipynb')).toBeNull();
  });

  it('builds raw url', () => {
    const p = { owner: 'o', repo: 'r', ref: 'main', path: 'nb.ipynb' } as const;
    expect(buildRawUrl(p)).toBe('https://raw.githubusercontent.com/o/r/main/nb.ipynb');
  });
});

describe('fetchPublicNotebook', () => {
  const NB = { nbformat: 4, nbformat_minor: 5, metadata: { title: 'T' }, cells: [] };
  const textJson = JSON.stringify(NB);
  const originalFetch = global.fetch;

  beforeEach(() => {
    if (typeof vi.resetAllMocks === 'function') {
      vi.resetAllMocks();
    } else {
      vi.restoreAllMocks();
      vi.clearAllMocks();
    }
    // ensure previous stubs do not leak between tests
    // @ts-ignore
    global.fetch = originalFetch;
  });

  afterEach(() => {
    // @ts-ignore
    global.fetch = originalFetch;
  });

  it('fetches and parses notebook', async () => {
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => textJson });
    const { nb, meta } = await fetchPublicNotebook({ owner: 'o', repo: 'r', ref: 'm', path: 'nb.ipynb' }, 1024);
    expect(nb.nbformat).toBe(4);
    expect(meta.title).toBe('T');
    expect(meta.id).toBe('gh:o/r@m:nb.ipynb');
  });

  it('rejects large files', async () => {
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => 'x'.repeat(2048) });
    await expect(fetchPublicNotebook({ owner: 'o', repo: 'r', ref: 'm', path: 'nb.ipynb' }, 1024)).rejects.toThrow('file_too_large');
  });

  it('rejects invalid JSON', async () => {
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => 'not-json' });
    await expect(fetchPublicNotebook({ owner: 'o', repo: 'r', ref: 'm', path: 'nb.ipynb' })).rejects.toThrow('invalid_notebook');
  });
});
