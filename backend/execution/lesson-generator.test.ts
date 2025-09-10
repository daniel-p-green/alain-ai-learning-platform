import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { extractHFModelInfo } from './lesson-generator';

describe('extractHFModelInfo error propagation', () => {
  const originalFetch = global.fetch as any;

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

