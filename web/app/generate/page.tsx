"use client";
import { useEffect, useState } from "react";
import { backendUrl } from "../../lib/backend";
import { Button } from "../../components/Button";
import { PreviewPanel } from "../../components/PreviewPanel";
import type { ProviderInfo, ProviderModel } from "../../lib/types";

export default function GenerateLessonPage() {
  const [hfUrl, setHfUrl] = useState("");
  const [source, setSource] = useState<'hf'|'local'>("hf");
  const [difficulty, setDifficulty] = useState("beginner");
  const [teacherProvider, setTeacherProvider] = useState<"poe" | "openai-compatible">("poe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [progress, setProgress] = useState<"idle" | "parsing" | "asking" | "importing" | "done">("idle");
  type ModelMaker = { name: string; org_type: string; homepage?: string|null; license?: string|null; repo?: string|null };
  type Preview = { title: string; description: string; learning_objectives: string[]; first_step?: { title: string; content: string } | null; model_maker?: ModelMaker | null };
  type ResultMeta = { repaired?: boolean; reasoning_summary?: string };
  type GenerateResult = { tutorialId: number; meta?: ResultMeta; preview?: Preview };
  const [result, setResult] = useState<null | GenerateResult>(null);
  const [repairing, setRepairing] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [targetProvider, setTargetProvider] = useState<string>("poe");
  const [targetModel, setTargetModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  // Provider capabilities
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  function parseHfInput(input: string): { ok: boolean; url: string } {
    const t = input.trim();
    if (!t) return { ok: false, url: "" };
    // Accept full HF URL or org/model
    if (/^https?:\/\/huggingface\.co\//i.test(t)) return { ok: true, url: t };
    if (/^[^\s\/]+\/[A-Za-z0-9._\-]+$/.test(t)) return { ok: true, url: `https://huggingface.co/${t}` };
    return { ok: false, url: t };
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
          if (Array.isArray(data?.models)) setAvailableModels(data.models);
          return;
        }
      } catch {}
      try {
        const resp2 = await fetch('/api/setup', { cache: 'no-store' });
        const data2 = await resp2.json();
        if (!alive) return;
        if (Array.isArray(data2?.availableModels)) setAvailableModels(data2.availableModels);
      } catch {}
    })();
    return () => { alive = false; };
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
          body: JSON.stringify({ modelId: targetModel.trim(), difficulty, includeAssessment: true, provider: 'openai-compatible', targetProvider, targetModel, showReasoning })
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
          body: JSON.stringify({ hfUrl: parsed.url, difficulty, includeAssessment: true, provider: teacherProvider, targetProvider, targetModel, showReasoning })
        });
      }
      const data = await resp.json();
      if (!data.success) {
        setError(data?.error?.code === 'validation_error' ? 'Lesson validation failed' : (data?.error?.message || 'Failed to generate'));
        setErrorDetails(Array.isArray(data?.error?.details) ? data.error.details : []);
        setProgress("idle");
        return;
      }
      setProgress("done");
      setResult({ tutorialId: data.tutorialId, meta: data.meta, preview: data.preview });
      setSnackbar('Lesson ready! Open the tutorial or export to Colab.');
      setTimeout(() => setSnackbar(null), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setErrorDetails([]);
      setProgress("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-black font-display">Generate Lesson</h1>
      <div className="flex gap-2">
        <Button variant={source==='hf'?'accent':'secondary'} onClick={()=>setSource('hf')}>From Hugging Face</Button>
        <Button variant={source==='local'?'accent':'secondary'} onClick={()=>setSource('local')}>From Local Runtime</Button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        {source === 'hf' ? (
          <input
            className="w-full p-2 rounded bg-gray-900 border border-gray-800"
            placeholder="https://huggingface.co/owner/repo"
            value={hfUrl}
            onChange={(e) => setHfUrl(e.target.value)}
          />
        ) : (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Local model</label>
            {availableModels.length > 0 ? (
              <select
                className="p-2 rounded bg-gray-900 border border-gray-800 w-full"
                value={targetModel}
                onChange={(e)=> setTargetModel(e.target.value)}
              >
                <option value="">Select a model…</option>
                {availableModels.map((m)=> (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                className="w-full p-2 rounded bg-gray-900 border border-gray-800"
                placeholder="e.g., llama-3-8b-instruct or gpt-oss:20b"
                value={targetModel}
                onChange={(e)=> setTargetModel(e.target.value)}
              />
            )}
            <div className="text-xs text-gray-500">Detected models are shown when LM Studio or Ollama is running locally.</div>
          </div>
        )}
        {/* Provider/Model picker for runtime */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            className="p-2 rounded bg-gray-900 border border-gray-800"
            value={targetProvider}
            onChange={(e) => setTargetProvider(e.target.value)}
            title="Choose provider for running steps"
          >
            {providers.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="p-2 rounded bg-gray-900 border border-gray-800"
            value={targetModel}
            onChange={(e) => setTargetModel(e.target.value)}
            title="Default model for steps"
          >
            <option value="">Auto (from HF model)</option>
            {(providers.find((p:any)=>p.id===targetProvider)?.models || []).map((m:any)=> (
              <option key={m.id} value={m.id}>{m.name || m.id}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <input id="show-reasoning" type="checkbox" checked={showReasoning} onChange={(e)=> setShowReasoning(e.target.checked)} />
          <label htmlFor="show-reasoning">Show Reasoning (beta)</label>
        </div>
        {providersLoading && <div className="text-xs text-gray-400">Loading providers…</div>}
        {providersError && <div className="text-xs text-yellow-400">{providersError}</div>}
        <select
          className="p-2 rounded bg-gray-900 border border-gray-800"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          title="Select difficulty level"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <label htmlFor="teacher-provider" className="whitespace-nowrap">Teacher Provider</label>
          <select
            id="teacher-provider"
            className="p-2 rounded bg-gray-900 border border-gray-800"
            value={teacherProvider}
            onChange={(e) => setTeacherProvider(e.target.value as any)}
            title="Choose Poe or a local OpenAI‑compatible endpoint (e.g., Ollama)"
          >
            <option value="poe">Poe (hosted)</option>
            <option value="openai-compatible">Local (OpenAI‑compatible)</option>
          </select>
          <span className="text-xs text-gray-500">Hint: For Local, install Ollama and run <code>ollama pull gpt-oss:20b</code>. See README.</span>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="accent" disabled={loading || (source==='hf' ? !hfUrl.trim() : !targetModel.trim())}>
            {loading ? "Generating..." : "Generate Lesson"}
          </Button>
          {source==='hf' ? (
            <Button type="button" variant="secondary" onClick={() => setHfUrl("meta-llama/Meta-Llama-3.1-8B-Instruct")}>Use Example HF Model</Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => setTargetModel("llama-3-8b-instruct")}>Use Example Local Model</Button>
          )}
        </div>
      </form>
      {loading && (
        <div className="text-sm text-gray-400">
          {progress === "parsing" && "Parsing model card…"}
          {progress === "asking" && "Asking teacher model… (and repairing if needed)"}
          {progress === "importing" && "Importing lesson…"}
        </div>
      )}
      {error && (
        <div className="text-red-400 space-y-2">
          <div>{error}</div>
          {errorDetails.length > 0 && (
            <ul className="list-disc pl-5 text-red-300 text-sm">
              {errorDetails.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!result && error && errorDetails.length > 0 && (
        <div className="mt-3 text-sm text-gray-300">
          <div className="mb-1">Try automatic fixes:</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs text-gray-400">
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
            const res = await fetch(backendUrl(`/export/colab/${result.tutorialId}`));
            const nb = await res.json();
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
      <div className="mt-6 text-sm text-gray-400">
        <div className="font-medium text-gray-300 mb-1">Try these popular models</div>
        <div className="flex flex-wrap gap-2">
          {['meta-llama/Meta-Llama-3.1-8B-Instruct','google/gemma-2-9b-it','mistralai/Mistral-7B-Instruct-v0.3'].map(m => (
            <Button key={m} variant="secondary" className="px-2 py-1 text-xs" onClick={() => setHfUrl(m)}>{m}</Button>
          ))}
        </div>
      </div>

      {snackbar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded bg-gray-900 border border-gray-700 text-white shadow">{snackbar}</div>
      )}
    </div>
  );
}
