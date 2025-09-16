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
  return { id, allowResponseFormat: true, allowTopP: true };
}

