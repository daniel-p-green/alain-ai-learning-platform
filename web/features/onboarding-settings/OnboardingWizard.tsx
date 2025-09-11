"use client";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { useOnboarding } from "./useOnboarding";
import { DEFAULT_SETTINGS, ProviderConfig, ProviderId } from "./types";
import { useSettings } from "./useSettings";
import OnboardingStep from "./OnboardingStep";

type WizardState = {
  providers: Record<ProviderId, ProviderConfig>;
  selected: ProviderId[];
  modelInput: string;
  runMode: "cloud" | "local";
  cacheAssets: boolean;
};

function initState(): WizardState {
  const map = Object.fromEntries(DEFAULT_SETTINGS.providers.map(p => [p.id, { ...p }])) as Record<ProviderId, ProviderConfig>;
  return { providers: map, selected: [], modelInput: "", runMode: "cloud", cacheAssets: false };
}

export default function OnboardingWizard() {
  const { complete, reset } = useOnboarding();
  const settings = useSettings();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(() => initState());

  const canFinish = useMemo(() => true, []);

  const setProviderField = (id: ProviderId, patch: Partial<ProviderConfig>) =>
    setState(s => ({ ...s, providers: { ...s.providers, [id]: { ...s.providers[id], ...patch } } }));

  const toggleSelected = (id: ProviderId) => setState(s => {
    const selected = s.selected.includes(id) ? s.selected.filter(x => x !== id) : [...s.selected, id];
    return { ...s, selected, providers: { ...s.providers, [id]: { ...s.providers[id], enabled: selected.includes(id) } } };
  });

  const persistAndFinish = () => {
    // Persist chosen providers to settings
    const merged = Object.values(state.providers);
    settings.setProviders(merged);
    settings.setModels({ ...settings.models, recent: state.modelInput ? [state.modelInput, ...(settings.models.recent || [])].slice(0, 10) : settings.models.recent });
    console.info("alain.settings.saved");
    complete();
  };

  // Step 1 — Welcome
  if (step === 1) {
    return (
      <OnboardingStep
        title="Welcome to ALAIN"
        subtitle="Paste a model. Get a manual. Run and reuse."
        onNext={() => setStep(2)}
        nextText="Get started"
        footer={
          <button
            data-testid="ob-skip"
            className="inline-flex items-center h-10 px-4 rounded-[12px] border-2 border-alain-blue text-alain-blue bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
            onClick={() => {
              console.info("alain.onboarding.completed (skipped)");
              complete();
            }}
          >
            Skip for now
          </button>
        }
      >
        <div className="flex flex-col items-center gap-4">
          <Image src="/brand/ALAIN_logo_primary_blue-bg.svg" alt="ALAIN logo" width={480} height={256} className="rounded-[12px] shadow-card" />
          <p className="font-inter text-ink-700 text-center">
            We keep your keys on your device. We never send keys to our servers.
          </p>
        </div>
      </OnboardingStep>
    );
  }

  // Step 2 — Providers
  if (step === 2) {
    const rows: { id: ProviderId; label: string; needsKey?: boolean; needsBase?: boolean }[] = [
      { id: "openai-compatible", label: "OpenAI Compatible", needsKey: true, needsBase: true },
      { id: "huggingface", label: "Hugging Face Inference", needsKey: true, needsBase: true },
      { id: "ollama", label: "Ollama", needsBase: true },
      { id: "lmstudio", label: "LM Studio", needsBase: true },
      { id: "poe", label: "Poe", needsKey: true },
    ];
    return (
      <OnboardingStep
        title="Choose model providers"
        subtitle="Select providers you plan to use and add credentials."
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
      >
        <div className="space-y-4">
          {rows.map(r => {
            const p = state.providers[r.id];
            const apiId = `${r.id}-key`;
            const baseId = `${r.id}-base`;
            return (
              <div key={r.id} className="p-4 rounded-[12px] rounded-card border border-ink-100 bg-paper-0">
                <label className="flex items-center gap-3">
                  <input
                    data-testid={`prov-${r.id}-toggle`}
                    type="checkbox"
                    className="h-4 w-4"
                    checked={state.selected.includes(r.id)}
                    onChange={() => toggleSelected(r.id)}
                    aria-describedby={`${r.id}-help`}
                  />
                  <span className="font-medium text-ink-900">{r.label}</span>
                </label>
                <p id={`${r.id}-help`} className="text-sm text-ink-700 mt-1">We never send keys to our servers. Keys stay on your device.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {r.needsKey && (
                    <div>
                      <label htmlFor={apiId} className="block text-sm text-ink-700">API key</label>
                      <input
                        id={apiId}
                        type="password"
                        data-testid={`prov-${r.id}-key`}
                        className="mt-1 w-full h-10 px-3 rounded-[12px] border border-ink-100 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                        value={p.apiKey || ""}
                        onChange={e => setProviderField(r.id, { apiKey: e.target.value })}
                        aria-describedby={`${apiId}-help`}
                      />
                      <div id={`${apiId}-help`} className="text-xs text-ink-700 mt-1">Paste your token. You can show it later in Settings.</div>
                    </div>
                  )}
                  {r.needsBase && (
                    <div>
                      <label htmlFor={baseId} className="block text-sm text-ink-700">Base URL</label>
                      <input
                        id={baseId}
                        type="text"
                        data-testid={`prov-${r.id}-base`}
                        className="mt-1 w-full h-10 px-3 rounded-[12px] border border-ink-100 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                        value={p.baseUrl || ""}
                        onChange={e => setProviderField(r.id, { baseUrl: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <button
                    data-testid={`prov-${r.id}-test`}
                    onClick={() => settings.testProvider(r.id)}
                    className="inline-flex items-center h-9 px-3 rounded-[12px] bg-white text-alain-blue border-2 border-alain-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue disabled:opacity-50"
                    disabled={p.status === "testing"}
                    aria-live="polite"
                  >
                    {p.status === "testing" ? "Testing…" : p.status === "ok" ? "Tested ✓" : "Test connection"}
                  </button>
                  {p.status === "error" && <div className="text-sm text-red-700 mt-2" role="status">{p.lastError || "Unable to connect."}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </OnboardingStep>
    );
  }

  // Step 3 — Model source
  if (step === 3) {
    return (
      <OnboardingStep
        title="Choose a model"
        subtitle="Paste a model URL or ID."
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
      >
        <label htmlFor="model-input" className="block text-sm text-ink-700">Model URL or ID</label>
        <input
          id="model-input"
          data-testid="model-input"
          type="text"
          placeholder="e.g. https://huggingface.co/deepseek-ai/DeepSeek-R1-7B"
          className="mt-1 w-full h-10 px-3 rounded-[12px] border border-ink-100 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
          value={state.modelInput}
          onChange={e => setState(s => ({ ...s, modelInput: e.target.value }))}
          aria-describedby="model-help"
        />
        <div id="model-help" className="text-sm text-ink-700 mt-2">Paste a full Hugging Face URL or a model ID.</div>
      </OnboardingStep>
    );
  }

  // Step 4 — Run mode
  if (step === 4) {
    return (
      <OnboardingStep
        title="Choose run mode"
        subtitle="Use cloud or local runtimes."
        onBack={() => setStep(3)}
        onNext={() => setStep(5)}
      >
        <fieldset className="space-y-2">
          <legend className="text-sm text-ink-700">Mode</legend>
          <label className="flex items-center gap-3">
            <input type="radio" name="mode" checked={state.runMode === "cloud"} onChange={() => setState(s => ({ ...s, runMode: "cloud" }))} />
            <span>Cloud</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="radio" name="mode" checked={state.runMode === "local"} onChange={() => setState(s => ({ ...s, runMode: "local" }))} />
            <span>Local</span>
          </label>
        </fieldset>
        {state.runMode === "local" && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-50">
              <div className="font-medium">LM Studio</div>
              <p className="text-sm text-ink-700">Download a model and start the local server on port 1234.</p>
            </div>
            <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-50">
              <div className="font-medium">Ollama</div>
              <p className="text-sm text-ink-700">Install Ollama and run <code className="font-mono text-ink-900">ollama serve</code> on port 11434.</p>
            </div>
          </div>
        )}
        <label className="mt-4 flex items-center gap-3">
          <input type="checkbox" checked={state.cacheAssets} onChange={e => setState(s => ({ ...s, cacheAssets: e.target.checked }))} />
          <span>Cache assets for offline use</span>
        </label>
      </OnboardingStep>
    );
  }

  // Step 5 — Summary
  return (
    <OnboardingStep
      title="Review and finish"
      subtitle="Confirm your selections."
      onBack={() => setStep(4)}
      onNext={persistAndFinish}
      nextText="Finish"
      nextDisabled={!canFinish}
    >
      <div className="space-y-3">
        <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-50">
          <div className="font-medium">Providers</div>
          <div className="text-sm text-ink-700">{state.selected.length ? state.selected.join(", ") : "None selected"}</div>
        </div>
        <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-50">
          <div className="font-medium">Model</div>
          <div className="text-sm text-ink-700">{state.modelInput || "Not set"}</div>
        </div>
        <div className="p-4 rounded-[12px] border border-ink-100 bg-paper-50">
          <div className="font-medium">Run mode</div>
          <div className="text-sm text-ink-700">{state.runMode === "cloud" ? "Cloud" : "Local"} {state.cacheAssets ? "(cache assets)" : ""}</div>
        </div>
      </div>
    </OnboardingStep>
  );
}

