import { describe, it, expect } from 'vitest';
import { GenerateSuccessSchema, ProvidersResponseSchema, ExportNotebookSchema, HFModelInfoSchema } from '../lib/schemas';

describe('schemas', () => {
  it('validates Generate success envelope', () => {
    const sample = {
      success: true,
      tutorialId: '123',
      meta: { repaired: false },
      preview: { title: 'Demo', description: 'x', learning_objectives: [] },
    };
    const r = GenerateSuccessSchema.safeParse(sample);
    expect(r.success).toBe(true);
  });

  it('validates Providers response', () => {
    const sample = { providers: [{ name: 'poe', models: ['claude-3'] }], defaultProvider: 'poe' };
    const r = ProvidersResponseSchema.safeParse(sample);
    expect(r.success).toBe(true);
    expect(r.success && r.data.providers.length).toBe(1);
  });

  it('validates Export notebook', () => {
    const sample = { nbformat: 4, nbformat_minor: 5, cells: [], metadata: {} };
    const r = ExportNotebookSchema.safeParse(sample);
    expect(r.success).toBe(true);
  });

  it('validates HF model info', () => {
    const sample = { license: 'apache-2.0', tags: ['text-generation'], downloads: 12345 };
    const r = HFModelInfoSchema.safeParse(sample);
    expect(r.success).toBe(true);
  });
});
