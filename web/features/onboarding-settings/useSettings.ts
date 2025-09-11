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
  const testTimers = useRef<Record<string, any>>({});

  // Persist on change (debounced for providers)
  useEffect(() => { writeJSON(LS.models, models); }, [models]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(LS.uiTheme, theme); }, [theme]);
  useEffect(() => { const t = setTimeout(() => writeJSON(LS.providers, providers), 150); return () => clearTimeout(t); }, [providers]);

  const setProviderField = useCallback((id: ProviderId, patch: Partial<ProviderConfig>) => {
    setProviders(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  // Debounced stub test to simulate connectivity checks
  const testProvider = useCallback((id: ProviderId) => {
    setProviderField(id, { status: "testing", lastError: null });
    console.info("alain.provider.tested", { provider: id, starting: true });
    if (testTimers.current[id]) clearTimeout(testTimers.current[id]);
    testTimers.current[id] = setTimeout(() => {
      // Simple rule-of-thumb stub: success if enabled and has some config, else error
      const p = providers.find(pr => pr.id === id);
      const ok = !!p?.enabled && (!!p?.apiKey || ["ollama", "lmstudio"].includes(id));
      setProviderField(id, { status: ok ? "ok" : "error", lastTestAt: Date.now(), lastError: ok ? null : "Missing credentials or disabled" });
      console.info("alain.provider.tested", { provider: id, success: ok });
    }, 400);
  }, [providers, setProviderField]);

  const clearAll = useCallback(() => {
    setProviders(DEFAULT_SETTINGS.providers);
    setModels(DEFAULT_SETTINGS.models);
    setTheme(DEFAULT_SETTINGS.ui.theme);
  }, []);

  return useMemo(
    () => ({ providers, setProviders, setProviderField, testProvider, models, setModels, theme, setTheme, clearAll, exportSettings, importSettings }),
    [providers, models, theme, setProviderField, testProvider, clearAll]
  );
}

