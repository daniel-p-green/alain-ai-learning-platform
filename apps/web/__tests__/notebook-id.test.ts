import { describe, it, expect } from 'vitest';
import { encodeNotebookId, decodeNotebookParam } from '../lib/notebookId';

describe('notebook id helpers', () => {
  it('encodes notebook IDs with reserved characters', () => {
    expect(encodeNotebookId('gh:owner/repo@main:path/to/file.ipynb')).toBe('gh%3Aowner%2Frepo%40main%3Apath%2Fto%2Ffile.ipynb');
  });

  it('decodes notebook route params', () => {
    const encoded = 'gh%3Aowner%2Frepo%40main%3Apath%2Ffile.ipynb';
    expect(decodeNotebookParam(encoded)).toBe('gh:owner/repo@main:path/file.ipynb');
  });

  it('returns original string when decode fails', () => {
    const raw = '%E0%A4%A';
    expect(decodeNotebookParam(raw)).toBe(raw);
  });
});
