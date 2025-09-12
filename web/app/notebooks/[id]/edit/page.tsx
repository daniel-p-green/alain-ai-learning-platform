"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditNotebookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [jsonText, setJsonText] = useState<string>("{}");
  const [cells, setCells] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/notebooks/${id}`);
      if (!res.ok) return setError("Failed to load notebook");
      const data = await res.json();
      if (!cancelled) {
        setJsonText(JSON.stringify(data.nb, null, 2));
        setCells(Array.isArray(data.nb?.cells) ? data.nb.cells : []);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  function setCellSource(idx: number, value: string) {
    setCells((prev) => prev.map((c, i) => (i === idx ? { ...c, source: value } : c)));
  }

  function addCell(kind: "markdown" | "code") {
    setCells((prev) => [...prev, { cell_type: kind, source: "", metadata: {} }]);
  }

  function removeCell(idx: number) {
    setCells((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSave() {
    setError(null);
    // Build nbformat from edited cells; fall back to raw JSON textarea if user edited it
    let parsed: any;
    try { parsed = JSON.parse(jsonText); } catch { parsed = null; }
    const nb = parsed || { nbformat: 4, nbformat_minor: 5, metadata: {}, cells: cells.map((c) => ({ ...c, source: c.source })) };
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/notebooks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nb) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      router.push(`/notebooks/${id}`);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Edit Notebook</h1>
      <p className="text-sm text-ink-600">Notebook ID: {id}</p>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="space-y-3">
        {cells.map((c, idx) => (
          <div key={idx} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cell {idx + 1} — {c.cell_type}</span>
              <button type="button" onClick={() => removeCell(idx)} className="text-sm text-red-500">Remove</button>
            </div>
            <textarea value={Array.isArray(c.source) ? c.source.join("") : c.source} onChange={(e) => setCellSource(idx, e.target.value)} className="w-full h-32 font-mono text-sm rounded border p-2" />
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" onClick={() => addCell("markdown")} className="inline-flex items-center h-9 px-3 rounded bg-ink-200 text-ink-900">Add Markdown</button>
          <button type="button" onClick={() => addCell("code")} className="inline-flex items-center h-9 px-3 rounded bg-ink-200 text-ink-900">Add Code</button>
        </div>
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-ink-600">Advanced: Edit raw JSON</summary>
        <textarea className="w-full h-[40vh] font-mono text-xs rounded border p-3 mt-2" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
      </details>
      <div className="flex gap-3">
        <button onClick={onSave} disabled={busy} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={() => router.push(`/notebooks/${id}`)} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-ink-200 text-ink-900 font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}
