import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveTeacherProvider } from './teacher';

describe('resolveTeacherProvider', () => {
  it('routes GPT-OSS-120B to Poe when local is requested and Poe is available', () => {
    const out = resolveTeacherProvider('openai-compatible', 'GPT-OSS-120B', true);
    expect(out).toBe('poe');
  });

  it('throws when GPT-OSS-120B is requested locally and Poe is unavailable', () => {
    expect(() => resolveTeacherProvider('openai-compatible', 'GPT-OSS-120B', false)).toThrow();
  });

  it('keeps requested provider for GPT-OSS-20B', () => {
    expect(resolveTeacherProvider('openai-compatible', 'GPT-OSS-20B', false)).toBe('openai-compatible');
    expect(resolveTeacherProvider('poe', 'GPT-OSS-20B', true)).toBe('poe');
  });
});
