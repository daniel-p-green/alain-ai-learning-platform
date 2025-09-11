import { api } from "encore.dev/api";

type ModelsResponse = {
  provider: 'lm-studio' | 'ollama' | 'openai-compatible' | 'unknown';
  baseUrl: string | null;
  models: string[];
  cached?: boolean;
};

type ModelInfoResponse = {
  id: string;
  family: string | null;
  maker: string | null;
  contextWindow?: number | null;
  toolUse: 'native' | 'default' | 'unknown';
  notes?: string;
};

let cache: { ts: number; data: ModelsResponse } | null = null;
const CACHE_MS = 60_000; // 60s cache

function classifyProvider(base: string): ModelsResponse['provider'] {
  const b = base.toLowerCase();
  if (b.includes('localhost:1234')) return 'lm-studio';
  if (b.includes('localhost:11434')) return 'ollama';
  return 'openai-compatible';
}

async function fetchModels(base: string): Promise<string[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const resp = await fetch(base.replace(/\/$/, '') + '/models', { signal: ctrl.signal });
    clearTimeout(t);
    if (!resp.ok) return [];
    const data: any = await resp.json().catch(() => ({}));
    const ids = Array.isArray(data?.data) ? data.data.map((m: any) => m?.id).filter((x: any) => typeof x === 'string') : [];
    return ids;
  } catch {
    clearTimeout(t);
    return [];
  }
}

export const listProviderModels = api<{}, ModelsResponse>(
  { expose: true, method: 'GET', path: '/providers/models' },
  async () => {
    const now = Date.now();
    if (cache && now - cache.ts < CACHE_MS) {
      return { ...cache.data, cached: true };
    }

    const candidates: string[] = [];
    const envBase = (process.env.OPENAI_BASE_URL || '').trim();
    if (envBase) candidates.push(envBase);
    if (!candidates.some(b => /11434/.test(b))) candidates.push('http://localhost:11434/v1');
    if (!candidates.some(b => /1234\b/.test(b))) candidates.push('http://localhost:1234/v1');

    for (const base of candidates) {
      const models = await fetchModels(base);
      if (models.length > 0) {
        const out: ModelsResponse = { provider: classifyProvider(base), baseUrl: base, models };
        cache = { ts: now, data: out };
        return out;
      }
    }

    const out: ModelsResponse = { provider: 'unknown', baseUrl: envBase || null, models: [] };
    cache = { ts: now, data: out };
    return out;
  }
);

export function inferModelInfo(id: string): ModelInfoResponse {
  const lid = id.toLowerCase();
  const info: ModelInfoResponse = { id, family: null, maker: null, contextWindow: null, toolUse: 'unknown' };
  if (lid.includes('qwen')) {
    info.family = 'Qwen';
    info.maker = 'Alibaba Cloud';
    info.toolUse = 'native';
    info.notes = 'Qwen Instruct models have strong tool use support in LM Studio.';
  } else if (lid.includes('llama') || lid.includes('meta-llama')) {
    info.family = 'Llama';
    info.maker = 'Meta';
    info.toolUse = 'native';
    info.notes = 'Llama 3.1/3.2 Instruct variants support tool use in LM Studio.';
  } else if (lid.includes('mistral') || lid.includes('ministral')) {
    info.family = 'Mistral';
    info.maker = 'Mistral AI';
    info.toolUse = 'default';
    info.notes = 'Usually works with LM Studio default tool format.';
  } else if (lid.includes('qwen2.5')) {
    info.family = 'Qwen';
    info.maker = 'Alibaba Cloud';
    info.toolUse = 'native';
  }
  return info;
}

export const getModelInfo = api<{ id: string }, ModelInfoResponse>(
  { expose: true, method: 'GET', path: '/providers/models/:id/info' },
  async ({ id }) => {
    if (!id || !id.trim()) return { id, family: null, maker: null, contextWindow: null, toolUse: 'unknown' };
    return inferModelInfo(id.trim());
  }
);
