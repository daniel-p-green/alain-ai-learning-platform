"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeNotebookId } from "@/lib/notebookId";

export default function NotebookActions({ id, promptRemix }: { id: string; promptRemix?: boolean }) {
  const router = useRouter();
  const encodedId = encodeNotebookId(id);
  const isGh = id.startsWith("gh:");

  const [toast, setToast] = useState<string | null>(null);
  const [showRemixOptions, setShowRemixOptions] = useState(Boolean(promptRemix));
  const [showFullFlow, setShowFullFlow] = useState(false);

  const [optObjectives, setOptObjectives] = useState(true);
  const [optMcqs, setOptMcqs] = useState(true);
  const [optTryIt, setOptTryIt] = useState(false);
  const [optTips, setOptTips] = useState(false);
  const [optTakeaways, setOptTakeaways] = useState(true);

  const [busyRemix, setBusyRemix] = useState(false);
  const [busyFullFlow, setBusyFullFlow] = useState(false);

  const [baseUrl, setBaseUrl] = useState<string>("http://localhost:1234");
  const [model, setModel] = useState<string>("openai/gpt-oss-20b");
  const [maxSections, setMaxSections] = useState<number>(8);

  function notify(message: string, timeout = 2800) {
    setToast(message);
    setTimeout(() => setToast(null), timeout);
  }

  async function exportPR() {
    try {
      notify("Exporting ALAIN (PR)…", 4000);
      const res = await fetch(`/api/notebooks/${encodedId}/export/alain`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      const url = j?.prUrl || j?.html_url || j?.url;
      notify(url ? `PR opened: ${url}` : "Exported; PR created");
    } catch (e: any) {
      notify(e?.message || "Export failed");
    }
  }

  async function handleAddToLibrary() {
    try {
      notify("Adding to library…", 3500);
      const res = await fetch("/api/library/pointer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      notify("Added to library");
    } catch (e: any) {
      notify(e?.message || "Failed to add");
    }
  }

  async function applyRemix() {
    if (busyRemix) return;
    setBusyRemix(true);
    try {
      notify("Remixing…", 4000);
      const res = await fetch("/api/notebooks/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          options: {
            objectives: optObjectives,
            mcqs: optMcqs,
            tryIt: optTryIt,
            tips: optTips,
            takeaways: optTakeaways,
          },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      const newId = j?.id;
      notify("Remix ready");
      if (newId) router.push(`/notebooks/${encodeNotebookId(newId)}`);
    } catch (e: any) {
      notify(e?.message || "Remix failed");
    } finally {
      setBusyRemix(false);
    }
  }

  async function runFullFlow() {
    if (busyFullFlow) return;
    setBusyFullFlow(true);
    try {
      notify("Running full ALAIN flow…", 4500);
      const res = await fetch("/api/notebooks/remix/alain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, baseUrl, model, maxSections }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      const newId = j?.id;
      notify("Full flow remix ready");
      if (newId) router.push(`/notebooks/${encodeNotebookId(newId)}`);
    } catch (e: any) {
      notify(e?.message || "Full flow failed");
    } finally {
      setBusyFullFlow(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a
          href={`/notebooks/${encodedId}/edit`}
          className="inline-flex items-center rounded-full border border-ink-100 bg-paper-0 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-paper-50"
        >
          Edit
        </a>
        <button
          type="button"
          onClick={() => setShowRemixOptions((open) => !open)}
          className="inline-flex items-center rounded-full bg-alain-blue px-3 py-1.5 text-sm font-semibold text-white shadow-card hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/30"
        >
          Remix options
        </button>
        <button
          type="button"
          onClick={exportPR}
          className="inline-flex items-center rounded-full border border-ink-200 bg-paper-0 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-paper-50"
        >
          Export ALAIN (PR)
        </button>
        <form action={`/api/notebooks/${encodedId}/publish-request`} method="post">
          <button className="inline-flex items-center rounded-full border border-alain-blue/30 bg-alain-blue/5 px-3 py-1.5 text-sm font-medium text-alain-blue hover:bg-alain-blue/10">
            Request publish
          </button>
        </form>
        {isGh && (
          <button
            type="button"
            onClick={handleAddToLibrary}
            className="inline-flex items-center rounded-full border border-ink-200 bg-paper-0 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-paper-50"
          >
            Add to library
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowFullFlow((open) => !open)}
          className="inline-flex items-center rounded-full border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-paper-50"
        >
          Full ALAIN flow
        </button>
      </div>

      {showRemixOptions && (
        <div className="space-y-3 rounded-2xl border border-ink-100 bg-paper-0 p-4 text-sm text-ink-700">
          <div className="font-semibold text-ink-900">Remix with extra scaffolding</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optObjectives} onChange={(e) => setOptObjectives(e.target.checked)} />
              Add learning objectives
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optMcqs} onChange={(e) => setOptMcqs(e.target.checked)} />
              Insert knowledge checks (MCQs)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optTryIt} onChange={(e) => setOptTryIt(e.target.checked)} />
              Add “Try it yourself” prompts
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optTips} onChange={(e) => setOptTips(e.target.checked)} />
              Add pro tips
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optTakeaways} onChange={(e) => setOptTakeaways(e.target.checked)} />
              Add key takeaways
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-500">Remix runs locally with your saved provider settings.</p>
            <button
              type="button"
              onClick={applyRemix}
              disabled={busyRemix}
              className="inline-flex items-center rounded-full bg-alain-blue px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-alain-blue/90 disabled:opacity-50"
            >
              {busyRemix ? "Working…" : "Apply remix"}
            </button>
          </div>
        </div>
      )}

      {showFullFlow && (
        <div className="space-y-3 rounded-2xl border border-ink-100 bg-paper-0 p-4 text-sm text-ink-700">
          <div className="font-semibold text-ink-900">Run the full ALAIN pipeline</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-ink-600 uppercase tracking-wide">Provider base URL</span>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded-[12px] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-alain-blue focus:outline-none"
                placeholder="http://localhost:1234"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-ink-600 uppercase tracking-wide">Model</span>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-[12px] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-alain-blue focus:outline-none"
                placeholder="openai/gpt-oss-20b"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-ink-600 uppercase tracking-wide">Max sections</span>
              <input
                type="number"
                min={3}
                max={12}
                value={maxSections}
                onChange={(e) => setMaxSections(Number(e.target.value) || 8)}
                className="w-full rounded-[12px] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-alain-blue focus:outline-none"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-500">Outline → Sections → Build runs against your provider; artifacts stay local-first.</p>
            <button
              type="button"
              onClick={runFullFlow}
              disabled={busyFullFlow}
              className="inline-flex items-center rounded-full bg-alain-blue px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-alain-blue/90 disabled:opacity-50"
            >
              {busyFullFlow ? "Working…" : "Run full flow"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="rounded-2xl border border-ink-100 bg-paper-50 px-3 py-2 text-xs text-ink-600">
          {toast}
        </div>
      )}
    </div>
  );
}
