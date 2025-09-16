import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

const runEncoreSuite = process.env.RUN_ENCORE_TESTS === '1';
const describeEncore = runEncoreSuite ? describe : describe.skip;

// Mock Encore API wrapper to avoid requiring real runtime
vi.mock('encore.dev/api', () => {
  class APIError extends Error {
    code: string;
    constructor(message: string, code = 'unknown') { super(message); this.code = code; }
    static invalidArgument(msg: string) { return new APIError(msg, 'invalid_argument'); }
    static failedPrecondition(msg: string) { return new APIError(msg, 'failed_precondition'); }
    static notFound(msg: string) { return new APIError(msg, 'not_found'); }
    static resourceExhausted(msg: string) { return new APIError(msg, 'resource_exhausted'); }
    static deadlineExceeded(msg: string) { return new APIError(msg, 'deadline_exceeded'); }
  }
  return {
    APIError,
    api: (_opts: any, handler: any) => handler,
  };
});

let extractHFModelInfo: any;
describeEncore('generateFromText (happy path)', () => {
  const originalFetch = global.fetch as any;
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns a valid lesson when teacher outputs minimal JSON', async () => {
    vi.doMock('../auth', () => ({ requireUserId: vi.fn().mockResolvedValue('u-1') }));
    const minimal = JSON.stringify({
      title: 'Intro to Harmony Prompting',
      description: 'Learn structured prompting basics.',
      steps: [ { title: 'What is it?', content: 'Harmony-style prompting overview.' } ]
    });
    vi.doMock('./teacher', () => ({ teacherGenerate: vi.fn().mockResolvedValue({ success: true, content: minimal }) }));
    const mod = await import('./lesson-generator');
    const res: any = await (mod.generateFromText as any)({
      textContent: 'Harmony Prompting is a structured prompting approach...',
      difficulty: 'beginner',
      teacherModel: 'GPT-OSS-20B',
      provider: 'poe',
    }, {});
    expect(res.success).toBe(true);
    expect(res.lesson?.title).toContain('Harmony');
    expect(Array.isArray(res.lesson?.steps)).toBe(true);
    expect(res.lesson?.steps.length).toBeGreaterThan(0);
  });
});

describeEncore('extractHFModelInfo error propagation', () => {
  const originalFetch = global.fetch as any;

  beforeAll(async () => {
    ({ extractHFModelInfo } = await import('./lesson-generator'));
  });

  beforeEach(() => {
    vi.resetAllMocks();
    delete (process.env as any).OFFLINE_MODE;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws with status on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    await expect(extractHFModelInfo('https://huggingface.co/openai/clip')).rejects.toMatchObject({ message: expect.stringContaining('404') });
  });

  it('throws with status on 429', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    await expect(extractHFModelInfo('https://huggingface.co/openai/clip')).rejects.toMatchObject({ message: expect.stringContaining('429') });
  });

  it('throws 408 on timeout/abort', async () => {
    const abortErr: any = new Error('Aborted');
    abortErr.name = 'AbortError';
    global.fetch = vi.fn().mockRejectedValue(abortErr);
    await expect(extractHFModelInfo('https://huggingface.co/openai/clip')).rejects.toMatchObject({ message: expect.stringContaining('timeout') });
  });
});
