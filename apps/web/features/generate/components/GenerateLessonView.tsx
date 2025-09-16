'use client';

import { useEffect, useState } from 'react';
import { Button } from '../../../components/Button';
import { PreviewPanel } from '../../../components/PreviewPanel';
import api, { parseHfRef } from '../../../lib/api';
import type { UseGenerateLessonResult } from '../hooks/useGenerateLesson';
import { GenerateWizard } from './GenerateWizard';

export function GenerateLessonView(props: UseGenerateLessonResult) {
  const {
    formRef,
    hfUrl,
    setHfUrl,
    source,
    setSource,
    rawTextInput,
    setRawTextInput,
    difficulty,
    setDifficulty,
    teacherProvider,
    setTeacherProvider,
    teacherModel,
    setTeacherModel,
    loading,
    error,
    errorDetails,
    progress,
    result,
    repairing,
    providers,
    providersError,
    targetProvider,
    setTargetProvider,
    targetModel,
    setTargetModel,
    availableModels,
    labelsByName,
    snackbar,
    envBanner,
    forceFallback,
    setForceFallback,
    researchMode,
    setResearchMode,
    SHOW_FALLBACK_UI,
    ALLOW_120B,
    researchCopy,
    onSubmit,
    onAutoFix,
    triggerExampleHosted,
    triggerExampleLocal,
    exportNotebook,
  } = props;
  const [wizardOpen, setWizardOpen] = useState(false);

  const readyHosted = !!envBanner && envBanner.teacherProvider === 'poe' && !!envBanner.poeConfigured;
  const readyLocal = !!envBanner && !!envBanner.offlineMode && !!envBanner.openaiBaseUrl;
  const hfInfo = parseHfRef(hfUrl);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4 text-ink-900">
      <h1 className="text-2xl font-black font-display">Generate Manual</h1>
      <p className="text-sm text-ink-700">Recommended defaults. Works offline or hosted. Export to Jupyter/Colab.</p>
      {envBanner && (
        <div className="mt-2 text-xs text-ink-700 border border-ink-100 rounded-card bg-paper-0 p-2">
          <span className="font-medium">Env:</span> {envBanner.offlineMode ? 'Offline' : 'Hosted'} · Provider: {envBanner.teacherProvider || 'unknown'} · Base URL: {envBanner.openaiBaseUrl || 'n/a'}
        </div>
      )}
      <div className="rounded-card border border-ink-100 bg-paper-50 p-4 text-sm text-ink-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium text-ink-900">Not sure where to start?</div>
            <p className="text-xs text-ink-600">Open the guided wizard to pick the right environment (hosted Poe, local GPU, or Colab export) with hardware notes.</p>
          </div>
          <Button variant="secondary" onClick={() => setWizardOpen(true)}>Open Guided Wizard</Button>
        </div>
      </div>
      {envBanner && !(readyHosted || readyLocal) && (
        <div className="mt-2 p-3 rounded-card bg-paper-50 border border-ink-100 text-sm text-ink-900">
          <div className="font-medium">Setup needed</div>
          <div className="text-ink-700">Use Settings → Environment Status to apply a quick preset (Hosted Poe or Local GPT‑OSS), then run tests. Or click one of the example buttons below.</div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={triggerExampleHosted}>Use Example (Hosted)</Button>
        <Button variant="secondary" onClick={triggerExampleLocal}>Use Example (Local: gpt-oss-20b)</Button>
      </div>
      {SHOW_FALLBACK_UI && (
        <div className="mt-2 p-3 rounded-card border border-yellow-200 bg-yellow-50 text-xs text-ink-900">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={forceFallback} onChange={(e) => setForceFallback(e.target.checked)} />
            Force fallback mode (no backend) for From Text. Helpful on Vercel. Only From Text is supported in fallback.
          </label>
        </div>
      )}
      {source === 'local' && availableModels.length === 0 && (
        <div className="p-3 rounded-card border border-ink-100 bg-paper-50 text-sm text-ink-900">
          <div className="font-medium">No local models detected</div>
          <div className="text-ink-700">Use Hosted (Poe) for instant demo, or open the LM Studio Explorer to download a model locally.</div>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => { setSource('hf'); setTeacherProvider('poe'); }}>Switch to Hosted (Poe)</Button>
            <Button variant="secondary" onClick={() => { window.location.href = '/lmstudio'; }}>Open Explorer</Button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant={source === 'hf' ? 'accent' : 'secondary'} onClick={() => setSource('hf')}>From Hugging Face</Button>
        <Button variant={source === 'local' ? 'accent' : 'secondary'} onClick={() => setSource('local')}>From Local Runtime</Button>
        <Button variant={source === 'text' ? 'accent' : 'secondary'} onClick={() => setSource('text')}>From Text</Button>
      </div>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
        {source === 'hf' ? (
          <div className="space-y-2">
            <input
              className="w-full p-2 rounded-card bg-paper-0 border border-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
              placeholder="https://huggingface.co/owner/repo"
              value={hfUrl}
              onChange={(e) => setHfUrl(e.target.value)}
            />
            {hfInfo.ok && hfInfo.repo && <HFInfoInline repo={hfInfo.repo} />}
            <div className="rounded-card border border-ink-100 bg-paper-50 p-3">
              <div className="text-sm font-medium text-ink-900">Research mode</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setResearchMode('standard')}
                  className={`px-3 py-1 rounded-card border ${researchMode === 'standard' ? 'border-alain-blue text-alain-blue' : 'border-ink-100 text-ink-800'} bg-white`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setResearchMode('thorough')}
                  className={`px-3 py-1 rounded-card border ${researchMode === 'thorough' ? 'border-alain-blue text-alain-blue' : 'border-ink-100 text-ink-800'} bg-white`}
                >
                  Thorough
                </button>
                {SHOW_FALLBACK_UI && (
                  <button
                    type="button"
                    onClick={() => {
                      setResearchMode('fallback');
                      setSource('text');
                      setForceFallback(true);
                    }}
                    className={`px-3 py-1 rounded-card border ${researchMode === 'fallback' ? 'border-alain-blue text-alain-blue' : 'border-ink-100 text-ink-800'} bg-white`}
                  >
                    Web-only
                  </button>
                )}
              </div>
              <div className="mt-1 text-xs text-ink-700">{researchCopy[researchMode].note}</div>
            </div>
          </div>
        ) : source === 'text' ? (
          <div className="space-y-2">
            <label className="text-sm text-ink-700">Paste text</label>
            <textarea
              className="w-full p-2 rounded-card bg-paper-0 border border-ink-100 min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
              placeholder="Paste any content here (docs, article, notes) to generate a lesson."
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
            />
            <div className="text-xs text-ink-700">{researchCopy[researchMode].note}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm text-ink-700">Local model</label>
            {availableModels.length > 0 ? (
              <select
                className="p-2 rounded-card bg-paper-0 border border-ink-100 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
              >
                <option value="">Select a model…</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>{labelsByName[model] || model}</option>
                ))}
              </select>
            ) : (
              <input
                className="w-full p-2 rounded-card bg-paper-0 border border-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                placeholder="gpt-oss-20b"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
              />
            )}
            <div className="rounded-card border border-ink-100 bg-paper-50 p-3">
              <div className="text-sm font-medium text-ink-900">Target provider/model</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <select
                  className="p-2 rounded-card bg-paper-0 border border-ink-100"
                  value={targetProvider}
                  onChange={(e) => setTargetProvider(e.target.value)}
                >
                  {providers.map((provider) => (
                    <option key={provider.name} value={provider.name}>{provider.name}</option>
                  ))}
                </select>
                <input
                  className="p-2 rounded-card bg-paper-0 border border-ink-100"
                  placeholder="Optional override"
                  value={targetModel}
                  onChange={(e) => setTargetModel(e.target.value)}
                />
              </div>
              {providersError && <div className="text-xs text-red-700 mt-1">{providersError}</div>}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-ink-700">Difficulty</label>
          <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <label className="text-sm text-ink-700">Teacher</label>
          <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={teacherProvider} onChange={(e) => setTeacherProvider(e.target.value as any)}>
            <option value="poe">Poe (hosted)</option>
            <option value="openai-compatible">OpenAI-compatible</option>
          </select>
          <label className="text-sm text-ink-700">Teacher model</label>
          <select
            className="p-2 rounded-card bg-paper-0 border border-ink-100"
            value={teacherModel}
            onChange={(e) => setTeacherModel(e.target.value as any)}
          >
            <option value="GPT-OSS-20B">GPT-OSS-20B (default)</option>
            {ALLOW_120B && <option value="GPT-OSS-120B">GPT-OSS-120B (not recommended)</option>}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Generating…' : 'Generate'}
          </Button>
          {progress !== 'idle' && <span className="text-sm text-ink-700">{progress}</span>}
        </div>
      </form>

      {error && (
        <div className="mt-3 p-3 rounded-card border border-red-200 bg-red-50 text-red-800">
          <div className="font-medium">{error}</div>
          {errorDetails.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-sm">
              {errorDetails.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!result && error && errorDetails.length > 0 && (
        <div className="mt-3 text-sm text-ink-700">
          <div className="mb-1">Try automatic fixes:</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs text-ink-600">
              <label className="inline-flex items-center gap-1" title="Add 2–3 sentence description if missing"><input type="checkbox" defaultChecked readOnly /> add_description</label>
              <label className="inline-flex items-center gap-1" title="Create an intro step if steps are missing"><input type="checkbox" defaultChecked readOnly /> add_intro_step</label>
              <label className="inline-flex items-center gap-1" title="Limit to ~3 strong steps"><input type="checkbox" defaultChecked readOnly /> compact_steps</label>
            </div>
            <Button
              variant="secondary"
              disabled={repairing}
              onClick={() => { void onAutoFix(); }}
            >
              Auto-fix and Import
            </Button>
          </div>
        </div>
      )}

      {result && (
        <PreviewPanel
          tutorialId={result.tutorialId}
          preview={result.preview as any}
          repaired={!!result.meta?.repaired}
          onExport={async (suggestedName) => exportNotebook(result, suggestedName)}
        />
      )}

      <div className="mt-6 text-sm text-ink-700">
        <div className="font-medium text-ink-900 mb-1">Try these popular models</div>
        <div className="flex flex-wrap gap-2">
          {['meta-llama/Meta-Llama-3.1-8B-Instruct', 'google/gemma-2-9b-it', 'mistralai/Mistral-7B-Instruct-v0.3'].map((model) => (
            <Button key={model} variant="secondary" className="px-2 py-1 text-xs" onClick={() => setHfUrl(model)}>{model}</Button>
          ))}
        </div>
      </div>

      {snackbar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-card bg-paper-0 border border-ink-100 text-ink-900 shadow-card">{snackbar}</div>
      )}
      <GenerateWizard open={wizardOpen} onClose={() => setWizardOpen(false)} viewModel={props} />
    </div>
  );
}

type HFInfoInlineProps = {
  repo: string;
};

function HFInfoInline({ repo }: HFInfoInlineProps) {
  const [info, setInfo] = useState<{ license: string | null; tags: string[]; downloads: number | null } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.hfModelInfo(repo);
        if (!alive) return;
        setInfo({
          license: (data as any).license ?? null,
          tags: (data as any).tags?.slice?.(0, 6) || [],
          downloads: (data as any).downloads ?? null,
        });
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [repo]);

  if (!info) return null;

  return (
    <div className="mt-2 text-xs text-ink-700 border border-ink-100 rounded-card bg-paper-0 p-2 flex flex-wrap items-center gap-2">
      {info.license && <span className="px-2 py-0.5 rounded-card border border-ink-100 bg-paper-0">License: {info.license}</span>}
      {typeof info.downloads === 'number' && <span className="px-2 py-0.5 rounded-card border border-ink-100 bg-paper-0">Downloads: {info.downloads}</span>}
      {info.tags && info.tags.length > 0 && (
        <span className="flex items-center gap-1 flex-wrap">
          {info.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-card border border-ink-100 bg-paper-0">{tag}</span>
          ))}
        </span>
      )}
    </div>
  );
}
