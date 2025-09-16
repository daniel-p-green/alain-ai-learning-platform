import { describe, it, expect, vi, beforeAll } from 'vitest';

const runEncoreSuite = process.env.RUN_ENCORE_TESTS === '1';
const describeEncore = runEncoreSuite ? describe : describe.skip;

// Mock Encore APIs
vi.mock('encore.dev/api', () => {
  class APIError extends Error {
    code: string;
    constructor(message: string, code = 'unknown') { super(message); this.code = code; }
    static invalidArgument(msg: string) { return new APIError(msg, 'invalid_argument'); }
    static resourceExhausted(msg: string) { return new APIError(msg, 'resource_exhausted'); }
    static internal(msg: string) { return new APIError(msg, 'internal'); }
  }
  return { APIError, api: (_opts: any, handler: any) => handler };
});

// Mock auth/env
vi.mock('../auth', () => ({ requireUserId: async () => 'test-user' }));
vi.mock('../config/env', () => ({ validateBackendEnv: () => {} }));

// Mock teacherGenerate to avoid real LLM calls
vi.mock('./teacher', () => ({
  teacherGenerate: async () => ({ success: true, content: 'Adapted content here' })
}));

let adaptContent: any;

describeEncore('adaptContent', () => {
  beforeAll(async () => {
    ({ adaptContent } = await import('./adapt'));
  });
  it('adapts content with valid input', async () => {
    const resp = await adaptContent({
      current_content: 'Original step content',
      user_performance: 50,
      target_difficulty: 'beginner',
      provider: 'poe',
    } as any);
    expect(resp.success).toBe(true);
    expect(resp.adapted).toBeTruthy();
  });

  it('rejects invalid performance score', async () => {
    const resp = await adaptContent({
      current_content: 'x',
      user_performance: 500,
      target_difficulty: 'beginner',
    } as any);
    expect(resp.success).toBe(false);
    expect(resp.error?.message).toBeTruthy();
  });
});
