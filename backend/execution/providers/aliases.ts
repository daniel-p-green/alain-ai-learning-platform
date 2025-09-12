export type ProviderId = 'poe' | 'openai-compatible';

// Map canonical model names to provider-specific identifiers
// Canonical accepts both lower/upper variants.
const ALIASES: Record<ProviderId, Record<string, string>> = {
  poe: {
    'gpt-oss-20b': 'GPT-OSS-20B',
    'gpt-oss-120b': 'GPT-OSS-120B',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o-mini',
    'claude-3.5-sonnet': 'Claude-Sonnet-4',
    'claude-3-haiku': 'Claude-3-Haiku',
    'gemini-1.5-pro': 'Gemini-2.5-Pro',
    'gemini-1.5-flash': 'Gemini-1.5-Flash',
    'grok-2': 'Grok-4',
    'llama-3.1-405b': 'Llama-3.1-405B',
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

