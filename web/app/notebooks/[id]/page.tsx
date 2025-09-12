import NotebookViewer from "@/components/NotebookViewer";

export const dynamic = "force-dynamic";

async function fetchNotebook(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/notebooks/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function NotebookPage({ params, searchParams }: { params: { id: string }, searchParams?: { [k: string]: string | string[] | undefined } }) {
  const rec = await fetchNotebook(params.id);
  if (!rec) {
    return <div className="mx-auto max-w-3xl p-6">Notebook not found.</div>;
  }
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{rec.meta.title}</h1>
          <p className="text-sm text-ink-600">{rec.meta.sourceType}{rec.meta.sourceOrg ? ` • ${rec.meta.sourceOrg}` : ""}</p>
          {searchParams?.commit && (
            <p className="text-xs mt-1"><a className="text-alain-blue underline" href={String(searchParams.commit)} target="_blank">View commit</a></p>
          )}
        </div>
        <NotebookActions id={rec.meta.id} />
      </div>
      {rec.nb?.metadata && (
        <div className="text-xs text-ink-600">
          {rec.nb.metadata.license && <span>License: {rec.nb.metadata.license} · </span>}
          {rec.nb.metadata.provenance_url && <a className="underline" href={rec.nb.metadata.provenance_url} target="_blank">Source</a>}
        </div>
      )}
      <NotebookViewer nb={rec.nb} />
    </div>
  );
}

// Client-side action bar for PR export/remix with status toast
"use client";
import React, { useState } from "react";

function NotebookActions({ id }: { id: string }) {
  const [toast, setToast] = useState<string | null>(null);
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
    <div className="flex gap-2 items-center">
      <a href={`/notebooks/${id}/edit`} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-ink-200 text-ink-900 font-medium">Edit</a>
      <form action={`/api/notebooks/${id}/remix`} method="post">
        <button className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold">Remix</button>
      </form>
      <button onClick={exportPR} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-ink-900 text-white font-medium">Export ALAIN (PR)</button>
      <form action={`/api/notebooks/${id}/publish-request`} method="post">
        <button className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-blue text-white font-medium">Request Publish</button>
      </form>
      {toast && (
        <span className="text-xs text-ink-600">{toast}</span>
      )}
    </div>
  );
}
