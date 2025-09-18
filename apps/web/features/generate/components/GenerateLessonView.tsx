'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/Button';
import NotebookWorkspace, { WorkspaceState, ExportUiState } from '../../../components/NotebookWorkspace';
import WorkspaceSplit from '../../../components/WorkspaceSplit';
import { AppShell } from '../../../components/layout/AppShell';
import api, { parseHfRef } from '../../../lib/api';
import { backendUrl } from '../../../lib/backend';
import { encodeNotebookId } from '../../../lib/notebookId';
import type { UseGenerateLessonResult, ResearchMode } from '../hooks/useGenerateLesson';
import { GenerateWizard } from './GenerateWizard';


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
    briefTitle,
    setBriefTitle,
    briefContext,
    setBriefContext,
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
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleNotebookChange = useCallback((nextNotebook: any) => {
    setWorkspaceState((prev) => {
      if (prev.status !== 'ready') return prev;
      return { ...prev, notebook: nextNotebook };
    });
  }, []);

  const handleAddCell = useCallback((cellType: 'markdown' | 'code') => {
    setWorkspaceState((prev) => {
      if (prev.status !== 'ready') return prev;
      const existingCells = Array.isArray(prev.notebook?.cells) ? [...prev.notebook.cells] : [];
      if (cellType === 'markdown') {
        existingCells.push({ cell_type: 'markdown', source: '', metadata: {} });
      } else {
        existingCells.push({ cell_type: 'code', source: '', metadata: { lang: 'python' } });
      }
      return {
        ...prev,
        notebook: {
          ...prev.notebook,
          cells: existingCells,
        },
      };
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
  const researchModesList: ResearchMode[] = SHOW_FALLBACK_UI ? ['standard', 'thorough', 'fallback'] : ['standard', 'thorough'];

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

  const showWorkspace = workspaceState.status === 'ready';
  const progressLabels: Record<typeof progress, string> = useMemo(() => ({
    idle: '',
    parsing: 'Preparing your model details…',
    asking: 'Generating lesson plan with GPT-OSS-20B…',
    importing: 'Saving and formatting the manual…',
    done: 'Manual ready! Review the workspace to continue.',
  }), []);
  const workspaceProgressLabel = progressLabels[progress];

  const handleCopyExportLink = useCallback(async () => {
    if (exportState.status !== 'success') return;
    try {
      await navigator.clipboard.writeText(exportState.url);
      setCopyStatus('success');
    } catch (err) {
      console.error('Copy failed', err);
      setCopyStatus('error');
    }
  }, [exportState]);

  const handleDownloadJson = useCallback(async () => {
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
  }, [result, workspaceTitle]);

  const handleOpenManual = useCallback(() => {
    if (!tutorialId) return;
    window.location.href = `/tutorial/${tutorialId}`;
  }, [tutorialId]);

  const handleRemix = useCallback(() => {
    if (!tutorialId) return;
    window.location.href = `/tutorial/${tutorialId}?remix=1`;
  }, [tutorialId]);

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

  const handleExport = useCallback(async (suggestedName: string) => {
    if (!result) return;
    await exportNotebook(result, suggestedName);
  }, [exportNotebook, result]);

  const workspacePane = showWorkspace ? (
    <NotebookWorkspace
      workspace={workspaceState}
      preview={manualPreview ?? undefined}
      repaired={!!result?.meta?.repaired}
      tutorialId={tutorialId || undefined}
      title={workspaceTitle}
      progressActive={progress === 'parsing' || progress === 'asking' || progress === 'importing'}
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
      toolbarActions={[
        {
          key: 'add-markdown',
          label: 'Add Markdown',
          onClick: () => handleAddCell('markdown'),
          disabled: workspaceState.status !== 'ready',
        },
        {
          key: 'add-code',
          label: 'Add Code',
          onClick: () => handleAddCell('code'),
          disabled: workspaceState.status !== 'ready',
        },
        {
          key: 'download-ipynb',
          label: 'Download .ipynb',
          onClick: handleDownloadIpynb,
          disabled: workspaceState.status !== 'ready',
        },
        {
          key: 'download-json',
          label: 'Download JSON',
          onClick: handleDownloadJson,
          disabled: workspaceState.status !== 'ready',
        },
      ]}
    />
  ) : (
    <WorkspacePlaceholder
      status={workspaceState.status}
      message={workspaceState.status === 'error' ? workspaceState.message : undefined}
      isActiveProgress={isActiveProgress}
      progressLabel={workspaceProgressLabel}
      readyHosted={readyHosted}
      readyLocal={readyLocal}
    />
  );

  return (
    <>
      <AppShell containerClassName="text-ink-900" maxWidth="wide">
        <WorkspaceSplit
          className="gap-6"
          left={
            <div className="space-y-6 pb-10 px-1 lg:px-0" data-generator-form-root="true">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h1 className="font-display text-[32px] font-black leading-[1.1] tracking-tight">Generate Manual</h1>
                  <p className="text-sm text-ink-600">Write a short brief, choose your source of truth, and export a runnable notebook in minutes.</p>
                </div>
                <Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={() => setWizardOpen(true)}>
                  Guided setup
                </Button>
              </header>
              <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
                <section className="rounded-card border border-ink-100 bg-paper-0 p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-ink-900">Notebook brief</h2>
                      <p className="text-sm text-ink-600">Give ALAIN a title and a one-paragraph description of what success looks like.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-ink-800" htmlFor="notebook-title">Title</label>
                      <input
                        id="notebook-title"
                        className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                        placeholder="e.g. Launch a responsible open-source LLM for customer support"
                        value={briefTitle}
                        onChange={(event) => setBriefTitle(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-ink-800" htmlFor="notebook-context">What should this manual cover?</label>
                      <textarea
                        id="notebook-context"
                        className="w-full min-h-[140px] rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                        placeholder="Summarise the goal, audience, tooling constraints, and any must-have steps."
                        value={briefContext}
                        onChange={(event) => setBriefContext(event.target.value)}
                      />
                      <p className="text-xs text-ink-600">This context is passed into the teacher prompt so the generated plan matches your intent.</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-card border border-ink-100 bg-paper-0 p-4 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-ink-900">Source & research</h2>
                      <p className="text-sm text-ink-600">Pick where ALAIN should pull context from and how deep the research should go.</p>
                    </div>
                    <Button variant="secondary" onClick={triggerDemoMode} type="button" className="shrink-0">Load demo preset</Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Quick presets</div>
                      <div className="flex flex-wrap gap-2">
                        {quickPresetCards.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${preset.ready ? 'border-alain-blue/40 text-alain-blue hover:border-alain-blue' : 'border-ink-200 text-ink-600 hover:border-ink-300'}`}
                            title={preset.status}
                          >
                            <span>{preset.title}</span>
                            <span className={`ml-2 text-[11px] ${preset.ready ? 'text-success-600' : 'text-warning-600'}`}>{preset.ready ? 'Ready' : 'Setup needed'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Source</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSource('hf')}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition ${source === 'hf' ? 'bg-alain-blue text-white' : 'border border-ink-200 bg-white text-ink-700 hover:border-alain-blue/40'}`}
                        >
                          Hugging Face
                        </button>
                        <button
                          type="button"
                          onClick={() => setSource('local')}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition ${source === 'local' ? 'bg-alain-blue text-white' : 'border border-ink-200 bg-white text-ink-700 hover:border-alain-blue/40'}`}
                        >
                          Local runtime
                        </button>
                        <button
                          type="button"
                          onClick={() => setSource('text')}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition ${source === 'text' ? 'bg-alain-blue text-white' : 'border border-ink-200 bg-white text-ink-700 hover:border-alain-blue/40'}`}
                        >
                          From text
                        </button>
                      </div>
                    </div>

                    {source === 'hf' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-ink-800" htmlFor="hf-url">Hugging Face model URL or owner/repo</label>
                        <input
                          id="hf-url"
                          className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                          placeholder="https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct"
                          value={hfUrl}
                          onChange={(event) => setHfUrl(event.target.value)}
                        />
                        {hfInfo.ok && hfInfo.repo && <HFInfoInline repo={hfInfo.repo} />}
                      </div>
                    )}

                    {source === 'text' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-ink-800" htmlFor="text-source">Paste raw text</label>
                        <textarea
                          id="text-source"
                          className="w-full min-h-[140px] rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                          placeholder="Paste docs, articles, or notes to turn into a lesson."
                          value={rawTextInput}
                          onChange={(event) => setRawTextInput(event.target.value)}
                        />
                      </div>
                    )}

                    {source === 'local' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-ink-800" htmlFor="local-model">Local model identifier</label>
                        {availableModels.length > 0 ? (
                          <select
                            id="local-model"
                            className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                            value={targetModel}
                            onChange={(event) => setTargetModel(event.target.value)}
                          >
                            <option value="">Select a detected model…</option>
                            {availableModels.map((model) => (
                              <option key={model} value={model}>{labelsByName[model] || model}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="local-model"
                            className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                            placeholder="gpt-oss-20b"
                            value={targetModel}
                            onChange={(event) => setTargetModel(event.target.value)}
                          />
                        )}
                        <p className="text-xs text-ink-600">Select from detected models or paste a runtime identifier.</p>
                        {providersError && <div className="text-xs text-red-700">{providersError}</div>}
                      </div>
                    )}

                    {source === 'local' && availableModels.length === 0 && (
                      <div className="rounded-card border border-ink-100 bg-paper-50 p-3 text-sm text-ink-900">
                        <div className="font-medium">No local models detected</div>
                        <div className="text-xs text-ink-600">Use Hosted (Poe) for an instant demo, or open the LM Studio Explorer to download a model locally.</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button variant="secondary" type="button" className="text-sm" onClick={() => { setSource('hf'); setTeacherProvider('poe'); }}>Switch to Hosted</Button>
                          <Button variant="secondary" type="button" className="text-sm" onClick={() => { window.location.href = '/lmstudio'; }}>Open Explorer</Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Research depth</div>
                      <div className="flex flex-wrap gap-2">
                        {researchModesList.map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setResearchMode(mode);
                              if (mode === 'fallback' && SHOW_FALLBACK_UI) {
                                setSource('text');
                                setForceFallback(true);
                              } else if (forceFallback) {
                                setForceFallback(false);
                              }
                            }}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${researchMode === mode ? 'bg-alain-blue text-white' : 'border border-ink-200 bg-white text-ink-700 hover:border-alain-blue/40'}`}
                          >
                            {researchCopy[mode].label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-ink-600">{researchCopy[researchMode].note}</p>
                    </div>

                    {SHOW_FALLBACK_UI && (
                      <div className="rounded-card border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-ink-900">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={forceFallback} onChange={(event) => setForceFallback(event.target.checked)} />
                          Force web-only fallback (no backend) for From Text.
                        </label>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" type="button" className="text-sm" onClick={triggerExampleHosted}>Example: hosted preset</Button>
                      <Button variant="secondary" type="button" className="text-sm" onClick={triggerExampleLocal}>Example: local (gpt-oss-20b)</Button>
                    </div>

                    <div className="border-t border-ink-100 pt-3 text-sm text-ink-700">
                      <div className="mb-1 font-medium text-ink-900">Try these popular models</div>
                      <div className="flex flex-wrap gap-2">
                        {['meta-llama/Meta-Llama-3.1-8B-Instruct', 'google/gemma-2-9b-it', 'mistralai/Mistral-7B-Instruct-v0.3'].map((model) => (
                          <Button key={model} variant="secondary" type="button" className="px-2 py-1 text-xs" onClick={() => setHfUrl(model)}>{model}</Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-card border border-ink-100 bg-paper-0 p-4 space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-ink-900">Delivery & runtime</h2>
                    <p className="text-sm text-ink-600">Choose the audience difficulty, teachers, and target runtime.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ink-800" htmlFor="difficulty">Difficulty</label>
                      <select
                        id="difficulty"
                        className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                        value={difficulty}
                        onChange={(event) => setDifficulty(event.target.value)}
                      >
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
                        Advanced provider settings
                        <span className="text-xs font-normal text-ink-600 transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="mt-3 space-y-3 pl-1">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-ink-800">Teacher provider</label>
                          <select className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" value={teacherProvider} onChange={(event) => setTeacherProvider(event.target.value as any)}>
                            <option value="poe">{providerExplainers.poe.title}</option>
                            <option value="openai-compatible">{providerExplainers['openai-compatible'].title}</option>
                          </select>
                          <p className="text-xs text-ink-600">{teacherProviderHelper || 'Choose where the teacher model will run.'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-ink-800">Teacher model</label>
                          <select className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" value={teacherModel} onChange={(event) => setTeacherModel(event.target.value as any)}>
                            <option value="GPT-OSS-20B">GPT-OSS-20B (default)</option>
                            {ALLOW_120B && <option value="GPT-OSS-120B">GPT-OSS-120B (not recommended)</option>}
                          </select>
                          <p className="text-xs text-ink-600">Stay on GPT-OSS-20B for the most reliable JSON output.</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-ink-800">Target provider</label>
                          <select className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" value={targetProvider} onChange={(event) => setTargetProvider(event.target.value)}>
                            {providers.map((provider) => (
                              <option key={provider.name} value={provider.name}>
                                {providerExplainers[provider.name]?.title || provider.name}
                              </option>
                            ))}
                          </select>
                          {targetProviderHelper && <p className="text-xs text-ink-600">{targetProviderHelper}</p>}
                          <input
                            className="w-full rounded-[10px] border border-ink-100 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                            placeholder="Optional model override (e.g. gpt-oss-20b)"
                            value={targetModel}
                            onChange={(event) => setTargetModel(event.target.value)}
                          />
                          <p className="text-xs text-ink-600">Leave blank to use the provider's default deployment.</p>
                        </div>
                      </div>
                    </details>

                    <EnvironmentStatusCard envBanner={envBanner} readyHosted={readyHosted} readyLocal={readyLocal} />
                  </div>

                  <div className="flex flex-col gap-4 border-t border-ink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                      {loading ? 'Generating…' : 'Generate manual'}
                    </Button>
                    {isActiveProgress && (
                      <div className="flex items-center gap-2 text-sm text-ink-700" role="status" aria-live="polite">
                        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-alain-blue" aria-hidden="true" />
                        <span>{workspaceProgressLabel}</span>
                      </div>
                    )}
                    {!isActiveProgress && progress === 'done' && (
                      <div className="flex items-center gap-2 text-sm text-success-700" role="status" aria-live="polite">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-success-600" aria-hidden="true" />
                        <span>{progressLabels.done}</span>
                      </div>
                    )}
                  </div>
                </section>
              </form>

              {error && (
                <div className="rounded-card border border-red-200 bg-red-50 p-3 text-red-800">
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
                <div className="space-y-2 rounded-card border border-ink-100 bg-paper-0 p-3 text-sm text-ink-700">
                  <div className="font-medium text-ink-900">Try automatic fixes</div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">
                    <label className="inline-flex items-center gap-1" title="Add 2–3 sentence description if missing"><input type="checkbox" defaultChecked readOnly /> add_description</label>
                    <label className="inline-flex items-center gap-1" title="Create an intro step if steps are missing"><input type="checkbox" defaultChecked readOnly /> add_intro_step</label>
                    <label className="inline-flex items-center gap-1" title="Limit to ~3 strong steps"><input type="checkbox" defaultChecked readOnly /> compact_steps</label>
                  </div>
                  <Button variant="secondary" type="button" disabled={repairing} onClick={() => { void onAutoFix(); }}>
                    Auto-fix and Import
                  </Button>
                </div>
              )}
            </div>
          }
          right={workspacePane}
        />
        <GenerateWizard open={wizardOpen} onClose={() => setWizardOpen(false)} viewModel={props} />
      </AppShell>
      {snackbar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-card border border-ink-100 bg-paper-0 px-4 py-2 text-ink-900 shadow-card">{snackbar}</div>
      )}
    </>
  );
}


function WorkspacePlaceholder({
  status,
  message,
  isActiveProgress,
  progressLabel,
  readyHosted,
  readyLocal,
}: {
  status: WorkspaceState['status'];
  message?: string;
  isActiveProgress: boolean;
  progressLabel: string;
  readyHosted: boolean;
  readyLocal: boolean;
}) {
  const statusHeading = status === 'loading'
    ? 'Preparing preview…'
    : status === 'error'
      ? 'Preview unavailable'
      : 'Notebook preview will appear here';
  const statusCopy = status === 'error'
    ? message || 'Open the generated manual to continue.'
    : isActiveProgress
      ? progressLabel || 'Generating your manual…'
      : 'Complete the brief and run Generate to see the manual preview here.';

  return (
    <div className="flex h-full items-center justify-center rounded-card border border-ink-100 bg-paper-0 px-6 py-10 text-center">
      <div className="max-w-md space-y-4 text-ink-700">
        <h2 className="text-lg font-semibold text-ink-900">{statusHeading}</h2>
        <p className="text-sm text-ink-600">{statusCopy}</p>
        <div className="rounded-card border border-ink-100 bg-paper-50 p-3 text-left text-xs text-ink-600">
          <div className="font-medium text-ink-800">Environment readiness</div>
          <div className="mt-2 space-y-1">
            <div className={`flex items-center gap-2 ${readyHosted ? 'text-success-700' : 'text-ink-600'}`}>
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${readyHosted ? 'bg-success-600' : 'bg-warning-500'}`} aria-hidden="true" />
              <span>Hosted (Poe) {readyHosted ? 'configured' : 'needs API key'}</span>
            </div>
            <div className={`flex items-center gap-2 ${readyLocal ? 'text-success-700' : 'text-ink-600'}`}>
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${readyLocal ? 'bg-success-600' : 'bg-warning-500'}`} aria-hidden="true" />
              <span>Local runtime {readyLocal ? 'detected' : 'pending setup in Settings'}</span>
            </div>
          </div>
        </div>
        <ul className="space-y-1 text-left text-xs text-ink-500">
          <li>• Outline your goal in the notebook brief.</li>
          <li>• Select a source or load a preset.</li>
          <li>• Pick a difficulty and click Generate.</li>
        </ul>
      </div>
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
      <p className="text-xs text-ink-600">Update providers from Settings → Environment Status or re-run the setup wizard to change these defaults.</p>
      <Link
        href="/onboarding"
        className="inline-flex h-9 items-center rounded-[10px] border border-ink-200 bg-white px-3 text-xs font-medium text-ink-900 hover:bg-paper-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
      >
        Open .env setup wizard
      </Link>
    </div>
  );
}

function HFInfoInline({ repo }: { repo: string }) {
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
