import { describe, it, expect } from 'vitest';
import { parseHarmonyPrompt, buildMessagesForProvider } from '../lib/harmony';
import fs from 'fs';
import path from 'path';

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

  it('parses real research.harmony.txt with non-empty sections', () => {
    const file = path.join(process.cwd(), '../prompts/alain-kit/research.harmony.txt');
    const raw = fs.readFileSync(file, 'utf8');
    const { system, developer } = parseHarmonyPrompt(raw);
    expect(system.length).toBeGreaterThan(0);
    expect(developer.length).toBeGreaterThan(0);
  });

  it('parses real research.offline.harmony.txt with non-empty sections', () => {
    const file = path.join(process.cwd(), '../prompts/alain-kit/research.offline.harmony.txt');
    const raw = fs.readFileSync(file, 'utf8');
    const { system, developer } = parseHarmonyPrompt(raw);
    expect(system.length).toBeGreaterThan(0);
    expect(developer.length).toBeGreaterThan(0);
  });
  
  it('parses real design.harmony.txt with non-empty sections', () => {
    const file = path.join(process.cwd(), '../prompts/alain-kit/design.harmony.txt');
    const raw = fs.readFileSync(file, 'utf8');
    const { system, developer } = parseHarmonyPrompt(raw);
    expect(system.length).toBeGreaterThan(0);
    expect(developer.length).toBeGreaterThan(0);
  });

  it('parses real validate.harmony.txt with non-empty sections', () => {
    const file = path.join(process.cwd(), '../prompts/alain-kit/validate.harmony.txt');
    const raw = fs.readFileSync(file, 'utf8');
    const { system, developer } = parseHarmonyPrompt(raw);
    expect(system.length).toBeGreaterThan(0);
    expect(developer.length).toBeGreaterThan(0);
  });
});
