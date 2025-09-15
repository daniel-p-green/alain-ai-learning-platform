"use client";
import { useEffect, useRef, useState } from "react";
import { backendUrl } from "../../lib/backend";
import { useSettings } from "../onboarding-settings/useSettings";
import { Button } from "../../components/Button";
import { PreviewPanel } from "../../components/PreviewPanel";
import type { ProviderInfo, ProviderModel } from "../../lib/types";
import LocalSetupHelper from "../../components/LocalSetupHelper";
import api, { APIClientError, parseHfRef } from "../../lib/api";

export default function GenerateLessonPage() {
  const { promptMode } = useSettings();
  const [hfUrl, setHfUrl] = useState("");
  const [source, setSource] = useState<'hf'|'local'|'text'>("hf");
  const [rawTextInput, setRawTextInput] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [teacherProvider, setTeacherProvider] = useState<"poe" | "openai-compatible">(() => (typeof window !== 'undefined' && (window.localStorage.getItem('alain.ui.promptMode') === 'poe')) ? 'poe' : 'openai-compatible');
  const [teacherModel, setTeacherModel] = useState<'GPT-OSS-20B' | 'GPT-OSS-120B'>('GPT-OSS-20B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [progress, setProgress] = useState<"idle" | "parsing" | "asking" | "importing" | "done">("idle");
  type ModelMaker = { name: string; org_type: string; homepage?: string|null; license?: string|null; repo?: string|null };
  type Preview = { title: string; description: string; learning_objectives: string[]; first_step?: { title: string; content: string } | null; model_maker?: ModelMaker | null };
  type ResultMeta = { repaired?: boolean; reasoning_summary?: string };
  type GenerateResult = { tutorialId: number | string; meta?: ResultMeta; preview?: Preview };
  const [result, setResult] = useState<null | GenerateResult>(null);
  const [repairing, setRepairing] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [targetProvider, setTargetProvider] = useState<string>("poe");
  const [targetModel, setTargetModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [labelsByName, setLabelsByName] = useState<Record<string,string>>({});
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [envBanner, setEnvBanner] = useState<any>(null);
  const [forceFallback, setForceFallback] = useState(false);
  const SHOW_FALLBACK_UI = process.env.NEXT_PUBLIC_ENABLE_FALLBACK_UI === '1';
  const ALLOW_120B = process.env.NEXT_PUBLIC_TEACHER_ALLOW_120B === '1';
  const formRef = useRef<HTMLFormElement | null>(null);
  // Research mode: controls accuracy vs time tradeoff
  const [researchMode, setResearchMode] = useState<'standard'|'thorough'|'fallback'>("standard");
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

  // Prefill from query params for quick demo links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const hf = q.get('hf');
    const provider = q.get('provider');
    const m = q.get('model');
    if (hf) { setSource('hf'); setHfUrl(hf); }
    if (m) setTargetModel(m);
    if (provider) {
      if (provider === 'local') setSource('local');
      setTargetProvider(provider);
    }
  }, []);

  // Keep teacher provider aligned with Settings promptMode
  useEffect(() => {
    const desired: "poe" | "openai-compatible" = (promptMode === 'poe') ? 'poe' : 'openai-compatible';
    setTeacherProvider(prev => prev === desired ? prev : desired);
  }, [promptMode]);

  // Provider capabilities
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  function parseHfInput(input: string): { ok: boolean; url: string; repo?: string } {
    const r = parseHfRef(input);
    if (!r.ok) return { ok: false, url: input };
    return { ok: true, url: `https://huggingface.co/${r.repo}`, repo: r.repo };
  }

  // Load providers once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setProvidersLoading(true);
        const resp = await fetch('/api/providers');
        const data = await resp.json();
        if (!alive) return;
        setProviders(data.providers || []);
        if (data.defaultProvider) setTargetProvider(data.defaultProvider);
        setProvidersError(null);
      } catch (e: unknown) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Failed to load providers';
        setProvidersError(msg);
      } finally {
        if (alive) setProvidersLoading(false);
      }
    })();
    (async () => {
      try {
        // Prefer dedicated models endpoint; fall back to setup probe
        const resp = await fetch('/api/providers/models', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (!alive) return;
          const arr: string[] = Array.isArray(data?.models) ? data.models : [];
          setAvailableModels(arr);
          const labels: Record<string,string> = {};
          (data?.labelsByName && typeof data.labelsByName === 'object') && Object.assign(labels, data.labelsByName);
          setLabelsByName(labels);
          return;
        }
      } catch {}
      // Fallback to generic setup probe
      try {
        const resp2 = await fetch('/api/setup', { cache: 'no-store' });
        if (!resp2.ok) return;
        const data2 = await resp2.json();
        if (!alive) return;
        if (Array.isArray(data2?.availableModels)) setAvailableModels(data2.availableModels);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // Default to Local Runtime when models are detected; otherwise default to Hosted/HF
  useEffect(() => {
    if (availableModels.length > 0) {
      setSource('local');
      setTargetModel(prev => prev || availableModels[0]);
    } else {
      setSource('hf');
    }
  }, [availableModels]);

  // Read environment probe for confidence banner
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/setup', { cache: 'no-store' });
        const data = await resp.json();
        setEnvBanner(data);
      } catch {}
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("parsing");
    try {
      let resp: Response;
      if (source === 'local') {
        if (!targetModel.trim()) {
          setError("Select or enter a local model id");
          setLoading(false);
          setProgress("idle");
          return;
        }
        setProgress("asking");
        resp = await fetch("/api/generate-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: targetModel.trim(), difficulty, includeAssessment: true, provider: 'openai-compatible', teacherModel, targetProvider, targetModel })
        });
      } else if (source === 'text') {
        if (!rawTextInput.trim()) {
          setError("Paste some text to generate a lesson from.");
          setLoading(false);
          setProgress("idle");
          return;
        }
        setProgress("asking");
        // In text mode, researchMode 'fallback' is most relevant; still pass flags for clarity
        resp = await fetch(`/api/generate-from-text${forceFallback || researchMode==='fallback' ? '?fallback=1' : ''}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          })
        });
      } else {
        const parsed = parseHfInput(hfUrl);
        if (!parsed.ok) {
          setError("Enter a valid Hugging Face URL or org/model (owner/repo)");
          setLoading(false);
          setProgress("idle");
          return;
        }
        setProgress("asking");
        resp = await fetch("/api/generate-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          })
        });
      }
      const data = await api.parseGenerateResponse(resp);
      setProgress("done");
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
    } catch (e: unknown) {
      if (e instanceof APIClientError) {
        setError(e.message);
        setErrorDetails(e.details || []);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setErrorDetails([]);
      }
      setProgress("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4 text-ink-900">
      <h1 className="text-2xl font-black font-display">Generate Manual</h1>
      <p className="text-sm text-ink-700">Recommended defaults. Works offline or hosted. Export to Jupyter/Colab.</p>
      {envBanner && (
        <div className="mt-2 text-xs text-ink-700 border border-ink-100 rounded-card bg-paper-0 p-2">
          <span className="font-medium">Env:</span> {envBanner.offlineMode ? 'Offline' : 'Hosted'} · Provider: {envBanner.teacherProvider || 'unknown'} · Base URL: {envBanner.openaiBaseUrl || 'n/a'}
        </div>
      )}
      {envBanner && (
        (() => {
          const readyHosted = envBanner.teacherProvider === 'poe' && !!envBanner.poeConfigured;
          const readyLocal = !!envBanner.offlineMode && !!envBanner.openaiBaseUrl;
          if (readyHosted || readyLocal) return null;
          return (
            <div className="mt-2 p-3 rounded-card bg-paper-50 border border-ink-100 text-sm text-ink-900">
              <div className="font-medium">Setup needed</div>
              <div className="text-ink-700">Use Settings → Environment Status to apply a quick preset (Hosted Poe or Local GPT‑OSS), then run tests. Or click one of the example buttons below.</div>
            </div>
          );
        })()
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setSource('hf');
            setTeacherProvider('poe');
            setHfUrl('meta-llama/Meta-Llama-3.1-8B-Instruct');
            setSnackbar('Generating…');
            setTimeout(() => formRef.current?.requestSubmit(), 0);
          }}
        >Use Example (Hosted)</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setSource('local');
            setTargetProvider('openai-compatible');
            // LM Studio commonly exposes this as `gpt-oss-20b`; adjust if your local id differs
            setTargetModel('gpt-oss-20b');
            setSnackbar('Generating…');
            setTimeout(() => formRef.current?.requestSubmit(), 0);
          }}
        >Use Example (Local: gpt-oss-20b)</Button>
      </div>
      {SHOW_FALLBACK_UI && (
        <div className="mt-2 p-3 rounded-card border border-yellow-200 bg-yellow-50 text-xs text-ink-900">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={forceFallback} onChange={(e)=>setForceFallback(e.target.checked)} />
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
        <Button variant={source==='hf'?'accent':'secondary'} onClick={()=>setSource('hf')}>From Hugging Face</Button>
        <Button variant={source==='local'?'accent':'secondary'} onClick={()=>setSource('local')}>From Local Runtime</Button>
        <Button variant={source==='text'?'accent':'secondary'} onClick={()=>setSource('text')}>From Text</Button>
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
            {(() => { const r = parseHfRef(hfUrl); return r.ok ? <HFInfoInline repo={r.repo!} /> : null; })()}
            <div className="rounded-card border border-ink-100 bg-paper-50 p-3">
              <div className="text-sm font-medium text-ink-900">Research mode</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={()=> setResearchMode('standard')} className={`px-3 py-1 rounded-card border ${researchMode==='standard'?'border-alain-blue text-alain-blue':'border-ink-100 text-ink-800'} bg-white`}>Standard</button>
                <button type="button" onClick={()=> setResearchMode('thorough')} className={`px-3 py-1 rounded-card border ${researchMode==='thorough'?'border-alain-blue text-alain-blue':'border-ink-100 text-ink-800'} bg-white`}>Thorough</button>
                {SHOW_FALLBACK_UI && (
                  <button type="button" onClick={()=> { setResearchMode('fallback'); setSource('text'); setForceFallback(true); }} className={`px-3 py-1 rounded-card border ${researchMode==='fallback'?'border-alain-blue text-alain-blue':'border-ink-100 text-ink-800'} bg-white`}>Web-only</button>
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
                onChange={(e)=> setTargetModel(e.target.value)}
              >
                <option value="">Select a model…</option>
                {availableModels.map((m)=> (
                  <option key={m} value={m}>{labelsByName[m] || m}</option>
                ))}
              </select>
            ) : (
              <input
                className="w-full p-2 rounded-card bg-paper-0 border border-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                placeholder="gpt-oss:20b"
                value={targetModel}
                onChange={(e)=> setTargetModel(e.target.value)}
              />
            )}
            <div className="rounded-card border border-ink-100 bg-paper-50 p-3">
              <div className="text-sm font-medium text-ink-900">Target provider/model</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={targetProvider} onChange={(e)=> setTargetProvider(e.target.value)}>
                  {providers.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <input className="p-2 rounded-card bg-paper-0 border border-ink-100" placeholder="Optional override" value={targetModel} onChange={(e)=> setTargetModel(e.target.value)} />
              </div>
              {providersError && <div className="text-xs text-red-700 mt-1">{providersError}</div>}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-ink-700">Difficulty</label>
          <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={difficulty} onChange={(e)=> setDifficulty(e.target.value)}>
            {['beginner','intermediate','advanced'].map((d)=> <option key={d} value={d}>{d}</option>)}
          </select>
          <label className="text-sm text-ink-700">Teacher</label>
          <select className="p-2 rounded-card bg-paper-0 border border-ink-100" value={teacherProvider} onChange={(e)=> setTeacherProvider(e.target.value as any)}>
            <option value="poe">Poe (hosted)</option>
            <option value="openai-compatible">OpenAI-compatible</option>
          </select>
          <label className="text-sm text-ink-700">Teacher model</label>
          <select
            className="p-2 rounded-card bg-paper-0 border border-ink-100"
            value={teacherModel}
            onChange={(e)=> setTeacherModel(e.target.value as any)}
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
              {errorDetails.map((d, i) => (
                <li key={i}>{d}</li>
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
              onClick={async () => {
                setRepairing(true);
                const parsed = parseHfInput(hfUrl);
                const resp = await fetch('/api/repair-lesson', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ hfUrl: parsed.url, difficulty, fixes: ['add_description','add_intro_step','compact_steps'] })
                });
                const data = await resp.json();
                setRepairing(false);
                if (!data.success) {
                  setError(data?.error?.message || 'Repair failed');
                  setErrorDetails(Array.isArray(data?.error?.details) ? data.error.details : []);
                } else {
                  setError(null);
                  setErrorDetails([]);
                  setResult({ tutorialId: data.tutorialId, preview: data.preview });
                  setSnackbar('Repaired and imported successfully');
                  setTimeout(() => setSnackbar(null), 2000);
                }
              }}
            >Auto-fix and Import</Button>
          </div>
        </div>
      )}

      {result && (
        <PreviewPanel
          tutorialId={result.tutorialId}
          preview={result.preview as any}
          repaired={!!result.meta?.repaired}
          onExport={async (suggestedName) => {
            const id = String(result.tutorialId);
            let nb: any = null;
            if (id.startsWith('local-')) {
              const res = await fetch(`/api/export/colab/local/${id}`);
              nb = await res.json();
            } else {
              const res = await fetch(backendUrl(`/export/colab/${id}`));
              nb = await res.json();
            }
            const ***REMOVED*** = new Blob([JSON.stringify(nb, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(***REMOVED***);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${suggestedName}.ipynb`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        />
      )}

      {/* Quick-start HF links */}
        <div className="mt-6 text-sm text-ink-700">
          <div className="font-medium text-ink-900 mb-1">Try these popular models</div>
          <div className="flex flex-wrap gap-2">
            {['meta-llama/Meta-Llama-3.1-8B-Instruct','google/gemma-2-9b-it','mistralai/Mistral-7B-Instruct-v0.3'].map(m => (
              <Button key={m} variant="secondary" className="px-2 py-1 text-xs" onClick={() => setHfUrl(m)}>{m}</Button>
            ))}
          </div>
        </div>

      {snackbar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-card bg-paper-0 border border-ink-100 text-ink-900 shadow-card">{snackbar}</div>
      )}
    </div>
  );
}

function humanSize(bytes: number): string {
  const units = ['B','KB','MB','GB','TB'];
  let n = Math.max(0, Number(bytes || 0));
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  const prec = n < 10 && i > 0 ? 1 : 0;
  return `${n.toFixed(prec)} ${units[i]}`;
}

function OllamaContextHint({ modelName }: { modelName: string }) {
  const [ctx, setCtx] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = new URL('/api/providers/ollama/show', window.location.origin);
        u.searchParams.set('name', modelName);
        const resp = await fetch(u.toString(), { cache: 'no-store' });
        if (!resp.ok) return;
        const data = await resp.json();
        if (!alive) return;
        const v = Number(data?.info?.context_length || 0);
        if (v > 0) setCtx(v);
      } catch {}
    })();
    return () => { alive = false; };
  }, [modelName]);
  if (!ctx) return null;
  return (
    <div className="text-xs text-ink-700">Context length: ~{ctx} tokens</div>
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
        setInfo({ license: (data.license as any) ?? null, tags: (data as any).tags?.slice?.(0, 6) || [], downloads: (data.downloads as any) ?? null });
      } catch {}
    })();
    return () => { alive = false; };
  }, [repo]);
  if (!info) return null;
  return (
    <div className="mt-2 text-xs text-ink-700 border border-ink-100 rounded-card bg-paper-0 p-2 flex flex-wrap items-center gap-2">
      {info.license && <span className="px-2 py-0.5 rounded-card border border-ink-100 bg-paper-0">License: {info.license}</span>}
      {typeof info.downloads === 'number' && <span className="px-2 py-0.5 rounded-card border border-ink-100 bg-paper-0">Downloads: {info.downloads}</span>}
      {info.tags && info.tags.length > 0 && (
        <span className="flex items-center gap-1 flex-wrap">
          {info.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-card border border-ink-100 bg-paper-0">{t}</span>
          ))}
        </span>
      )}
    </div>
  );
}
