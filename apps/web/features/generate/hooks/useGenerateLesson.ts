'use client';

import { useEffect, useRef, useState } from 'react';
import { backendUrl } from '../../../lib/backend';
import type { ProviderInfo } from '../../../lib/types';
import api, { APIClientError, parseHfRef } from '../../../lib/api';

type Source = 'hf' | 'local' | 'text';

export type ResearchMode = 'standard' | 'thorough' | 'fallback';

const SHOW_FALLBACK_UI = process.env.NEXT_PUBLIC_ENABLE_FALLBACK_UI === '1';
const ALLOW_120B = process.env.NEXT_PUBLIC_TEACHER_ALLOW_120B === '1';

const researchCopy = {
  standard: {
    label: 'Standard research',
    note: 'Fetches model info from Hugging Face and generates a solid baseline (~2–6s).',
    includeAssessment: true,
    includeReasoning: false,
  },
  thorough: {
    label: 'Thorough research',
    note: 'Adds reasoning summary and deeper checks for higher accuracy (~5–12s).',
    includeAssessment: true,
    includeReasoning: true,
  },
  fallback: {
    label: 'Web-only fallback',
    note: 'No backend research; creates a minimal local lesson for demos/offline.',
    includeAssessment: false,
    includeReasoning: false,
  },
} as const;

type ModelMaker = {
  name: string;
  org_type: string;
  homepage?: string | null;
  license?: string | null;
  repo?: string | null;
};

type Preview = {
  title: string;
  description: string;
  learning_objectives: string[];
  first_step?: { title: string; content: string } | null;
  model_maker?: ModelMaker | null;
};

type ResultMeta = {
  repaired?: boolean;
  reasoning_summary?: string;
};

export type GenerateResult = {
  tutorialId: number | string;
  meta?: ResultMeta;
  preview?: Preview;
};

interface UseGenerateLessonOptions {
  promptMode?: string | null;
}

export interface UseGenerateLessonResult {
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  hfUrl: string;
  setHfUrl: (value: string) => void;
  source: Source;
  setSource: (value: Source) => void;
  rawTextInput: string;
  setRawTextInput: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  teacherProvider: 'poe' | 'openai-compatible';
  setTeacherProvider: (value: 'poe' | 'openai-compatible') => void;
  teacherModel: 'GPT-OSS-20B' | 'GPT-OSS-120B';
  setTeacherModel: (value: 'GPT-OSS-20B' | 'GPT-OSS-120B') => void;
  loading: boolean;
  error: string | null;
  errorDetails: string[];
  progress: 'idle' | 'parsing' | 'asking' | 'importing' | 'done';
  result: GenerateResult | null;
  repairing: boolean;
  providers: ProviderInfo[];
  providersError: string | null;
  targetProvider: string;
  setTargetProvider: (value: string) => void;
  targetModel: string;
  setTargetModel: (value: string) => void;
  availableModels: string[];
  labelsByName: Record<string, string>;
  snackbar: string | null;
  envBanner: any;
  forceFallback: boolean;
  setForceFallback: (value: boolean) => void;
  researchMode: ResearchMode;
  setResearchMode: (mode: ResearchMode) => void;
  SHOW_FALLBACK_UI: boolean;
  ALLOW_120B: boolean;
  researchCopy: typeof researchCopy;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onAutoFix: () => Promise<void>;
  triggerExampleHosted: () => void;
  triggerExampleLocal: () => void;
  exportNotebook: (result: GenerateResult, suggestedName: string) => Promise<void>;
  submitForm: () => void;
}

export function useGenerateLesson({ promptMode }: UseGenerateLessonOptions): UseGenerateLessonResult {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [hfUrl, setHfUrl] = useState('');
  const [source, setSource] = useState<Source>('hf');
  const [rawTextInput, setRawTextInput] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [teacherProvider, setTeacherProvider] = useState<'poe' | 'openai-compatible'>(
    () => (typeof window !== 'undefined' && window.localStorage.getItem('alain.ui.promptMode') === 'poe')
      ? 'poe'
      : 'openai-compatible'
  );
  const [teacherModel, setTeacherModel] = useState<'GPT-OSS-20B' | 'GPT-OSS-120B'>('GPT-OSS-20B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [progress, setProgress] = useState<'idle' | 'parsing' | 'asking' | 'importing' | 'done'>('idle');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [repairing, setRepairing] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [targetProvider, setTargetProvider] = useState('poe');
  const [targetModel, setTargetModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [labelsByName, setLabelsByName] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [envBanner, setEnvBanner] = useState<any>(null);
  const [forceFallback, setForceFallback] = useState(false);
  const [researchMode, setResearchMode] = useState<ResearchMode>('standard');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const hf = q.get('hf');
    const provider = q.get('provider');
    const model = q.get('model');
    if (hf) {
      setSource('hf');
      setHfUrl(hf);
    }
    if (model) setTargetModel(model);
    if (provider) {
      if (provider === 'local') setSource('local');
      setTargetProvider(provider);
    }
  }, []);

  useEffect(() => {
    const desired: 'poe' | 'openai-compatible' = promptMode === 'poe' ? 'poe' : 'openai-compatible';
    setTeacherProvider((prev) => (prev === desired ? prev : desired));
  }, [promptMode]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await fetch('/api/providers');
        const data = await resp.json();
        if (!alive) return;
        setProviders(data.providers || []);
        if (data.defaultProvider) setTargetProvider(data.defaultProvider);
        setProvidersError(null);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Failed to load providers';
        setProvidersError(msg);
      }
    })();
    (async () => {
      try {
        const resp = await fetch('/api/providers/models', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (!alive) return;
          const arr: string[] = Array.isArray(data?.models) ? data.models : [];
          setAvailableModels(arr);
          const labels: Record<string, string> = {};
          if (data?.labelsByName && typeof data.labelsByName === 'object') {
            Object.assign(labels, data.labelsByName);
          }
          setLabelsByName(labels);
          return;
        }
      } catch {}
      try {
        const resp2 = await fetch('/api/setup', { cache: 'no-store' });
        if (!resp2.ok) return;
        const data2 = await resp2.json();
        if (!alive) return;
        if (Array.isArray(data2?.availableModels)) setAvailableModels(data2.availableModels);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (availableModels.length > 0) {
      setSource('local');
      setTargetModel((prev) => prev || availableModels[0]);
    } else {
      setSource('hf');
    }
  }, [availableModels]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await fetch('/api/setup', { cache: 'no-store' });
        const data = await resp.json();
        if (!alive) return;
        setEnvBanner(data);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  function parseHfInput(input: string): { ok: boolean; url: string; repo?: string } {
    const parsed = parseHfRef(input);
    if (!parsed.ok) return { ok: false, url: input };
    return { ok: true, url: `https://huggingface.co/${parsed.repo}`, repo: parsed.repo };
  }

  function requestSubmitSoon() {
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  function submitForm() {
    formRef.current?.requestSubmit();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress('parsing');
    try {
      let resp: Response;
      if (source === 'local') {
        if (!targetModel.trim()) {
          setError('Select or enter a local model id');
          setLoading(false);
          setProgress('idle');
          return;
        }
        setProgress('asking');
        resp = await fetch('/api/generate-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: targetModel.trim(),
            difficulty,
            includeAssessment: true,
            provider: 'openai-compatible',
            teacherModel,
            targetProvider,
            targetModel,
          }),
        });
      } else if (source === 'text') {
        if (!rawTextInput.trim()) {
          setError('Paste some text to generate a lesson from.');
          setLoading(false);
          setProgress('idle');
          return;
        }
        setProgress('asking');
        const fallbackParam = forceFallback || researchMode === 'fallback' ? '?fallback=1' : '';
        resp = await fetch(`/api/generate-from-text${fallbackParam}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textContent: rawTextInput,
            difficulty,
            includeAssessment: researchCopy[researchMode].includeAssessment,
            showReasoning: researchCopy[researchMode].includeReasoning,
            researchLevel: researchMode,
            provider: teacherProvider,
            teacherModel,
            targetProvider,
            targetModel,
          }),
        });
      } else {
        const parsed = parseHfInput(hfUrl);
        if (!parsed.ok) {
          setError('Enter a valid Hugging Face URL or org/model (owner/repo)');
          setLoading(false);
          setProgress('idle');
          return;
        }
        setProgress('asking');
        resp = await fetch('/api/generate-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hfUrl: parsed.url,
            difficulty,
            includeAssessment: researchCopy[researchMode].includeAssessment,
            showReasoning: researchCopy[researchMode].includeReasoning,
            researchLevel: researchMode,
            provider: teacherProvider,
            teacherModel,
            targetProvider,
            targetModel,
          }),
        });
      }
      const data = await api.parseGenerateResponse(resp);
      setProgress('done');
      setResult({
        tutorialId: data.tutorialId,
        meta: data.meta,
        preview: data.preview
          ? {
              ...data.preview,
              description: (data.preview as any).description || '',
              first_step: data.preview.first_step
                ? {
                    title: (data.preview.first_step as any).title || '',
                    content: (data.preview.first_step as any).content || '',
                  }
                : null,
            }
          : undefined,
      });
      setSnackbar('Manual ready! Open it or export to Colab.');
      setTimeout(() => setSnackbar(null), 2500);
    } catch (err) {
      if (err instanceof APIClientError) {
        setError(err.message);
        setErrorDetails(err.details || []);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setErrorDetails([]);
      }
      setProgress('idle');
    } finally {
      setLoading(false);
    }
  }

  async function onAutoFix() {
    if (source !== 'hf') return;
    const parsed = parseHfInput(hfUrl);
    setRepairing(true);
    try {
      const resp = await fetch('/api/repair-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hfUrl: parsed.url,
          difficulty,
          fixes: ['add_description', 'add_intro_step', 'compact_steps'],
        }),
      });
      const data = await resp.json();
      if (!data.success) {
        setError(data?.error?.message || 'Repair failed');
        setErrorDetails(Array.isArray(data?.error?.details) ? data.error.details : []);
        return;
      }
      setError(null);
      setErrorDetails([]);
      setResult({ tutorialId: data.tutorialId, preview: data.preview });
      setSnackbar('Repaired and imported successfully');
      setTimeout(() => setSnackbar(null), 2000);
    } finally {
      setRepairing(false);
    }
  }

  function triggerExampleHosted() {
    setSource('hf');
    setTeacherProvider('poe');
    setHfUrl('meta-llama/Meta-Llama-3.1-8B-Instruct');
    setSnackbar('Generating…');
    requestSubmitSoon();
  }

  function triggerExampleLocal() {
    setSource('local');
    setTargetProvider('openai-compatible');
    setTargetModel('gpt-oss-20b');
    setSnackbar('Generating…');
    requestSubmitSoon();
  }

  async function exportNotebook(currentResult: GenerateResult, suggestedName: string) {
    const id = String(currentResult.tutorialId);
    let notebook: any = null;
    if (id.startsWith('local-')) {
      const res = await fetch(`/api/export/colab/local/${id}`);
      notebook = await res.json();
    } else {
      const res = await fetch(backendUrl(`/export/colab/${id}`));
      notebook = await res.json();
    }
    const notebookBlob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(notebookBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${suggestedName}.ipynb`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return {
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
    submitForm,
  };
}
