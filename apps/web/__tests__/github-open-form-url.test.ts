import { describe, it, expect } from 'vitest';
import { toGhId } from '../lib/githubNotebook';
import { parseGhId } from '../lib/githubRaw';

describe('toGhId helper', () => {
  it('passes through gh ids', () => {
    const id = 'gh:owner/repo@main:path/notebook.ipynb';
    expect(toGhId(id)).toBe(id);
  });

  it('parses GitHub blob URLs', () => {
    const id = toGhId('https://github.com/owner/repo/blob/main/dir/notebook.ipynb');
    expect(id).toBe('gh:owner/repo@main:dir/notebook.ipynb');
    expect(parseGhId(id!)).not.toBeNull();
  });

  it('parses GitHub raw URLs', () => {
    const id = toGhId('https://github.com/owner/repo/raw/main/notebook.ipynb');
    expect(id).toBe('gh:owner/repo@main:notebook.ipynb');
    expect(parseGhId(id!)).not.toBeNull();
  });

  it('parses raw.githubusercontent.com URLs', () => {
    const id = toGhId('https://raw.githubusercontent.com/owner/repo/main/some/Notebook.IPYNB');
    expect(id).toBe('gh:owner/repo@main:some/Notebook.IPYNB');
    expect(parseGhId(id!)).not.toBeNull();
  });

  it('supports branch segments with slashes', () => {
    const id = toGhId('https://github.com/owner/repo/blob/feature/foo/path/notebook.ipynb');
    expect(id).toBe('gh:owner/repo@feature:foo/path/notebook.ipynb');
    expect(parseGhId(id!)).not.toBeNull();
  });

  it('rejects non-notebook URLs', () => {
    expect(toGhId('https://github.com/owner/repo/blob/main/README.md')).toBeNull();
  });
});
