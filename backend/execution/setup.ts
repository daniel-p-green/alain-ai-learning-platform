import { api } from "encore.dev/api";
import { applyRuntimeEnv } from "../config/env";

type ProbeResponse = {
  offlineMode: boolean;
  teacherProvider: string;
  openaiBaseUrl?: string | null;
  ollamaDetected: boolean;
  lmStudioDetected: boolean;
  poeConfigured: boolean;
  availableModels?: string[];
};

export const probe = api<{}, ProbeResponse>(
  { expose: true, method: "GET", path: "/setup/probe" },
  async () => {
    const offlineMode = ((process.env.OFFLINE_MODE || '').toLowerCase() === '1' || (process.env.OFFLINE_MODE || '').toLowerCase() === 'true');
    const teacherProvider = process.env.TEACHER_PROVIDER || 'poe';
    const openaiBaseUrl = process.env.OPENAI_BASE_URL || null;
    const poeConfigured = !!process.env.POE_API_KEY;

    // Probe local Ollama and LM Studio quickly
    let ollamaDetected = false;
    let lmStudioDetected = false;
    const availableModels: string[] = [];
    const basesToProbe: string[] = [];
    const baseEnv = process.env.OPENAI_BASE_URL || '';
    if (baseEnv) basesToProbe.push(baseEnv);
    // Add local defaults if not provided or to complement
    if (!basesToProbe.some(b => /11434/.test(b))) basesToProbe.push('http://localhost:11434/v1');
    if (!basesToProbe.some(b => /1234\b/.test(b))) basesToProbe.push('http://localhost:1234/v1');
    for (const base of basesToProbe) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 1000);
        const resp = await fetch(base.replace(/\/$/, '') + '/models', { method: 'GET', signal: ctrl.signal });
        clearTimeout(t);
        if (resp.ok) {
          const data: any = await resp.json().catch(() => ({}));
          const ids = Array.isArray(data?.data) ? data.data.map((m: any) => m?.id).filter((x: any) => typeof x === 'string') : [];
          for (const id of ids) if (!availableModels.includes(id)) availableModels.push(id);
          if (/11434/.test(base)) ollamaDetected = true;
          if (/1234\b/.test(base)) lmStudioDetected = true;
        }
      } catch {}
    }

    return { offlineMode, teacherProvider, openaiBaseUrl, ollamaDetected, lmStudioDetected, poeConfigured, availableModels };
  }
);

export const switchMode = api<{ mode: 'offline' | 'hosted'; baseUrl?: string; apiKey?: string }, { success: boolean; message?: string; config: ProbeResponse }>(
  { expose: true, method: "POST", path: "/setup/switch" },
  async ({ mode, baseUrl, apiKey }) => {
    if (mode === 'offline') {
      const url = baseUrl || 'http://localhost:11434/v1';
      const key = apiKey || 'ollama';
      applyRuntimeEnv({
        OFFLINE_MODE: '1',
        TEACHER_PROVIDER: 'openai-compatible',
        OPENAI_BASE_URL: url,
        OPENAI_API_KEY: key,
      });
    } else if (mode === 'hosted') {
      applyRuntimeEnv({
        OFFLINE_MODE: '0',
        TEACHER_PROVIDER: 'poe',
      });
    } else {
      return { success: false, message: `Unknown mode: ${mode}`, config: await currentConfig() };
    }
    return { success: true, config: await currentConfig() };
  }
);

async function currentConfig(): Promise<ProbeResponse> {
  const offlineMode = ((process.env.OFFLINE_MODE || '').toLowerCase() === '1' || (process.env.OFFLINE_MODE || '').toLowerCase() === 'true');
  const teacherProvider = process.env.TEACHER_PROVIDER || 'poe';
  const openaiBaseUrl = process.env.OPENAI_BASE_URL || null;
  const poeConfigured = !!process.env.POE_API_KEY;
  let ollamaDetected = false;
  let lmStudioDetected = false;
  const availableModels: string[] = [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 800);
    const resp = await fetch('http://localhost:11434/v1/models', { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    ollamaDetected = resp.ok;
  } catch {}
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 800);
    const resp = await fetch('http://localhost:1234/v1/models', { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    lmStudioDetected = resp.ok;
  } catch {}
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 800);
    const resp = await fetch('http://localhost:1234/v1/models', { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    lmStudioDetected = resp.ok;
    if (resp.ok) {
      const data: any = await resp.json().catch(() => ({}));
      const ids = Array.isArray(data?.data) ? data.data.map((m: any) => m?.id).filter((x: any) => typeof x === 'string') : [];
      for (const id of ids) if (!availableModels.includes(id)) availableModels.push(id);
    }
  } catch {}
  return { offlineMode, teacherProvider, openaiBaseUrl, ollamaDetected, lmStudioDetected, poeConfigured, availableModels };
}
