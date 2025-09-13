import { describe, it, expect } from 'vitest';
import { parseHarmonyPrompt, buildMessagesForProvider } from '../lib/harmony';

const SAMPLE = `<|start|>system<|message|>You are ChatGPT.<|end|><|start|>developer<|message|>Follow ALAIN rules.<|end|>`;

describe('harmony helpers', () => {
  it('parses system and developer bodies', () => {
    const { system, developer } = parseHarmonyPrompt(SAMPLE);
    expect(system).toContain('You are ChatGPT');
    expect(developer).toContain('ALAIN');
  });

  it('builds messages for openai-compatible', () => {
    const sections = parseHarmonyPrompt(SAMPLE);
    const msgs = buildMessagesForProvider('openai-compatible', sections, [{ role: 'user', content: 'Hi' }]);
    expect(msgs[0].role).toBe('system');
    expect((msgs[1] as any).role).toBe('developer');
    expect(msgs[2].role).toBe('user');
  });

  it('builds messages for poe (fold developer into system)', () => {
    const sections = parseHarmonyPrompt(SAMPLE);
    const msgs = buildMessagesForProvider('poe', sections, [{ role: 'user', content: 'Hi' }]);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toMatch(/Follow ALAIN rules/);
    expect(msgs[1].role).toBe('user');
  });
});
