export type ProviderId = 'poe' | 'openai-compatible';

// Map canonical model names to provider-specific identifiers
// Canonical accepts both lower/upper variants.
const ALIASES: Record<ProviderId, Record<string, string>> = {
  poe: {
    'gpt-oss-20b': 'GPT-OSS-20B',
    'gpt-oss-120b': 'GPT-OSS-120B',
    // Common OpenAI model aliases used on Poe
    'gpt-4-turbo': 'gpt-4-turbo',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o-mini',
    'claude-3.5-sonnet': 'claude-3.5-sonnet',
    'claude-3-haiku': 'claude-3-haiku',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'grok-2': 'grok-2',
    'llama-3.1-405b': 'llama-3.1-405b',
  },
  'openai-compatible': {
    // Ollama/vLLM style checkpoints
    'gpt-oss-20b': 'gpt-oss:20b',
    'gpt-oss-120b': 'gpt-oss:120b',
    // passthrough for typical OpenAI models (keep as-is when present)
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
  },
};

export function mapModelForProvider(provider: ProviderId, model: string): string {
  if (!model) return model;
  const key = model.toLowerCase();
  const exact = ALIASES[provider][key];
  return exact || model;
}
