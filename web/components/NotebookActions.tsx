"use client";
import React, { useState } from "react";

export default function NotebookActions({ id }: { id: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const isGh = id.startsWith('gh:');
  async function exportPR() {
    try {
      setToast('Exporting ALAIN (PR)…');
      const res = await fetch(`/api/notebooks/${id}/export/alain`, { method: 'POST' });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      const url = j?.prUrl || j?.html_url || j?.url;
      setToast(url ? `PR opened: ${url}` : 'Exported; PR created');
    } catch (e: any) {
      setToast(e?.message || 'Export failed');
    } finally {
      setTimeout(()=> setToast(null), 3000);
    }
  }
  return (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      <a href={`/notebooks/${id}/edit`} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-ink-200 text-ink-900 font-medium whitespace-nowrap w-full sm:w-auto">Edit</a>
      <form action={`/api/notebooks/${id}/remix`} method="post">
        <button className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold whitespace-nowrap w-full sm:w-auto">Remix</button>
      </form>
      <button onClick={exportPR} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-ink-900 text-white font-medium whitespace-nowrap w-full sm:w-auto">Export ALAIN (PR)</button>
      <form action={`/api/notebooks/${id}/publish-request`} method="post">
        <button className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-blue text-white font-medium whitespace-nowrap w-full sm:w-auto">Request Publish</button>
      </form>
      {isGh && (
        <button
          onClick={async () => {
            try {
              setToast('Adding to library…');
              const res = await fetch('/api/library/pointer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
              const j = await res.json().catch(()=>({}));
              if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
              setToast('Added to library');
            } catch (e:any) {
              setToast(e?.message || 'Failed to add');
            } finally {
              setTimeout(()=> setToast(null), 3000);
            }
          }}
          className="inline-flex items-center h-10 px-4 rounded-alain-lg border border-ink-200 text-ink-900 font-medium whitespace-nowrap w-full sm:w-auto"
          title="Store pointer only; no file copy"
        >Add to Library</button>
      )}
      {toast && (
        <span className="text-xs text-ink-600">{toast}</span>
      )}
    </div>
  );
}
