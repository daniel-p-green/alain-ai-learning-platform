"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSettings, exportSettings, importSettings } from "./useSettings";
import { useOnboarding } from "./useOnboarding";
import ResetOnboardingDialog from "./ResetOnboardingDialog";
import { ProviderId } from "./types";

function TabLink({ id, current, set }: { id: string; current: string; set: (id: string) => void }) {
  const active = current === id;
  return (
    <button
      onClick={() => set(id)}
      className={`w-full text-left px-3 py-2 rounded-[12px] ${active ? "bg-paper-50 border border-ink-100" : "hover:bg-paper-50"}`}
    >
      {id}
    </button>
  );
}

export default function SettingsPage() {
  const { providers, setProviderField, testProvider, models, setModels, theme, setTheme, brandLogo, setBrandLogo, clearAll } = useSettings();
  const onboarding = useOnboarding();
  const [tab, setTab] = useState<string>(() => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("tab") || "Account");
  useEffect(() => { if (typeof window !== "undefined") {
    const url = new URL(window.location.href); url.searchParams.set("tab", tab); window.history.replaceState({}, "", url.toString()); } }, [tab]);
  const [dialogOpen, setDialogOpen] = useState(false);

  function providerRow(id: ProviderId, label: string, needsKey?: boolean, needsBase?: boolean) {
    const p = providers.find(x => x.id === id)!;
    return (
      <div key={id} className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={!!p.enabled} onChange={e => setProviderField(id, { enabled: e.target.checked })} />
          <span className="font-medium text-ink-900">{label}</span>
        </label>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {needsKey && (
            <div>
              <label htmlFor={`${id}-key`} className="block text-sm text-ink-700">API key</label>
              <input id={`${id}-key`} type="password" value={p.apiKey || ""} onChange={e => setProviderField(id, { apiKey: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-[12px] border border-ink-100 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" />
              <p className="text-xs text-ink-700 mt-1">We never send keys to our servers. Keys stay on your device.</p>
            </div>
          )}
          {needsBase && (
            <div>
              <label htmlFor={`${id}-base`} className="block text-sm text-ink-700">Base URL</label>
              <input id={`${id}-base`} type="text" value={p.baseUrl || ""} onChange={e => setProviderField(id, { baseUrl: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-[12px] border border-ink-100 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button data-testid={`settings-prov-${id}-test`} className="h-9 px-3 rounded-[12px] bg-white text-alain-blue border-2 border-alain-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue disabled:opacity-50" onClick={() => testProvider(id)} disabled={p.status === "testing"}>
            {p.status === "testing" ? "Testing…" : p.status === "ok" ? "Tested ✓" : "Test connection"}
          </button>
          {p.status === "error" && <span className="text-sm text-red-700">{p.lastError || "Unable to connect."}</span>}
        </div>
      </div>
    );
  }

  const tabs = ["Account", "Providers", "Models", "Appearance", "Onboarding & Demo", "Advanced"];

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 text-ink-900">
      <div className="mb-6">
        <h1 className="font-display font-bold text-[32px] leading-[38px] tracking-tight">Settings</h1>
        <p className="font-inter text-ink-700 text-sm mt-1">Configure providers and models. Reset onboarding for demos.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[240px,1fr]">
        <aside className="rounded-[12px] border border-ink-100 bg-paper-0 p-2 h-fit">
          <nav className="font-inter text-sm space-y-1">
            {tabs.map(t => <TabLink key={t} id={t} current={tab} set={setTab} />)}
          </nav>
        </aside>
        <div className="space-y-4">
          {tab === "Account" && (
            <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
              <div className="font-medium">Account</div>
              <p className="text-sm text-ink-700">Sign-in integrates with your app. This is a placeholder for user details.</p>
            </div>
          )}
          {tab === "Providers" && (
            <div className="space-y-3">
              {providerRow("openai-compatible", "OpenAI Compatible", true, true)}
              {providerRow("huggingface", "Hugging Face Inference", true, true)}
              {providerRow("ollama", "Ollama", false, true)}
              {providerRow("lmstudio", "LM Studio", false, true)}
              {providerRow("poe", "Poe", true, false)}
            </div>
          )}
          {tab === "Models" && (
            <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
              <div className="font-medium">Models</div>
              <label htmlFor="default-model" className="block text-sm text-ink-700 mt-2">Default model</label>
              <input id="default-model" data-testid="default-model" type="text" className="mt-1 w-full h-10 px-3 rounded-[12px] border border-ink-100 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" value={models.defaultModel || ""} onChange={e => setModels({ ...models, defaultModel: e.target.value })} />
              <div className="mt-3">
                <button className="h-9 px-3 rounded-[12px] border-2 border-alain-blue text-alain-blue bg-white" onClick={() => setModels({ ...models, recent: [] })}>Clear history</button>
              </div>
            </div>
          )}
          {tab === "Appearance" && (
            <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
              <div className="font-medium">Appearance</div>
              <label className="block text-sm text-ink-700 mt-2">Theme</label>
              <div className="mt-1 flex gap-3">
                {["light", "dark", "system"].map(t => (
                  <label key={t} className="flex items-center gap-2">
                    <input type="radio" name="theme" checked={theme === t} onChange={() => setTheme(t as any)} />
                    <span className="capitalize">{t}</span>
                  </label>
                ))}
              </div>
              <label className="block text-sm text-ink-700 mt-4">Brand logo variant</label>
              <div className="mt-1 flex gap-3">
                {["blue", "yellow"].map(v => (
                  <label key={v} className="flex items-center gap-2">
                    <input type="radio" name="brandLogo" checked={brandLogo === v} onChange={() => setBrandLogo(v as any)} />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-[12px] border border-ink-100 bg-paper-50">
                <div className="font-display font-bold text-[24px]">Typography Preview</div>
                <p className="font-inter text-ink-700">Body text meets contrast guidelines. Focus rings are visible on keyboard navigation.</p>
              </div>
            </div>
          )}
          {tab === "Onboarding & Demo" && (
            <div className="space-y-3">
              <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
                <div className="font-medium">Onboarding</div>
                <label className="mt-2 flex items-center gap-3">
                  <input type="checkbox" checked={!onboarding.completed} onChange={(e) => (e.target.checked ? onboarding.reset() : onboarding.complete())} />
                  <span>Show onboarding on next launch</span>
                </label>
                <div className="mt-3 flex gap-2">
                  <button data-testid="open-reset-dialog" className="h-10 px-4 rounded-[12px] bg-alain-yellow text-alain-blue border border-alain-stroke focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" onClick={() => setDialogOpen(true)}>
                    Reset onboarding
                  </button>
                </div>
                <p className="text-xs text-ink-700 mt-2">Reset keeps API keys unless you also clear providers.</p>
              </div>
              <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
                <div className="font-medium">Demo</div>
                <label className="mt-2 flex items-center gap-3">
                  <input type="checkbox" onChange={() => { /* you can wire demo loader here */ }} />
                  <span>Load demo data</span>
                </label>
              </div>
            </div>
          )}
          {tab === "Advanced" && (
            <div className="space-y-3">
              <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
                <div className="font-medium">Import / Export JSON</div>
                <div className="mt-2 flex gap-2">
                  <button className="h-9 px-3 rounded-[12px] border-2 border-alain-blue text-alain-blue bg-white" onClick={() => {
                    const data = exportSettings();
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  }}>Copy export</button>
                  <button className="h-9 px-3 rounded-[12px] bg-alain-blue text-white" onClick={() => {
                    const raw = prompt("Paste settings JSON");
                    if (!raw) return;
                    try { importSettings(JSON.parse(raw)); alert("Imported settings."); } catch { alert("Invalid JSON"); }
                  }}>Import from JSON</button>
                </div>
              </div>
              <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-0">
                <div className="font-medium">Danger zone</div>
                <p className="text-sm text-ink-700">This clears all ALAIN local data on this device.</p>
                <button data-testid="clear-all" className="mt-2 h-9 px-3 rounded-[12px] bg-red-600 text-white" onClick={clearAll}>Clear all local data</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ResetOnboardingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
