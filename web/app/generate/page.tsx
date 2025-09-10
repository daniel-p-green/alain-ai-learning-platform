"use client";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button";

export default function GenerateLessonPage() {
  const [hfUrl, setHfUrl] = useState("");
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
  type ProviderModel = { id: string; name?: string };
  type ProviderInfo = { id: string; name: string; models?: ProviderModel[]; status?: string };
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [targetProvider, setTargetProvider] = useState<string>("poe");
  const [targetModel, setTargetModel] = useState<string>("");
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
    return () => { alive = false; };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("parsing");
    try {
      const parsed = parseHfInput(hfUrl);
      if (!parsed.ok) {
        setError("Enter a valid Hugging Face URL or org/model (owner/repo)");
        setLoading(false);
        setProgress("idle");
        return;
      }
      setProgress("asking");
      const resp = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hfUrl: parsed.url, difficulty, includeAssessment: true, provider: teacherProvider, targetProvider, targetModel, showReasoning })
      });
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
      <h1 className="text-2xl font-black font-display">Generate Lesson from Hugging Face URL</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full p-2 rounded bg-gray-900 border border-gray-800"
          placeholder="https://huggingface.co/owner/repo"
          value={hfUrl}
          onChange={(e) => setHfUrl(e.target.value)}
        />
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
          <Button type="submit" variant="accent" disabled={loading || !hfUrl.trim()}>
            {loading ? "Generating..." : "Generate Lesson"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setHfUrl("meta-llama/Meta-Llama-3.1-8B-Instruct")}>Use Example Model</Button>
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
        <div className="mt-4 border border-gray-800 rounded-lg p-4 bg-gray-900 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Preview</h2>
            {result.meta?.repaired && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-800 text-yellow-200 border border-yellow-700">Repaired</span>
            )}
          </div>
          <div className="text-white font-medium">{result.preview?.title}</div>
          <div className="text-gray-300">{result.preview?.description}</div>
          {result.preview?.model_maker && (
            <div className="text-sm text-gray-300 border border-gray-800 rounded p-3 bg-gray-950/40">
              <div className="font-medium text-gray-200 mb-1">Model Maker</div>
              <div>{result.preview.model_maker.name} ({result.preview.model_maker.org_type})</div>
              <div className="flex gap-2 mt-1">
                {result.preview.model_maker.homepage && <a className="text-brand-blue hover:underline" href={result.preview.model_maker.homepage} target="_blank">Homepage</a>}
                {result.preview.model_maker.repo && <a className="text-brand-blue hover:underline" href={result.preview.model_maker.repo} target="_blank">Repo</a>}
                {result.preview.model_maker.license && <span className="text-gray-400">License: {result.preview.model_maker.license}</span>}
              </div>
            </div>
          )}
          {Array.isArray(result.preview?.learning_objectives) && result.preview.learning_objectives.length > 0 && (
            <div className="text-sm text-gray-400">
              <div className="font-medium text-gray-300 mb-1">Objectives</div>
              <ul className="list-disc pl-5">
                {result.preview.learning_objectives.slice(0,3).map((o: string, i: number) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}
          {result.preview?.first_step && (
            <div className="text-sm text-gray-300">
              <div className="font-medium text-gray-300 mb-1">Step 1: {result.preview.first_step.title}</div>
              <div className="whitespace-pre-wrap text-gray-400">{result.preview.first_step.content}</div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => { window.location.href = `/tutorial/${result.tutorialId}`; }}
            >Open Tutorial</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const res = await fetch(`/export/colab/${result.tutorialId}`);
                const nb = await res.json();
                const blob = new Blob([JSON.stringify(nb, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(result.preview?.title || 'lesson').replace(/\s+/g,'_')}.ipynb`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >Export Notebook</Button>
          </div>
        </div>
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
          {showReasoning && result.meta?.reasoning_summary && (
            <div className="text-sm text-gray-400">
              <div className="font-medium text-gray-300 mb-1">Reasoning (summary)</div>
              <div className="whitespace-pre-wrap">{result.meta.reasoning_summary}</div>
            </div>
          )}
