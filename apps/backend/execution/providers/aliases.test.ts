import { describe, it, expect } from 'vitest';
import { mapModelForProvider } from './aliases';

describe('mapModelForProvider', () => {
  it('maps GPT-OSS-20B correctly for Poe', () => {
    expect(mapModelForProvider('poe', 'GPT-OSS-20B')).toBe('GPT-OSS-20B');
    expect(mapModelForProvider('poe', 'gpt-oss-20b')).toBe('GPT-OSS-20B');
  });
  it('maps GPT-OSS-20B to ollama checkpoint for OpenAI-compatible', () => {
    expect(mapModelForProvider('openai-compatible', 'GPT-OSS-20B')).toBe('gpt-oss:20b');
    expect(mapModelForProvider('openai-compatible', 'gpt-oss-20b')).toBe('gpt-oss:20b');
  });
  it('passes through unknown models', () => {
    expect(mapModelForProvider('poe', 'unknown-model')).toBe('unknown-model');
    expect(mapModelForProvider('openai-compatible', 'unknown-model')).toBe('unknown-model');
  });
});

