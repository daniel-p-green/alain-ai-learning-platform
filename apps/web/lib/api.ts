import { z } from 'zod';
import {
  ProvidersResponseSchema,
  GenerateSuccessSchema,
  GenerateErrorEnvelope,
  ExportNotebookSchema,
  type ProvidersResponse,
  type GenerateSuccess,
  type ExportNotebook,
} from './schemas';

export class APIClientError extends Error {
  details?: string[];
  status?: number;
  constructor(message: string, opts?: { details?: string[]; status?: number }) {
    super(message);
    this.name = 'APIClientError';
    this.details = opts?.details;
    this.status = opts?.status;
  }
}

async function parseJson<T extends z.ZodTypeAny>(resp: Response, schema: T): Promise<z.infer<T>> {
  const ct = resp.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const body = isJson ? await resp.json().catch(() => ({})) : await resp.text();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new APIClientError('Invalid response format', { status: resp.status });
  }
  return parsed.data as any;
}

export const api = {
  async providers(): Promise<ProvidersResponse> {
    const r = await fetch('/api/providers');
    if (!r.ok) throw new APIClientError(`HTTP ${r.status}`);
    return parseJson(r, ProvidersResponseSchema);
  },

  async exportColabLocal(id: string): Promise<ExportNotebook> {
    const r = await fetch(`/api/export/colab/local/${id}`);
    if (!r.ok) throw new APIClientError(`HTTP ${r.status}`);
    return parseJson(r, ExportNotebookSchema);
  },

  async exportColabBackend(id: string, backendUrl: (p: string) => string): Promise<ExportNotebook> {
    const r = await fetch(backendUrl(`/export/colab/${id}`));
    if (!r.ok) throw new APIClientError(`HTTP ${r.status}`);
    return parseJson(r, ExportNotebookSchema);
  },

  async parseGenerateResponse(r: Response): Promise<GenerateSuccess> {
    const ct = r.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    let data: any = isJson ? await r.json().catch(() => ({})) : await r.text();
    // If got a string, try to parse as JSON
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch {}
    }
    // Accept success envelope or map error envelope to exception
    const success = GenerateSuccessSchema.safeParse(data);
    if (success.success) return success.data;
    // Fallback: some endpoints may return a minimal success payload
    if (data && typeof data === 'object' && 'tutorialId' in data && !('error' in data)) {
      return { success: true, tutorialId: (data as any).tutorialId, meta: (data as any).meta, preview: (data as any).preview } as any;
    }
    const err = GenerateErrorEnvelope.safeParse(data);
    if (err.success) {
      throw new APIClientError(err.data.error.message, { details: err.data.error.details, status: r.status });
    }
    if (r.ok && data && typeof data === 'object') {
      return { success: true, tutorialId: (data as any).tutorialId, meta: (data as any).meta, preview: (data as any).preview } as any;
    }
    throw new APIClientError(`Unexpected response (HTTP ${r.status})`);
  },

  async hfModelInfo(repo: string): Promise<import('./schemas').HFModelInfo> {
    const u = new URL('/api/hf/model', window.location.origin);
    u.searchParams.set('repo', repo);
    const r = await fetch(u.toString(), { cache: 'no-store' });
    if (!r.ok) throw new APIClientError(`HTTP ${r.status}`);
    return parseJson(r, (await import('./schemas')).HFModelInfoSchema);
  },
};

export default api;

// Utilities
export function parseHfRef(input: string): { ok: boolean; repo?: string } {
  const t = input.trim();
  if (!t) return { ok: false };
  // URL form
  try {
    const u = new URL(t);
    if (/huggingface\.co$/.test(u.hostname)) {
      const parts = u.pathname.replace(/^\//, '').split('/');
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return { ok: true, repo: `${parts[0]}/${parts[1]}` };
      }
    }
  } catch {}
  // owner/repo form
  if (/^[^\s\/]+\/[A-Za-z0-9._\-]+$/.test(t)) return { ok: true, repo: t };
  return { ok: false };
}
