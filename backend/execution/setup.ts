import { api } from "encore.dev/api";
import { applyRuntimeEnv, isOffline } from "../config/env";

type ProbeResponse = {
  offlineMode: boolean;
  teacherProvider: string;
  openaiBaseUrl?: string | null;
  ollamaDetected: boolean;
  poeConfigured: boolean;
};

export const probe = api<{}, ProbeResponse>(
  { expose: true, method: "GET", path: "/setup/probe" },
  async () => {
    const offlineMode = isOffline();
    const teacherProvider = process.env.TEACHER_PROVIDER || 'poe';
    const openaiBaseUrl = process.env.OPENAI_BASE_URL || null;
    const poeConfigured = !!process.env.POE_API_KEY;

    // Probe local Ollama quickly
    const target = 'http://localhost:11434/v1/models';
    let ollamaDetected = false;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1200);
      const resp = await fetch(target, { method: 'GET', signal: ctrl.signal });
      clearTimeout(t);
      if (resp.ok) {
        try {
          const json = await resp.json();
          // OpenAI-compatible shape: { data: [...] }
          ollamaDetected = Array.isArray((json as any)?.data);
        } catch {
          ollamaDetected = false;
        }
      } else {
        ollamaDetected = false;
      }
    } catch {
      ollamaDetected = false;
    }

    return { offlineMode, teacherProvider, openaiBaseUrl, ollamaDetected, poeConfigured };
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
  const offlineMode = isOffline();
  const teacherProvider = process.env.TEACHER_PROVIDER || 'poe';
  const openaiBaseUrl = process.env.OPENAI_BASE_URL || null;
  const poeConfigured = !!process.env.POE_API_KEY;
  let ollamaDetected = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 800);
    const resp = await fetch('http://localhost:11434/v1/models', { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    if (resp.ok) {
      try {
        const json = await resp.json();
        ollamaDetected = Array.isArray((json as any)?.data);
      } catch {
        ollamaDetected = false;
      }
    }
  } catch {}
  return { offlineMode, teacherProvider, openaiBaseUrl, ollamaDetected, poeConfigured };
}
