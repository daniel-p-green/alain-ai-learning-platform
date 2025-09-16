import { describe, it, expect, vi } from 'vitest';

// Mock Encore APIs
vi.mock('encore.dev/api', () => {
  class APIError extends Error {
    code: string;
    constructor(message: string, code = 'unknown') { super(message); this.code = code; }
    static invalidArgument(msg: string) { return new APIError(msg, 'invalid_argument'); }
  }
  return { APIError, api: (_opts: any, handler: any) => handler };
});

// Mock teacherGenerate to avoid real LLM calls
vi.mock('./teacher', () => ({
  teacherGenerate: async () => ({
    success: true,
    content: '{"title":"X","description":"Y","steps":[{"step_order":1,"title":"s","content":"c"}]}'
  })
}));

// Import after mocks
import { repairLesson } from './repair';

describe('repairLesson HF URL parsing (centralized)', () => {
  it('accepts full huggingface URL', async () => {
    const resp = await repairLesson({
      hfUrl: 'https://huggingface.co/meta-llama/Llama-3.1-8B',
      difficulty: 'beginner',
    } as any);
    expect(resp.success).toBe(true);
    expect(resp.error).toBeUndefined();
  });

  it('accepts owner/repo shorthand', async () => {
    const resp = await repairLesson({
      hfUrl: 'meta-llama/Llama-3.1-8B',
      difficulty: 'beginner',
    } as any);
    expect(resp.success).toBe(true);
  });

  it('rejects non-HF hosts', async () => {
    await expect(repairLesson({
      hfUrl: 'https://example.com/x/y',
      difficulty: 'beginner',
    } as any)).rejects.toThrow(/Invalid Hugging Face URL format/);
  });
});
