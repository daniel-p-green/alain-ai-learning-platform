"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ResetOnboardingDialog from "./ResetOnboardingDialog";
import { useSettingsDraft } from "./useSettingsDraft";
import type { ProviderConfig, ProviderId } from "./types";

const SECTION_NAV = [
  { id: "overview", label: "Overview" },
  { id: "providers", label: "Providers" },
  { id: "models", label: "Models" },
  { id: "appearance", label: "Appearance" },
  { id: "onboarding", label: "Onboarding & Demo" },
  { id: "advanced", label: "Advanced" },
] as const;

type SectionId = (typeof SECTION_NAV)[number]["id"];

const PROVIDERS_WITH_BASE: ProviderId[] = ["openai-compatible", "huggingface", "ollama", "lmstudio"];

function StatusBadge({ status }: { status?: ProviderConfig["status"] }) {
  const label = status || "unknown";
  let classes = "bg-ink-100 border-ink-200 text-ink-700";
  if (label === "ok") classes = "bg-green-100 border-green-300 text-green-800";
  else if (label === "testing") classes = "bg-yellow-100 border-yellow-300 text-yellow-800";
  else if (label === "error") classes = "bg-red-100 border-red-300 text-red-700";
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${classes}`}>{label}</span>;
}

function SectionActions({ dirty, onSave, onReset }: { dirty: boolean; onSave: () => void; onReset: () => void }) {
  if (!dirty) return null;
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-[12px] bg-alain-blue px-4 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-alain-blue"
        onClick={onSave}
      >
        Save changes
      </button>
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-4 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const draft = useSettingsDraft();

  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [probe, setProbe] = useState<any>(null);
  const [probeLoading, setProbeLoading] = useState(false);
  const [busyPreset, setBusyPreset] = useState<string | null>(null);
  const [gh, setGh] = useState<{ hasToken?: boolean } | null>(null);
  const [ghToken, setGhToken] = useState("");
  const [ghBusy, setGhBusy] = useState(false);

  const announce = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const refreshProbe = useCallback(async () => {
    try {
      setProbeLoading(true);
      const response = await fetch("/api/setup", { cache: "no-store" });
      const data = await response.json();
      setProbe(data);
    } catch (error: any) {
      setProbe({ error: error?.message || String(error) });
    } finally {
      setProbeLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProbe();
  }, [refreshProbe]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/settings/github", { cache: "no-store" });
        const data = await response.json();
        if (response.ok) {
          setGh({ hasToken: !!data?.hasToken });
        }
      } catch {
        setGh(null);
      }
    })();
  }, []);

  const providerStatusById = useMemo(() => {
    const map: Record<ProviderId, ProviderConfig | undefined> = {} as Record<ProviderId, ProviderConfig | undefined>;
    draft.live.providers.forEach((provider) => {
      map[provider.id] = provider;
    });
    return map;
  }, [draft.live.providers]);

  const handleNavClick = (section: SectionId) => {
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveSection(section);
  };

  const handleImport = () => {
    const raw = window.prompt("Paste settings JSON");
    if (!raw) return;
    try {
      draft.actions.importSettings(JSON.parse(raw));
      announce("Imported settings. Refresh if changes do not appear immediately.");
    } catch (error) {
      announce("Invalid JSON. Nothing imported.");
    }
  };

  const handleExport = async () => {
    const data = draft.actions.exportSettings();
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    announce("Settings copied to clipboard.");
  };

  const handleTestAll = async () => {
    const enabled = draft.live.providers.filter((provider) => provider.enabled);
    if (enabled.length === 0) {
      announce("No providers enabled to test.");
      return;
    }
    let passed = 0;
    for (const provider of enabled) {
      const ok = await draft.actions.testProvider(provider.id as ProviderId);
      if (ok) passed += 1;
    }
    announce(`Tested ${enabled.length} provider(s): ${passed} passed, ${enabled.length - passed} failed.`);
  };

  const applyHostedPreset = async () => {
    try {
      setBusyPreset("hosted");
      await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "hosted" }),
      });
      draft.raw.setModels({ ...draft.live.models, defaultModel: "gpt-4o-mini" });
      const nextProviders = draft.raw.providers.map((provider) =>
        provider.id === "poe" ? { ...provider, enabled: true, apiKey: provider.apiKey } : provider
      );
      draft.raw.setProviders(nextProviders);
      announce("Preset applied for hosted Poe.");
      refreshProbe();
    } catch (error: any) {
      announce(error?.message || "Failed to apply preset.");
    } finally {
      setBusyPreset(null);
    }
  };

  const saveGithubToken = async () => {
    try {
      setGhBusy(true);
      const response = await fetch("/api/admin/settings/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ghToken || null }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Save failed");
      }
      setGh({ hasToken: !!ghToken });
      setGhToken("");
      announce(ghToken ? "GitHub token saved." : "GitHub token cleared.");
    } catch (error: any) {
      announce(error?.message || "Unable to save GitHub token.");
    } finally {
      setGhBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 text-ink-900 md:px-8">
      <header className="space-y-1">
        <h1 className="font-display text-[32px] font-bold leading-[38px] tracking-tight">Settings</h1>
        <p className="text-sm text-ink-600">Manage provider readiness, preferences, and developer integrations.</p>
        {toast && <div className="text-xs text-ink-500">{toast}</div>}
      </header>
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-24 self-start">
          <nav className="space-y-1 rounded-[12px] border border-ink-100 bg-paper-0 p-3 shadow-sm">
            {SECTION_NAV.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`w-full rounded-[10px] px-3 py-2 text-left text-sm ${active ? "bg-alain-blue/10 text-alain-blue" : "hover:bg-ink-100"}`}
                  onClick={() => handleNavClick(section.id)}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="space-y-12">
          <section id="overview" className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-xl font-semibold">Overview</h2>
              <p className="text-sm text-ink-600">Quick glance at your environment and global actions.</p>
            </header>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-ink-700">Environment status</h3>
                  <button
                    type="button"
                    className="text-xs font-medium text-alain-blue hover:underline"
                    onClick={refreshProbe}
                  >
                    {probeLoading ? "Checking…" : "Refresh"}
                  </button>
                </div>
                <dl className="mt-3 space-y-1 text-sm text-ink-700">
                  {probe?.error ? (
                    <div className="text-red-600">{probe.error}</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <dt>Mode</dt>
                        <dd className="font-medium">{probe?.offlineMode ? "Offline" : "Hosted"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Teacher provider</dt>
                        <dd className="font-medium">{probe?.teacherProvider || "unknown"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>OpenAI base URL</dt>
                        <dd className="font-medium">{probe?.openaiBaseUrl || "n/a"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Ollama</dt>
                        <dd className={probe?.ollamaDetected ? "text-green-700" : "text-ink-500"}>
                          {probe?.ollamaDetected ? "detected" : "not found"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>LM Studio</dt>
                        <dd className={probe?.lmStudioDetected ? "text-green-700" : "text-ink-500"}>
                          {probe?.lmStudioDetected ? "detected" : "not found"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Poe API key</dt>
                        <dd className={probe?.poeConfigured ? "text-green-700" : "text-yellow-700"}>
                          {probe?.poeConfigured ? "configured" : "missing"}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
              <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 shadow-sm">
                <h3 className="text-sm font-medium text-ink-700">Quick actions</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href="/onboarding"
                    className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                  >
                    Open .env wizard
                  </a>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                    onClick={handleExport}
                  >
                    Copy settings JSON
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                    onClick={handleImport}
                  >
                    Import from JSON
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                    onClick={handleTestAll}
                  >
                    Test all providers
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section id="providers" className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-xl font-semibold">Providers</h2>
              <p className="text-sm text-ink-600">Enable runtimes, adjust base URLs, and run smoke tests. Manage secrets via the .env wizard.</p>
            </header>
            <div className="overflow-x-auto rounded-[12px] border border-ink-100 bg-paper-0 shadow-sm">
              <table className="min-w-full divide-y divide-ink-100 text-sm">
                <thead className="bg-ink-50 text-ink-600">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Provider</th>
                    <th className="px-4 py-2 text-left font-medium">Enabled</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {draft.providersDraft.map((provider) => {
                    const live = providerStatusById[provider.id];
                    const hasBase = PROVIDERS_WITH_BASE.includes(provider.id);
                    return (
                      <tr key={provider.id}>
                        <td className="px-4 py-3 font-medium text-ink-900">{provider.name}</td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!provider.enabled}
                            onChange={(event) => draft.updateProviderDraft(provider.id, { enabled: event.target.checked })}
                          />
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={live?.status} /></td>
                        <td className="px-4 py-3">
                          <div className="space-y-3">
                            {hasBase && (
                              <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wide text-ink-500" htmlFor={`${provider.id}-base`}>
                                  Base URL
                                </label>
                                <input
                                  id={`${provider.id}-base`}
                                  type="text"
                                  className="w-full rounded-[10px] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                                  value={provider.baseUrl || ""}
                                  onChange={(event) => draft.updateProviderDraft(provider.id, { baseUrl: event.target.value })}
                                  placeholder="https://api.openai.com/v1"
                                />
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">
                              <button
                                type="button"
                                className="inline-flex h-8 items-center rounded-[10px] border border-ink-200 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue disabled:opacity-60"
                                disabled={live?.status === "testing"}
                                onClick={async () => {
                                  const ok = await draft.actions.testProvider(provider.id as ProviderId);
                                  announce(`${provider.name}: ${ok ? "ok" : "error"}`);
                                }}
                              >
                                {live?.status === "testing" ? "Testing…" : "Test connection"}
                              </button>
                              <span>Last tested: {live?.lastTestAt ? new Date(live.lastTestAt).toLocaleString() : "never"}</span>
                              {live?.lastError && <span className="text-red-600">{live.lastError}</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <SectionActions
              dirty={draft.dirty.providers}
              onSave={() => {
                draft.save.providers();
                announce("Provider preferences saved.");
              }}
              onReset={() => {
                draft.reset.providers();
              }}
            />
            <p className="text-xs text-ink-500">Need to change API keys? Re-run the .env wizard so secrets stay out of the browser.</p>
          </section>

          <section id="models" className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-xl font-semibold">Models</h2>
              <p className="text-sm text-ink-600">Set the default teacher model and manage your history.</p>
            </header>
            <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 shadow-sm space-y-3">
              <div>
                <label htmlFor="default-model" className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Default model
                </label>
                <input
                  id="default-model"
                  type="text"
                  className="mt-1 w-full rounded-[10px] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                  value={draft.modelsDraft.defaultModel || ""}
                  onChange={(event) => draft.updateModelsDraft({ defaultModel: event.target.value })}
                  placeholder="e.g. gpt-oss-20b"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Recent models</div>
                {draft.modelsDraft.recent && draft.modelsDraft.recent.length > 0 ? (
                  <ul className="text-sm text-ink-700">
                    {draft.modelsDraft.recent.map((model) => (
                      <li key={model}>{model}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-500">No recent models saved yet.</p>
                )}
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-[10px] border border-ink-200 bg-white px-3 text-xs text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                  onClick={() => draft.updateModelsDraft({ recent: [] })}
                >
                  Clear history
                </button>
              </div>
            </div>
            <SectionActions
              dirty={draft.dirty.models}
              onSave={() => {
                draft.save.models();
                announce("Model preferences saved.");
              }}
              onReset={() => draft.reset.models()}
            />
          </section>

          <section id="appearance" className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-xl font-semibold">Appearance</h2>
              <p className="text-sm text-ink-600">Personalise the UI theme and branding for your instance.</p>
            </header>
            <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 shadow-sm space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Theme</div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-700">
                  {["light", "dark", "system"].map((theme) => (
                    <label key={theme} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="theme"
                        checked={draft.uiDraft.theme === theme}
                        onChange={() => draft.updateUiDraft({ theme: theme as "light" | "dark" | "system" })}
                      />
                      <span className="capitalize">{theme}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Brand logo variant</div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-700">
                  {["blue", "yellow"].map((variant) => (
                    <label key={variant} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="brand-logo"
                        checked={draft.uiDraft.brandLogo === variant}
                        onChange={() => draft.updateUiDraft({ brandLogo: variant as "blue" | "yellow" })}
                      />
                      <span className="capitalize">{variant}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Prompt mode</div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-700">
                  {["openai", "poe"].map((mode) => (
                    <label key={mode} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="prompt-mode"
                        checked={draft.uiDraft.promptMode === mode}
                        onChange={() => draft.updateUiDraft({ promptMode: mode as "openai" | "poe" })}
                      />
                      <span className="uppercase">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-[12px] border border-ink-100 bg-paper-50 p-4">
                <div className="font-display text-2xl">Typography preview</div>
                <p className="text-sm text-ink-600">Interactive elements inherit focus rings and contrast from the selected theme.</p>
              </div>
            </div>
            <SectionActions
              dirty={draft.dirty.ui}
              onSave={() => {
                draft.save.ui();
                announce("Appearance settings saved.");
              }}
              onReset={() => draft.reset.ui()}
            />
          </section>

          <section id="onboarding" className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-xl font-semibold">Onboarding & Demo</h2>
              <p className="text-sm text-ink-600">Reset walkthroughs or launch demo data when showcasing the platform.</p>
            </header>
            <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                  onClick={() => setDialogOpen(true)}
                >
                  Reset onboarding flow
                </button>
                <a
                  href="/generate?hf=openai/gpt-oss-20b&provider=local&model=gpt-oss:20b"
                  className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                >
                  Load sample (gpt-oss-20b)
                </a>
              </div>
              <p className="text-xs text-ink-500">Resetting onboarding clears only the walkthrough flag. Use “Clear all local data” in Advanced to wipe everything.</p>
            </div>
          </section>

          <section id="advanced" className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-xl font-semibold">Advanced</h2>
              <p className="text-sm text-ink-600">Developer utilities and integrations. Handle with care.</p>
            </header>
            <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue disabled:opacity-60"
                  disabled={busyPreset !== null}
                  onClick={applyHostedPreset}
                >
                  {busyPreset === "hosted" ? "Applying…" : "Quick preset: Hosted (Poe)"}
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "# Hosted (Poe)\nexport POE_API_KEY=YOUR_KEY\n\n# Local (Ollama)\nexport OPENAI_BASE_URL=http://localhost:11434/v1\nexport OPENAI_API_KEY=ollama\n\n# Local (LM Studio)\nexport OPENAI_BASE_URL=http://localhost:1234/v1\nexport OPENAI_API_KEY=lmstudio\n"
                    );
                    announce("Env snippets copied to clipboard.");
                  }}
                >
                  Copy env snippets
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-[12px] border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                  onClick={handleTestAll}
                >
                  Test all enabled providers
                </button>
              </div>
            </div>
            <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 shadow-sm space-y-3">
              <div className="font-medium text-sm text-ink-700">GitHub publishing</div>
              <p className="text-xs text-ink-500">Store a GitHub PAT for notebook export automation. Leave blank and save to clear.</p>
              <div className="flex flex-wrap gap-3">
                <input
                  type="password"
                  className="w-full max-w-xs rounded-[10px] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                  placeholder="ghp_..."
                  value={ghToken}
                  onChange={(event) => setGhToken(event.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-[12px] bg-alain-blue px-4 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-alain-blue disabled:opacity-60"
                  disabled={ghBusy}
                  onClick={saveGithubToken}
                >
                  {ghBusy ? "Saving…" : "Save token"}
                </button>
                {gh?.hasToken && <span className="self-center text-xs text-ink-500">Token present</span>}
              </div>
            </div>
            <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="font-medium text-sm text-red-700">Danger zone</div>
              <p className="mt-1 text-sm text-red-600">Clears all local settings, onboarding progress, and provider preferences stored in this browser.</p>
              <button
                type="button"
                className="mt-3 inline-flex h-9 items-center rounded-[12px] bg-red-600 px-4 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                onClick={() => {
                  draft.actions.clearAll();
                  announce("Local data cleared. Reload the page to restart onboarding.");
                }}
              >
                Clear all local data
              </button>
            </div>
          </section>
        </div>
      </div>
      <ResetOnboardingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
