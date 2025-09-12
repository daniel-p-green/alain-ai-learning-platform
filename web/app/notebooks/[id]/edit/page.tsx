"use client";
import React, { useEffect, useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useParams, useRouter } from "next/navigation";

export default function EditNotebookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [jsonText, setJsonText] = useState<string>("{}");
  const [cells, setCells] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaSourceType, setMetaSourceType] = useState<"company" | "user">("user");
  const [metaOrg, setMetaOrg] = useState("");
  const [metaTags, setMetaTags] = useState<string>("");
  const [metaLicense, setMetaLicense] = useState("");
  const [metaProv, setMetaProv] = useState("");
  const [metaPublished, setMetaPublished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/notebooks/${id}`);
      if (!res.ok) return setError("Failed to load notebook");
      const data = await res.json();
      if (!cancelled) {
        setJsonText(JSON.stringify(data.nb, null, 2));
        setCells(Array.isArray(data.nb?.cells) ? data.nb.cells : []);
        const md = data.nb?.metadata || {};
        setMetaTitle(data.meta?.title || md.title || "");
        setMetaSourceType((md.sourceType as any) || "user");
        setMetaOrg(md.sourceOrg || "");
        setMetaTags(Array.isArray(md.tags) ? md.tags.join(", ") : "");
        setMetaLicense(md.license || "");
        setMetaProv(md.provenance_url || "");
        setMetaPublished(!!md.published);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  function moveCell(from: number, to: number) {
    setCells((prev) => {
      const copy = prev.slice();
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

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
    nb.metadata = {
      ...(nb.metadata || {}),
      title: metaTitle || nb.metadata?.title,
      sourceType: metaSourceType,
      sourceOrg: metaOrg || undefined,
      tags: metaTags.split(",").map((t) => t.trim()).filter(Boolean),
      license: metaLicense || undefined,
      provenance_url: metaProv || undefined,
      published: metaPublished,
    };
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/notebooks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nb) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      const q = j.commitUrl ? `?commit=${encodeURIComponent(j.commitUrl)}` : "";
      router.push(`/notebooks/${id}${q}`);
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
        <div className="rounded border p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="w-full rounded border px-3 py-2" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source Type</label>
            <select className="w-full rounded border px-3 py-2" value={metaSourceType} onChange={(e) => setMetaSourceType(e.target.value as any)}>
              <option value="user">User</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Org</label>
            <input className="w-full rounded border px-3 py-2" value={metaOrg} onChange={(e) => setMetaOrg(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma)</label>
            <input className="w-full rounded border px-3 py-2" value={metaTags} onChange={(e) => setMetaTags(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">License</label>
            <input className="w-full rounded border px-3 py-2" value={metaLicense} onChange={(e) => setMetaLicense(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Provenance URL</label>
            <input className="w-full rounded border px-3 py-2" value={metaProv} onChange={(e) => setMetaProv(e.target.value)} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={metaPublished} onChange={(e) => setMetaPublished(e.target.checked)} /> Publish
          </label>
        </div>
        {cells.map((c, idx) => (
          <div key={idx} className="rounded border p-3 space-y-2" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const from = Number(e.dataTransfer.getData('text/plain')); moveCell(from, idx); }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cell {idx + 1} — {c.cell_type}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveCell(idx, Math.max(0, idx - 1))} className="text-sm">↑</button>
                <button type="button" onClick={() => moveCell(idx, Math.min(cells.length - 1, idx + 1))} className="text-sm">↓</button>
                <button type="button" onClick={() => removeCell(idx)} className="text-sm text-red-500">Remove</button>
              </div>
            </div>
            {c.cell_type === "markdown" ? (
              <MarkdownEditor value={Array.isArray(c.source) ? c.source.join("") : c.source} onChange={(v) => setCellSource(idx, v)} />
            ) : (
              <CodeEditor value={Array.isArray(c.source) ? c.source.join("") : c.source} onChange={(v) => setCellSource(idx, v)} height={200} />
            )}
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
