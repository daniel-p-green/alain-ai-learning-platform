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
      className={`w-full text-left px-3 py-2 rounded-alain-lg ${active ? "bg-alain-card border border-alain-stroke/15" : "hover:bg-alain-card"}`}
    >
      {id}
    </button>
  );
}

export default function SettingsPage() {
  const { providers, setProviders, setProviderField, testProvider, models, setModels, theme, setTheme, brandLogo, setBrandLogo, promptMode, setPromptMode, clearAll } = useSettings();
  const onboarding = useOnboarding();
  const [tab, setTab] = useState<string>(() => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("tab") || "Account");
  useEffect(() => { if (typeof window !== "undefined") {
    const url = new URL(window.location.href); url.searchParams.set("tab", tab); window.history.replaceState({}, "", url.toString()); } }, [tab]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [probe, setProbe] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function refreshProbe() {
    try {
      const resp = await fetch('/api/setup', { cache: 'no-store' });
      const data = await resp.json();
      setProbe(data);
    } catch (e: any) {
      setProbe({ error: e?.message || String(e) });
    }
  }
  useEffect(() => { refreshProbe(); }, []);

  function providerRow(id: ProviderId, label: string, needsKey?: boolean, needsBase?: boolean) {
    const p = providers.find(x => x.id === id)!;
    return (
      <div key={id} className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={!!p.enabled} onChange={e => setProviderField(id, { enabled: e.target.checked })} />
          <span className="font-medium text-alain-text">{label}</span>
        </label>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {needsKey && (
            <div>
              <label htmlFor={`${id}-key`} className="block text-sm text-alain-text/80">API key</label>
              <input id={`${id}-key`} type="password" value={p.apiKey || ""} onChange={e => setProviderField(id, { apiKey: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white text-alain-text focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40" />
              <p className="text-xs text-alain-text/70 mt-1">We never send keys to our servers. Keys stay on your device.</p>
            </div>
          )}
          {needsBase && (
            <div>
              <label htmlFor={`${id}-base`} className="block text-sm text-alain-text/80">Base URL</label>
              <input id={`${id}-base`} type="text" value={p.baseUrl || ""} onChange={e => setProviderField(id, { baseUrl: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white text-alain-text focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button data-testid={`settings-prov-${id}-test`} className="h-9 px-3 rounded-alain-lg bg-white text-alain-blue border-2 border-alain-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40 disabled:opacity-50" onClick={async () => { const ok = await testProvider(id); setToast(`${label}: ${ok ? 'ok' : 'error'}`); }} disabled={p.status === "testing"}>
            {p.status === "testing" ? "Testing…" : p.status === "ok" ? "Tested ✓" : "Test connection"}
          </button>
          {p.status === "error" && <span className="text-sm text-red-700">{p.lastError || "Unable to connect."}</span>}
        </div>
      </div>
    );
  }

  const tabs = ["Account", "Providers", "Models", "Appearance", "Onboarding & Demo", "Advanced"];
  const [gh, setGh] = useState<{ hasToken?: boolean } | null>(null);
  const [ghToken, setGhToken] = useState('');
  const [ghBusy, setGhBusy] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings/github', { cache: 'no-store' });
        const j = await res.json();
        if (res.ok) {
          setGh({ hasToken: !!j?.hasToken });
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 bg-alain-bg text-alain-text">
      <div className="mb-6">
        <h1 className="font-display font-bold text-[32px] leading-[38px] tracking-tight">Settings</h1>
        <p className="font-inter text-alain-text/80 text-sm mt-1">Configure providers and models. Reset onboarding for demos.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[240px,1fr]">
        <aside className="rounded-alain-lg border border-alain-stroke/15 bg-alain-card p-2 h-fit shadow-alain-sm">
          <nav className="font-inter text-sm space-y-1">
            {tabs.map(t => <TabLink key={t} id={t} current={tab} set={setTab} />)}
          </nav>
        </aside>
        <div className="space-y-4">
          {/* Environment Status + Quick Presets */}
          <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
            <div className="font-medium">Environment Status</div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-alain-text/80 mt-2">
              <div>Mode: <span className="text-alain-text">{probe?.offlineMode ? 'Offline' : 'Hosted'}</span></div>
              <div>Provider: <span className="text-alain-text">{probe?.teacherProvider || 'unknown'}</span></div>
              <div>Base URL: <span className="text-alain-text">{probe?.openaiBaseUrl || 'n/a'}</span></div>
              <div>Ollama: <span className={probe?.ollamaDetected ? 'text-green-700' : 'text-red-700'}>{probe?.ollamaDetected ? 'detected' : 'not found'}</span></div>
              <div>LM Studio: <span className={probe?.lmStudioDetected ? 'text-green-700' : 'text-red-700'}>{probe?.lmStudioDetected ? 'detected' : 'not found'}</span></div>
              <div>Poe API key: <span className={probe?.poeConfigured ? 'text-green-700' : 'text-yellow-700'}>{probe?.poeConfigured ? 'configured' : 'missing'}</span></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="h-9 px-3 rounded-alain-lg bg-alain-blue text-white disabled:opacity-50"
                disabled={busy !== null}
                onClick={async ()=>{
                  try {
                    setBusy('local');
                    await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'offline', baseUrl:'http://localhost:11434/v1', apiKey:'ollama' }) });
                    setModels({ ...models, defaultModel: 'gpt-oss:20b', recent: ['openai/gpt-oss-20b', ...(models.recent||[])] });
                    setProviders(providers.map(p=> p.id==='openai-compatible' ? { ...p, enabled:true } : p));
                    setToast('Preset applied: Local GPT‑OSS (Ollama)');
                  } finally { setBusy(null); refreshProbe(); }
                }}>Quick Preset: Local GPT‑OSS (Ollama)</button>
              <button
                className="h-9 px-3 rounded-alain-lg border-2 border-alain-blue text-alain-blue bg-white disabled:opacity-50"
                disabled={busy !== null}
                onClick={async ()=>{
                  try {
                    setBusy('hosted');
                    await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'hosted' }) });
                    setModels({ ...models, defaultModel: 'gpt-4o-mini' });
                    setProviders(providers.map(p=> p.id==='poe' ? { ...p, enabled:true } : p));
                    setToast('Preset applied: Hosted (Poe)');
                  } finally { setBusy(null); refreshProbe(); }
                }}>Quick Preset: Hosted (Poe)</button>
              <a href="/generate?hf=openai/gpt-oss-20b&provider=local&model=gpt-oss:20b" className="h-9 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white text-alain-text inline-flex items-center">Load Sample (gpt‑oss‑20b)</a>
              <button
                className="h-9 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white"
                onClick={async ()=>{
                  const enabled = providers.filter(pr=>pr.enabled);
                  let pass = 0, fail = 0;
                  for (const pr of enabled) {
                    const ok = await testProvider(pr.id as any);
                    if (ok) pass++; else fail++;
                  }
                  setToast(`Tests completed: ${pass} passed, ${fail} failed`);
                }}>Test all enabled</button>
              <button
                className="h-9 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white"
                onClick={() => navigator.clipboard.writeText("# Hosted (Poe)\nexport POE_API_KEY=YOUR_KEY\n\n# Local (Ollama)\nexport OPENAI_BASE_URL=http://localhost:11434/v1\nexport OPENAI_API_KEY=ollama\n\n# Local (LM Studio)\nexport OPENAI_BASE_URL=http://localhost:1234/v1\nexport OPENAI_API_KEY=lmstudio\n")}
              >Copy env snippets</button>
            </div>
            {toast && <div className="mt-2 text-xs text-alain-text/80">{toast}</div>}
          </div>
          {tab === "Account" && (
            <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
              <div className="font-medium">Account</div>
              <p className="text-sm text-alain-text/80">Sign-in integrates with your app. This is a placeholder for user details.</p>
            </div>
          )}
          {tab === "Providers" && (
            <div className="space-y-3">
              <div className="rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-alain-text/80">
                      <th className="px-3 py-2">Provider</th>
                      <th className="px-3 py-2">Enabled</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map(p => (
                      <tr key={p.id} className="border-t border-alain-stroke/10">
                        <td className="px-3 py-2 font-medium text-alain-text">{p.name}</td>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={!!p.enabled} onChange={e => setProviderField(p.id as any, { enabled: e.target.checked })} />
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const s = (p.status as any) || 'unknown';
                            const good = s === 'ok';
                            const warn = s === 'testing';
                            const cls = good
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : warn
                              ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                              : 'bg-red-100 border-red-300 text-red-800';
                            return (
                              <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{s}</span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button aria-busy={p.status === 'testing'} className={`h-8 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white disabled:opacity-50 ${p.status==='testing'?'animate-pulse':''}`} disabled={p.status === 'testing'} onClick={() => testProvider(p.id as any)}>
                              {p.status === 'testing' ? 'Testing…' : 'Test'}
                            </button>
                            <details>
                              <summary className="cursor-pointer select-none">Logs</summary>
                              <div className="mt-2 p-2 border border-alain-stroke/15 rounded-alain-lg bg-alain-card text-xs text-alain-text/80">
                                <div>Last tested: {p.lastTestAt ? new Date(p.lastTestAt).toLocaleString() : 'never'}</div>
                                {p.lastError ? (<pre className="mt-1 whitespace-pre-wrap">{p.lastError}</pre>) : (<div>No errors</div>)}
                              </div>
                            </details>
                            <details>
                              <summary className="cursor-pointer select-none">Details</summary>
                              <div className="mt-2 p-3 border border-alain-stroke/15 rounded-alain-lg bg-alain-card">
                                {providerRow(p.id as any, p.name, ['poe','openai-compatible','huggingface'].includes(p.id as any), ['openai-compatible','ollama','lmstudio','huggingface'].includes(p.id as any))}
                              </div>
                            </details>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === "Models" && (
            <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
              <div className="font-medium">Models</div>
              <label htmlFor="default-model" className="block text-sm text-alain-text/80 mt-2">Default model</label>
              <input id="default-model" data-testid="default-model" type="text" className="mt-1 w-full h-10 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white text-alain-text focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40" value={models.defaultModel || ""} onChange={e => setModels({ ...models, defaultModel: e.target.value })} />
              <div className="mt-3">
                <button className="h-9 px-3 rounded-alain-lg border-2 border-alain-blue text-alain-blue bg-white" onClick={() => setModels({ ...models, recent: [] })}>Clear history</button>
              </div>
            </div>
          )}
          {tab === "Appearance" && (
            <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
              <div className="font-medium">Appearance</div>
              <label className="block text-sm text-alain-text/80 mt-2">Theme</label>
              <div className="mt-1 flex gap-3">
                {["light", "dark", "system"].map(t => (
                  <label key={t} className="flex items-center gap-2">
                    <input type="radio" name="theme" checked={theme === t} onChange={() => setTheme(t as any)} />
                    <span className="capitalize">{t}</span>
                  </label>
                ))}
              </div>
              <label className="block text-sm text-alain-text/80 mt-4">Brand logo variant</label>
              <div className="mt-1 flex gap-3">
                {["blue", "yellow"].map(v => (
                  <label key={v} className="flex items-center gap-2">
                    <input type="radio" name="brandLogo" checked={brandLogo === v} onChange={() => setBrandLogo(v as any)} />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-alain-lg border border-alain-stroke/15 bg-alain-card">
                <div className="font-display font-bold text-[24px]">Typography Preview</div>
                <p className="font-inter text-alain-text/80">Body text meets contrast guidelines. Focus rings are visible on keyboard navigation.</p>
              </div>
            </div>
          )}
          {tab === "Advanced" && (
            <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
              <div className="font-medium">Advanced</div>
              <div className="mt-3">
                <label className="block text-sm text-alain-text/80">Teacher prompt mode</label>
                <div className="mt-1 flex gap-3 text-sm">
                  {(['openai','poe'] as const).map(m => (
                    <label key={m} className="flex items-center gap-2">
                      <input type="radio" name="promptMode" checked={promptMode===m} onChange={()=> setPromptMode(m)} />
                      <span className="uppercase">{m}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-alain-text/70 mt-1">OpenAI-compatible uses role messages; Poe folds developer content into System.</p>
              </div>
            </div>
          )}
          {tab === "Onboarding & Demo" && (
            <div className="space-y-3">
              <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
                <div className="font-medium">Onboarding</div>
                <label className="mt-2 flex items-center gap-3">
                  <input type="checkbox" checked={!onboarding.completed} onChange={(e) => (e.target.checked ? onboarding.reset() : onboarding.complete())} />
                  <span>Show onboarding on next launch</span>
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    data-testid="open-reset-dialog"
                    className="h-10 px-4 rounded-alain-lg bg-alain-blue text-white border border-alain-blue/80 hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40"
                    onClick={() => setDialogOpen(true)}
                  >
                    Reset onboarding
                  </button>
                </div>
                <p className="text-xs text-alain-text/70 mt-2">Reset keeps API keys unless you also clear providers.</p>
              </div>
              <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
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
              <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
                <div className="font-medium">GitHub Export (server)</div>
                <p className="text-sm text-alain-text/80 mt-1">Store the GitHub token on the server for PR exports. Admins only. Token is not shown after saving.</p>
                <div className="mt-3">
                  <label className="block text-sm text-alain-text/80">GitHub Token</label>
                  <input type="password" value={ghToken} onChange={(e)=> setGhToken(e.target.value)} placeholder={gh?.hasToken ? '•••••••• saved on server' : ''} className="mt-1 w-full h-10 px-3 rounded-alain-lg border border-alain-stroke/20 bg-white text-alain-text focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40" />
                  <p className="text-xs text-alain-text/70 mt-1">Leave blank to keep existing. Repo/branch/dirs come from server env.</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="h-9 px-3 rounded-alain-lg bg-alain-blue text-white disabled:opacity-50" disabled={ghBusy} onClick={async ()=>{
                    setGhBusy(true);
                    try {
                      const payload: any = {};
                      if (ghToken) payload.token = ghToken;
                      const res = await fetch('/api/admin/settings/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                      const j = await res.json();
                      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
                      setToast('Saved GitHub token');
                      setGhToken('');
                      await refreshProbe();
                    } catch (e:any) {
                      setToast(e?.message || 'Save failed');
                    } finally {
                      setGhBusy(false);
                      setTimeout(()=> setToast(null), 3000);
                    }
                  }}>Save token</button>
                  {gh?.hasToken && (
                    <span className="text-xs text-alain-text/70">Token present on server</span>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
                <div className="font-medium">Import / Export JSON</div>
                <div className="mt-2 flex gap-2">
                  <button className="h-9 px-3 rounded-alain-lg border-2 border-alain-blue text-alain-blue bg-white" onClick={() => {
                    const data = exportSettings();
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  }}>Copy export</button>
                  <button className="h-9 px-3 rounded-alain-lg bg-alain-blue text-white" onClick={() => {
                    const raw = prompt("Paste settings JSON");
                    if (!raw) return;
                    try { importSettings(JSON.parse(raw)); alert("Imported settings."); } catch { alert("Invalid JSON"); }
                  }}>Import from JSON</button>
                </div>
              </div>
              <div className="p-4 rounded-alain-lg border border-alain-stroke/15 bg-alain-card shadow-alain-sm">
                <div className="font-medium">Danger zone</div>
                <p className="text-sm text-alain-text/80">This clears all ALAIN local data on this device.</p>
                <button data-testid="clear-all" className="mt-2 h-9 px-3 rounded-alain-lg bg-red-600 text-white" onClick={clearAll}>Clear all local data</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ResetOnboardingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
