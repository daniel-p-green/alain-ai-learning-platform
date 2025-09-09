"use client";
import { useState } from "react";

export default function GenerateLessonPage() {
  const [hfUrl, setHfUrl] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [progress, setProgress] = useState<"idle" | "parsing" | "asking" | "importing" | "done">("idle");
  const [result, setResult] = useState<null | { tutorialId: number; meta?: any; preview?: any }>(null);
  const [repairing, setRepairing] = useState(false);

  function parseHfInput(input: string): { ok: boolean; url: string } {
    const t = input.trim();
    if (!t) return { ok: false, url: "" };
    // Accept full HF URL or org/model
    if (/^https?:\/\/huggingface\.co\//i.test(t)) return { ok: true, url: t };
    if (/^[^\s\/]+\/[A-Za-z0-9._\-]+$/.test(t)) return { ok: true, url: `https://huggingface.co/${t}` };
    return { ok: false, url: t };
  }

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
        body: JSON.stringify({ hfUrl: parsed.url, difficulty, includeAssessment: true })
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
    } catch (e: any) {
      setError(e?.message || String(e));
      setErrorDetails([]);
      setProgress("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Generate Lesson from Hugging Face URL</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full p-2 rounded bg-gray-900 border border-gray-800"
          placeholder="https://huggingface.co/owner/repo"
          value={hfUrl}
          onChange={(e) => setHfUrl(e.target.value)}
        />
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
        <div className="flex gap-2">
          <button className="brand-cta disabled:opacity-50" disabled={loading || !hfUrl.trim()}>
            {loading ? "Generating..." : "Generate Lesson"}
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
            onClick={() => setHfUrl("meta-llama/Meta-Llama-3.1-8B-Instruct")}
          >
            Use Example Model
          </button>
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
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white disabled:opacity-50"
              disabled={repairing}
              onClick={async () => {
                setRepairing(true);
                const parsed = parseHfInput(hfUrl);
                const resp = await fetch('/api/repair-lesson', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ hfUrl: parsed.url, difficulty, fixes: ['add_description','add_intro_step'] })
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
                }
              }}
            >Auto-fix and Import</button>
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
            <button
              className="px-3 py-2 rounded bg-blue-600 text-white"
              onClick={() => { window.location.href = `/tutorial/${result.tutorialId}`; }}
            >
              Open Tutorial
            </button>
            <button
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
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
            >
              Export Notebook
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
