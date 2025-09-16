import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

const runEncoreSuite = process.env.RUN_ENCORE_TESTS === '1';
const describeEncore = runEncoreSuite ? describe : describe.skip;

// Mock Encore API wrapper to directly expose handlers
vi.mock('encore.dev/api', () => {
  class APIError extends Error {
    code: string;
    constructor(message: string, code = 'unknown') { super(message); this.code = code; }
    static invalidArgument(msg: string) { return new APIError(msg, 'invalid_argument'); }
    static failedPrecondition(msg: string) { return new APIError(msg, 'failed_precondition'); }
    static unauthenticated(msg: string) { return new APIError(msg, 'unauthenticated'); }
    static notFound(msg: string) { return new APIError(msg, 'not_found'); }
    static resourceExhausted(msg: string) { return new APIError(msg, 'resource_exhausted'); }
    static deadlineExceeded(msg: string) { return new APIError(msg, 'deadline_exceeded'); }
  }
  return {
    APIError,
    api: (_opts: any, handler: any) => handler,
  };
});

// Mock Encore secrets provider to return dummy values
vi.mock('encore.dev/config', () => {
  return {
    secret: (_name: string) => () => 'test-secret-value',
  };
});

let teacherGenerate: any;

describeEncore('teacherGenerate', () => {
  beforeAll(async () => {
    ({ teacherGenerate } = await import('./teacher'));
  });
  const originalFetch = global.fetch as any;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.TEACHER_ENABLE_TOOLS = '1';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('extracts tool function arguments when tool_calls are present', async () => {
    // Mock provider response with a function tool call
    const payload = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                type: 'function',
                function: {
                  name: 'emit_lesson',
                  arguments: '{"title":"T","description":"D","steps":[]}',
                },
              },
            ],
          },
        },
      ],
    };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const resp = await teacherGenerate({
      model: 'GPT-OSS-20B',
      messages: [{ role: 'user', content: 'Generate lesson' }],
      task: 'lesson_generation',
      provider: 'openai-compatible',
    } as any);

    expect(resp.success).toBe(true);
    // Should surface the function arguments directly as the content
    expect(resp.content).toContain('"title":"T"');
    expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0);
  });

  it('retries once on transient error and succeeds', async () => {
    const first = new Response('temporary failure', { status: 500 });
    const second = new Response(JSON.stringify({
      choices: [{ message: { content: 'OK after retry' } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    global.fetch = mockFetch as any;

    const start = Date.now();
    const resp = await teacherGenerate({
      model: 'GPT-OSS-20B',
      messages: [{ role: 'user', content: 'Hi' }],
      task: 'lesson_generation',
      provider: 'openai-compatible',
    } as any);
    const elapsed = Date.now() - start;

    expect(resp.success).toBe(true);
    expect(resp.content).toBe('OK after retry');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Backoff is 300ms before second attempt; allow some leeway
    expect(elapsed).toBeGreaterThanOrEqual(280);
  });

  it('guards non-JSON content and retries once when enabled', async () => {
    process.env.TEACHER_JSON_RETRY = '1';
    // First response returns non-JSON content; second returns JSON string
    const first = new Response(JSON.stringify({
      choices: [{ message: { content: 'not json here' } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const second = new Response(JSON.stringify({
      choices: [{ message: { content: '{"title":"Okay","description":"D","steps":[]}' } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    global.fetch = mockFetch as any;

    const resp = await teacherGenerate({
      model: 'GPT-OSS-20B',
      messages: [{ role: 'user', content: 'Hi' }],
      task: 'lesson_generation',
      provider: 'openai-compatible',
    } as any);

    expect(resp.success).toBe(true);
    expect(resp.content).toContain('"title":"Okay"');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
