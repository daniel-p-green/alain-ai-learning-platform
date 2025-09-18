'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/Button';
import NotebookWorkspace, { WorkspaceState, ExportUiState } from '../../../components/NotebookWorkspace';
import WorkspaceSplit from '../../../components/WorkspaceSplit';
import api, { parseHfRef } from '../../../lib/api';
import { backendUrl } from '../../../lib/backend';
import { encodeNotebookId } from '../../../lib/notebookId';
import type { UseGenerateLessonResult } from '../hooks/useGenerateLesson';


const providerExplainers: Record<string, { title: string; helper: string }> = {
  poe: {
    title: 'Hosted Poe (recommended)',
    helper: 'Runs in Poe\'s managed environment. Fastest way to generate manuals with no local setup.'
  },
  'openai-compatible': {
    title: 'OpenAI-compatible / local runtime',
    helper: 'Uses your configured base URL (Ollama, LM Studio, vLLM). Requires your own keys or a running server.'
  },
  lmstudio: {
    title: 'LM Studio runtime',
    helper: 'Targets the LM Studio local server. Download the model and ensure the server is running on port 1234.'
  },
  ollama: {
    title: 'Ollama runtime',
    helper: 'Connects to an Ollama host (default http://localhost:11434). Pull the model before starting.'
  },
};

type PresetId = 'hosted' | 'local' | 'colab';
type EnvBanner = UseGenerateLessonResult['envBanner'];

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
    triggerDemoMode,
    exportNotebook,
    exportState,
    clearExportState,
  } = props;
  const [showAdvancedProviders, setShowAdvancedProviders] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({ status: 'empty' });
  const [workspaceTitle, setWorkspaceTitle] = useState<string>('Generated manual');

  const handleNotebookChange = useCallback((nextNotebook: any) => {
    setWorkspaceState((prev) => {
      if (prev.status !== 'ready') return prev;
      return { ...prev, notebook: nextNotebook };
    });
  }, []);

  const tutorialId = useMemo(() => (result ? String(result.tutorialId) : null), [result]);
  const manualPreview = result?.preview ?? null;

  const readyHosted = !!envBanner && envBanner.teacherProvider === 'poe' && !!envBanner.poeConfigured;
  const readyLocal = !!envBanner && !!envBanner.offlineMode && !!envBanner.openaiBaseUrl;
  const hfInfo = parseHfRef(hfUrl);
  const teacherProviderHelper = providerExplainers[teacherProvider]?.helper;
  const targetProviderHelper = providers.find((provider) => provider.name === targetProvider)?.description || providerExplainers[targetProvider]?.helper;

  const applyPreset = (preset: PresetId) => {
    if (preset === 'hosted') {
      setSource('hf');
      setTeacherProvider('poe');
      setTeacherModel('GPT-OSS-20B');
      setTargetProvider('poe');
      setTargetModel('');
      setResearchMode('standard');
      setDifficulty('beginner');
      setForceFallback(false);
      setRawTextInput('');
      return;
    }
    if (preset === 'local') {
      setSource('local');
      setTeacherProvider('openai-compatible');
      setTeacherModel('GPT-OSS-20B');
      setTargetProvider('openai-compatible');
      if (availableModels.length > 0) {
        setTargetModel(availableModels[0]);
      }
      setResearchMode('standard');
      setDifficulty('beginner');
      setForceFallback(false);
      setRawTextInput('');
      setHfUrl('');
      return;
    }
    setSource('hf');
    setTeacherProvider('poe');
    setTeacherModel('GPT-OSS-20B');
    setTargetProvider('poe');
    setTargetModel('');
    setResearchMode('thorough');
    setDifficulty('beginner');
    setForceFallback(false);
    setRawTextInput('');
  };

  const quickPresetCards: Array<{ id: PresetId; title: string; description: string; ready: boolean; status: string }> = [
    {
      id: 'hosted',
      title: 'Hosted (Poe)',
      description: 'Fast start with managed runtime and no local setup.',
      ready: readyHosted,
      status: readyHosted ? 'Ready — Poe configured.' : 'Add a Poe API key in Settings → Environment Status.',
    },
    {
      id: 'local',
      title: 'Local runtime',
      description: 'Generate with an OpenAI-compatible server (Ollama, LM Studio, vLLM).',
      ready: readyLocal,
      status: readyLocal
        ? `Ready — using ${envBanner?.openaiBaseUrl ?? 'configured base URL'}.`
        : 'Set an OpenAI-compatible base URL in Settings → Environment Status.',
    },
    {
      id: 'colab',
      title: 'Colab export',
      description: 'Optimised for Google Colab with hosted providers and thorough research.',
      ready: readyHosted,
      status: readyHosted ? 'Ready — hosted provider available.' : 'Configure Poe to unlock Colab-friendly exports.',
    },
  ];

  useEffect(() => {
    if (
      !showAdvancedProviders &&
      (teacherProvider !== 'poe' || teacherModel !== 'GPT-OSS-20B' || targetProvider !== 'poe' || targetModel.trim() || source === 'local')
    ) {
      setShowAdvancedProviders(true);
    }
  }, [showAdvancedProviders, teacherModel, teacherProvider, targetModel, targetProvider, source]);

  useEffect(() => {
    if (exportState.status !== 'success') {
      setCopyStatus('idle');
    }
  }, [exportState.status]);

  useEffect(() => {
    const normalized = manualPreview?.title?.trim() ?? '';
    const nextTitle = normalized.length > 0 ? normalized : 'Generated manual';
    setWorkspaceTitle((prev) => (prev === nextTitle ? prev : nextTitle));
  }, [manualPreview?.title, tutorialId]);

  useEffect(() => {
    if (!tutorialId) {
      setWorkspaceState({ status: 'empty' });
      return;
    }

    let active = true;
    const controller = new AbortController();
    const encodedId = encodeNotebookId(tutorialId);
    setWorkspaceState({ status: 'loading' });

    fetch(`/api/notebooks/${encodedId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          const message = res.status === 404
            ? 'Preview not cached yet. Open the manual to view the full notebook.'
            : text || 'Failed to load notebook.';
          const error = new Error(message) as Error & { status?: number };
          error.status = res.status;
          throw error;
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setWorkspaceState({ status: 'ready', notebook: data.nb, meta: data.meta });
      })
      .catch((err) => {
        if (!active || controller.signal.aborted) return;
        const status = (err as any)?.status;
        const message = err instanceof Error ? err.message : 'Failed to load notebook.';
        setWorkspaceState({
          status: 'error',
          message: status === 404 ? 'The manual is ready, but the inline preview is unavailable. Open the full manual to continue.' : message,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [tutorialId]);

  async function handleCopyExportLink() {
    if (exportState.status !== 'success') return;
    try {
      await navigator.clipboard.writeText(exportState.url);
      setCopyStatus('success');
    } catch (err) {
      console.error('Copy failed', err);
      setCopyStatus('error');
    }
  }

  async function handleDownloadJson() {
    if (!result) return;
    try {
      const id = String(result.tutorialId || '');
      if (!id) throw new Error('Missing tutorial identifier');
      let payload: any = null;
      if (id.startsWith('local-')) {
        const res = await fetch(`/api/tutorials/local/${id}`);
        if (!res.ok) throw new Error('Local manual not found');
        payload = await res.json();
      } else {
        const res = await fetch(backendUrl(`/tutorials/${id}`));
        if (!res.ok) throw new Error('Failed to fetch tutorial JSON');
        payload = await res.json();
      }
      const filenameBase = (workspaceTitle || 'lesson').trim();
      const filename = (filenameBase.length > 0 ? filenameBase : 'lesson').replace(/\s+/g, '_');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${filename}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download JSON failed', err);
    }
  }

  const handleOpenManual = () => {
    if (!tutorialId) return;
    window.location.href = `/tutorial/${tutorialId}`;
  };

  const handleRemix = () => {
    if (!tutorialId) return;
    window.location.href = `/tutorial/${tutorialId}?remix=1`;
  };

  const handleTitleChange = useCallback((nextTitle: string) => {
    setWorkspaceTitle(nextTitle);
  }, []);

  const handleDownloadIpynb = useCallback(() => {
    if (workspaceState.status !== 'ready') return;
    const notebook = workspaceState.notebook;
    if (!notebook) return;
    try {
      const baseTitle = (workspaceTitle || 'lesson').trim();
      const safeTitle = (baseTitle.length > 0 ? baseTitle : 'lesson').replace(/\s+/g, '_');
      const notebookForDownload = JSON.parse(JSON.stringify(notebook));
      if (!notebookForDownload.metadata || typeof notebookForDownload.metadata !== 'object') {
        notebookForDownload.metadata = {};
      }
      notebookForDownload.metadata.title = workspaceTitle;
      const blob = new Blob([JSON.stringify(notebookForDownload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeTitle}.ipynb`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download .ipynb failed', err);
    }
  }, [workspaceState, workspaceTitle]);

  const handleExport = async (suggestedName: string) => {
    if (!result) return;
    // TODO: instrument export action for analytics once tracking pipeline is ready.
    await exportNotebook(result, suggestedName);
  };

  const progressLabels: Record<typeof progress, string> = useMemo(() => ({
    idle: '',
    parsing: 'Preparing your model details…',
    asking: 'Generating lesson plan with GPT-OSS-20B…',
    importing: 'Saving and formatting the manual…',
    done: 'Manual ready! Review the workspace to continue.',
  }), []);
  const isActiveProgress = progress === 'parsing' || progress === 'asking' || progress === 'importing';
  const workspaceProgressLabel = progressLabels[progress];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:py-10 text-ink-900">
      <WorkspaceSplit
        className="gap-6"
        left={
          <div className="space-y-6 pb-10 px-1 lg:px-0" data-generator-form-root="true">
            <header className="space-y-2">
        <h1 className="font-display text-[32px] font-black leading-[1.1] tracking-tight">Generate Manual</h1>
        <p className="text-sm text-ink-700">Recommended defaults that work out of the box. Export to Jupyter or Colab in one click.</p>
      </header>
      <EnvironmentStatusCard envBanner={envBanner} readyHosted={readyHosted} readyLocal={readyLocal} />
      <div className="rounded-card border border-alain-yellow/30 bg-alain-yellow/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[20px] font-semibold text-alain-blue">🚀 Quick Demo</h3>
            <p className="text-sm text-ink-700">Load a working GPT-OSS-20B preset and show ALAIN in under a minute.</p>
          </div>
          <Button variant="accent" onClick={triggerDemoMode} className="w-full sm:w-auto">
            Start Demo
          </Button>
        </div>
      </div>
      <div className="rounded-card border border-ink-100 bg-paper-0 p-4 text-sm text-ink-800 space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Quick start presets</div>
          <p className="text-xs text-ink-600">Pick a starting point and we'll fill the form below. You can still adjust any field before generating.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {quickPresetCards.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="flex h-full flex-col justify-between rounded-card border border-ink-100 bg-paper-0 p-3 text-left transition hover:border-alain-blue/60"
            >
              <div className="space-y-2">
                <div className="text-sm font-semibold text-ink-900">{preset.title}</div>
                <p className="text-xs text-ink-600">{preset.description}</p>
              </div>
              <span className={`text-xs font-medium ${preset.ready ? 'text-success-700' : 'text-warning-700'}`}>{preset.status}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={triggerExampleHosted}>Use Example (Hosted)</Button>
        <Button variant="secondary" className="w-full sm:w-auto" onClick={triggerExampleLocal}>Use Example (Local: gpt-oss-20b)</Button>
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
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { setSource('hf'); setTeacherProvider('poe'); }}>Switch to Hosted (Poe)</Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { window.location.href = '/lmstudio'; }}>Open Explorer</Button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant={source === 'hf' ? 'accent' : 'secondary'}
          className="w-full sm:w-auto"
          onClick={() => setSource('hf')}
        >
          From Hugging Face
        </Button>
        <Button
          variant={source === 'local' ? 'accent' : 'secondary'}
          className="w-full sm:w-auto"
          onClick={() => setSource('local')}
        >
          From Local Runtime
        </Button>
        <Button
          variant={source === 'text' ? 'accent' : 'secondary'}
          className="w-full sm:w-auto"
          onClick={() => setSource('text')}
        >
          From Text
        </Button>
      </div>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
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
            <label className="text-sm font-medium text-ink-800">Paste text</label>
            <textarea
              className="w-full min-h-[140px] rounded-card bg-paper-0 border border-ink-100 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
              placeholder="Paste any content here (docs, article, notes) to generate a lesson."
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
            />
            <div className="text-xs text-ink-700">{researchCopy[researchMode].note}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-800">Local model</label>
            {availableModels.length > 0 ? (
              <select
                className="w-full rounded-card bg-paper-0 border border-ink-100 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
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
                className="w-full rounded-card bg-paper-0 border border-ink-100 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                placeholder="gpt-oss-20b"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
              />
            )}
            <p className="text-xs text-ink-600">Select from detected models or paste a runtime identifier.</p>
            {providersError && <div className="text-xs text-red-700">{providersError}</div>}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-800">Difficulty</label>
          <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <p className="text-xs text-ink-600">Select the skill level you want ALAIN to target.</p>
        </div>
        <details
          className="group rounded-card border border-ink-100 bg-paper-50 p-3"
          open={showAdvancedProviders}
          onToggle={(event) => setShowAdvancedProviders(event.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-900">
            Advanced options
            <span className="text-xs font-normal text-ink-600 transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="mt-3 space-y-3 pl-1">
            <div className="space-y-1">
              <label className="text-sm font-medium text-ink-800">Teacher provider</label>
              <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={teacherProvider} onChange={(e) => setTeacherProvider(e.target.value as any)}>
                <option value="poe">{providerExplainers.poe.title}</option>
                <option value="openai-compatible">{providerExplainers['openai-compatible'].title}</option>
              </select>
              <p className="text-xs text-ink-600">{teacherProviderHelper || 'Choose where the teacher model will run.'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-ink-800">Teacher model</label>
              <select
                className="p-2 rounded-card bg-paper-0 border border-ink-100"
                value={teacherModel}
                onChange={(e) => setTeacherModel(e.target.value as any)}
              >
                <option value="GPT-OSS-20B">GPT-OSS-20B (default)</option>
                {ALLOW_120B && <option value="GPT-OSS-120B">GPT-OSS-120B (not recommended)</option>}
              </select>
              <p className="text-xs text-ink-600">Stay on GPT-OSS-20B for the most reliable JSON output.</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-ink-800">Target provider</label>
              <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={targetProvider} onChange={(e) => setTargetProvider(e.target.value)}>
                {providers.map((provider) => (
                  <option key={provider.name} value={provider.name}>
                    {providerExplainers[provider.name]?.title || provider.name}
                  </option>
                ))}
              </select>
              {targetProviderHelper && <p className="text-xs text-ink-600">{targetProviderHelper}</p>}
              <input
                className="p-2 rounded-card bg-paper-0 border border-ink-100"
                placeholder="Optional model override (e.g. gpt-oss-20b)"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
              />
              <p className="text-xs text-ink-600">Leave blank to use the provider's default deployment.</p>
            </div>
          </div>
        </details>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
            {loading ? 'Generating…' : 'Generate'}
          </Button>
          {isActiveProgress && (
            <div className="flex items-center gap-2 text-sm text-ink-700" role="status" aria-live="polite">
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-alain-blue" aria-hidden="true" />
              <span>{progressLabels[progress]}</span>
            </div>
          )}
          {!isActiveProgress && progress === 'done' && (
            <div className="flex items-center gap-2 text-sm text-success-700" role="status" aria-live="polite">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-success-600" aria-hidden="true" />
              <span>{progressLabels.done}</span>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-3 rounded-card border border-red-200 bg-red-50 p-3 text-red-800">
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

            <div className="mt-6 text-sm text-ink-700">
              <div className="mb-1 font-medium text-ink-900">Try these popular models</div>
              <div className="flex flex-wrap gap-2">
                {['meta-llama/Meta-Llama-3.1-8B-Instruct', 'google/gemma-2-9b-it', 'mistralai/Mistral-7B-Instruct-v0.3'].map((model) => (
                  <Button key={model} variant="secondary" className="px-2 py-1 text-xs" onClick={() => setHfUrl(model)}>{model}</Button>
                ))}
              </div>
            </div>
          </div>
        }
        right={
          <NotebookWorkspace
            workspace={workspaceState}
            preview={manualPreview ?? undefined}
            repaired={!!result?.meta?.repaired}
            tutorialId={tutorialId || undefined}
            title={workspaceTitle}
            progressActive={isActiveProgress}
            progressLabel={workspaceProgressLabel}
            exportState={exportState as unknown as ExportUiState}
            onExport={handleExport}
            onDownloadJson={handleDownloadJson}
            onDownloadIpynb={handleDownloadIpynb}
            onCopyExportLink={handleCopyExportLink}
            onDismissExportState={clearExportState}
            copyStatus={copyStatus}
            onOpenManual={handleOpenManual}
            onRemix={handleRemix}
            onNotebookChange={handleNotebookChange}
            onTitleChange={handleTitleChange}
          />
        }
      />

      {snackbar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-card border border-ink-100 bg-paper-0 px-4 py-2 text-ink-900 shadow-card">{snackbar}</div>
      )}
    </div>
  );
}

function EnvironmentStatusCard({ envBanner, readyHosted, readyLocal }: { envBanner: EnvBanner; readyHosted: boolean; readyLocal: boolean }) {
  if (!envBanner) {
    return (
      <div className="rounded-card border border-ink-100 bg-paper-0 p-4 text-sm text-ink-800">
        <div className="font-medium text-ink-900">Environment status</div>
        <p className="mt-1 text-xs text-ink-600">Checking your provider configuration… If this message stays visible, open Settings → Environment Status to verify credentials.</p>
      </div>
    );
  }

  const hostedMessage = readyHosted
    ? 'Hosted preset ready — Poe is configured.'
    : 'Add a Poe API key in Settings → Environment Status to unlock hosted presets.';
  const localMessage = readyLocal
    ? `Local preset ready — using ${envBanner.openaiBaseUrl ?? 'configured base URL'}.`
    : 'Set an OpenAI-compatible base URL or enable offline mode in Settings → Environment Status.';

  const items = [
    { label: 'Hosted (Poe)', ready: readyHosted, detail: hostedMessage },
    { label: 'Local runtime', ready: readyLocal, detail: localMessage },
  ];

  return (
    <div className="rounded-card border border-ink-100 bg-paper-0 p-4 text-sm text-ink-800 space-y-3">
      <div className="font-medium text-ink-900">Environment status</div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-card border border-ink-100 bg-paper-50 p-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${item.ready ? 'bg-success-600' : 'bg-warning-600'}`} aria-hidden="true" />
              <span className="text-sm font-semibold text-ink-900">{item.label}</span>
            </div>
            <p className="mt-1 text-xs text-ink-600">{item.detail}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-600">Update providers from Settings → Environment Status to change these defaults.</p>
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
