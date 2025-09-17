export type ProviderId = 'poe' | 'openai-compatible';

export interface ProviderCaps {
  id: ProviderId;
  allowResponseFormat: boolean;
  allowTopP: boolean;
}

export function detectProvider(baseUrl?: string): ProviderId {
  const b = (baseUrl || '').toLowerCase();
  if (b.includes('poe.com')) return 'poe';
  return 'openai-compatible';
}

export function capsFor(baseUrl?: string): ProviderCaps {
  const id = detectProvider(baseUrl);
  if (id === 'poe') {
    return { id, allowResponseFormat: false, allowTopP: false };
  }
  const normalized = (baseUrl || '').toLowerCase();
  const allowResponseFormat = /api\.openai\.com|openrouter\.ai/.test(normalized);
  return { id, allowResponseFormat, allowTopP: true };
}

export function normalizeProviderBase(baseUrl?: string): string {
  const fallback = 'https://api.poe.com';
  const raw = (baseUrl && baseUrl.trim() ? baseUrl.trim() : fallback).replace(/\/+$/, '');
  if (raw.endsWith('/v1')) {
    return raw.slice(0, -3);
  }
  return raw || fallback;
}

export function buildChatCompletionsUrl(baseUrl?: string): string {
  const base = normalizeProviderBase(baseUrl);
  return `${base}/v1/chat/completions`;
}
