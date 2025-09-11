"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_SETTINGS, LS, ProviderConfig, ProviderId, Settings } from "./types";

// Namespaced persistence helpers
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
}

// Public helpers for import/export
export function exportSettings(): Settings {
  const providers = readJSON<ProviderConfig[]>(LS.providers, DEFAULT_SETTINGS.providers);
  const models = readJSON<any>(LS.models, DEFAULT_SETTINGS.models);
  const theme = (typeof window !== "undefined" ? window.localStorage.getItem(LS.uiTheme) : null) || DEFAULT_SETTINGS.ui.theme;
  return { providers, models, ui: { theme } } as Settings;
}

export function importSettings(json: Settings) {
  writeJSON(LS.providers, json.providers || DEFAULT_SETTINGS.providers);
  writeJSON(LS.models, json.models || DEFAULT_SETTINGS.models);
  if (json.ui?.theme) window.localStorage.setItem(LS.uiTheme, json.ui.theme);
  console.info("alain.settings.saved");
}

export function useSettings() {
  const [providers, setProviders] = useState<ProviderConfig[]>(() => readJSON(LS.providers, DEFAULT_SETTINGS.providers));
  const [models, setModels] = useState(DEFAULT_SETTINGS.models);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => (typeof window !== "undefined" ? ((window.localStorage.getItem(LS.uiTheme) as any) || DEFAULT_SETTINGS.ui.theme) : DEFAULT_SETTINGS.ui.theme));
  const [brandLogo, setBrandLogo] = useState<"blue" | "yellow">(() => (typeof window !== "undefined" ? ((window.localStorage.getItem(LS.uiLogo) as any) || DEFAULT_SETTINGS.ui.brandLogo || 'blue') : 'blue'));
  const testTimers = useRef<Record<string, any>>({});

  // Persist on change (debounced for providers)
  useEffect(() => { writeJSON(LS.models, models); }, [models]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(LS.uiTheme, theme); }, [theme]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS.uiLogo, brandLogo);
      // Apply document class so BrandLogo can detect without prop
      const cls = 'theme-yellow';
      if (brandLogo === 'yellow') document.documentElement.classList.add(cls); else document.documentElement.classList.remove(cls);
    }
  }, [brandLogo]);
  useEffect(() => { const t = setTimeout(() => writeJSON(LS.providers, providers), 150); return () => clearTimeout(t); }, [providers]);

  const setProviderField = useCallback((id: ProviderId, patch: Partial<ProviderConfig>) => {
    setProviders(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  // Provider smoke tests (uses existing Next.js API routes; relies on env for server-side keys)
  const testProvider = useCallback(async (id: ProviderId): Promise<boolean> => {
    setProviderField(id, { status: "testing", lastError: null });
    console.info("alain.provider.tested", { provider: id, starting: true });
    const p = providers.find(pr => pr.id === id);
    try {
      if (!p?.enabled) throw new Error("Provider disabled");

      let ok = false; let err: string | null = null;

      if (id === "poe" || id === "openai-compatible") {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 5000);
        const resp = await fetch('/api/providers/smoke', {
          method: 'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ provider: id, model: (models.defaultModel || 'gpt-4o-mini') }),
          signal: ac.signal,
        }).catch((e)=>{ throw e; });
        clearTimeout(t);
        const data = await resp.json().catch(()=>({ success:false, error:{ message:'invalid response' } }));
        ok = !!data?.success;
        err = ok ? null : (data?.error?.message || 'Provider not configured (see env vars).');
      } else if (id === "ollama") {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 2500);
        const resp = await fetch('/api/providers/ollama/show?name=gpt-oss:20b', { signal: ac.signal }).catch((e)=>{ throw e; });
        clearTimeout(t);
        const data = await resp.json().catch(()=>({ info:null }));
        ok = !!data?.info;
        err = ok ? null : 'Ollama not detected on http://localhost:11434';
      } else if (id === "lmstudio") {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 2500);
        const resp = await fetch('/api/lmstudio/search?term=llama&limit=1', { signal: ac.signal }).catch((e)=>{ throw e; });
        clearTimeout(t);
        ok = resp.status === 200;
        err = ok ? null : 'LM Studio SDK not available on server or not running.';
      } else if (id === "huggingface") {
        // Ask backend to validate HF token if available (Encore Cloud may hold it)
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 5000);
        const resp = await fetch('/api/providers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId: 'huggingface' }), signal: ac.signal,
        }).catch((e)=>{ throw e; });
        clearTimeout(t);
        const data = await resp.json().catch(()=>({ valid:false, message:'invalid response' }));
        ok = !!data?.valid;
        err = ok ? null : (data?.message || 'HF token not configured on backend');
      }

      setProviderField(id, { status: ok ? 'ok' : 'error', lastTestAt: Date.now(), lastError: ok ? null : err || 'Test failed' });
      console.info("alain.provider.tested", { provider: id, success: ok });
      return ok;
    } catch (e: any) {
      setProviderField(id, { status: 'error', lastTestAt: Date.now(), lastError: e?.message || 'Test failed' });
      console.info("alain.provider.tested", { provider: id, success: false });
      return false;
    }
  }, [providers, setProviderField, models.defaultModel]);

  const clearAll = useCallback(() => {
    setProviders(DEFAULT_SETTINGS.providers);
    setModels(DEFAULT_SETTINGS.models);
    setTheme(DEFAULT_SETTINGS.ui.theme);
  }, []);

  return useMemo(
    () => ({ providers, setProviders, setProviderField, testProvider, models, setModels, theme, setTheme, brandLogo, setBrandLogo, clearAll, exportSettings, importSettings }),
    [providers, models, theme, brandLogo, setProviderField, testProvider, clearAll]
  );
}
