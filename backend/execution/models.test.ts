import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Encore API wrapper to directly expose handlers
vi.mock('encore.dev/api', () => {
  class APIError extends Error {
    code: string;
    constructor(message: string, code = 'unknown') { super(message); this.code = code; }
    static invalidArgument(msg: string) { return new APIError(msg, 'invalid_argument'); }
  }
  return {
    APIError,
    api: (_opts: any, handler: any) => handler,
  };
});

import { inferModelInfo, listProviderModels } from './models';

describe('inferModelInfo', () => {
  it('classifies Qwen correctly', () => {
    const info = inferModelInfo('lmstudio-community/Qwen2.5-7B-Instruct-GGUF');
    expect(info.family).toBe('Qwen');
    expect(info.maker).toBe('Alibaba Cloud');
    expect(info.toolUse).toBe('native');
  });
  it('classifies Llama correctly', () => {
    const info = inferModelInfo('meta-llama/Meta-Llama-3.1-8B-Instruct');
    expect(info.family).toBe('Llama');
    expect(info.maker).toBe('Meta');
    expect(info.toolUse).toBe('native');
  });
  it('classifies Mistral correctly', () => {
    const info = inferModelInfo('mistralai/Mistral-7B-Instruct-v0.3');
    expect(info.family).toBe('Mistral');
    expect(info.maker).toBe('Mistral AI');
    expect(info.toolUse).toBe('default');
  });
  it('returns unknown for unrecognized ids', () => {
    const info = inferModelInfo('unknown/model');
    expect(info.family).toBeNull();
    expect(info.toolUse).toBe('unknown');
  });
});

describe('listProviderModels (minimal)', () => {
  const origFetch = global.fetch as any;
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    global.fetch = origFetch;
    delete process.env.OPENAI_BASE_URL;
  });

  it('returns models from local Ollama when available', async () => {
    process.env.OPENAI_BASE_URL = 'http://localhost:11434/v1';
    const resp = new Response(JSON.stringify({ data: [{ id: 'llama-3' }, { id: 'gpt-oss:20b' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const mockFetch = vi.fn().mockResolvedValue(resp);
    global.fetch = mockFetch as any;

    const out = await (listProviderModels as any)({});
    expect(out.provider).toBe('ollama');
    expect(Array.isArray(out.models)).toBe(true);
    expect(out.models).toContain('llama-3');
  });

  it('falls back to LM Studio when Ollama is down', async () => {
    // No OPENAI_BASE_URL to force probing both defaults
    delete process.env.OPENAI_BASE_URL;
    const seq: Array<Response> = [
      // First probe (Ollama): down
      new Response(null, { status: 500 }),
      // Second probe (LM Studio): ok
      new Response(JSON.stringify({ data: [{ id: 'qwen2.5-7b-instruct' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    ];
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(seq[0])
      .mockResolvedValueOnce(seq[1]);
    global.fetch = mockFetch as any;

    const out = await (listProviderModels as any)({});
    expect(out.provider).toBe('lm-studio');
    expect(out.models).toContain('qwen2.5-7b-instruct');
  });

  it('returns unknown when no local providers respond', async () => {
    delete process.env.OPENAI_BASE_URL;
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    global.fetch = mockFetch as any;
    const out = await (listProviderModels as any)({});
    expect(out.provider).toBe('unknown');
    expect(Array.isArray(out.models)).toBe(true);
  });
});
