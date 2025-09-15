"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NotebookActions({ id, promptRemix }: { id: string; promptRemix?: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  const [showRemix, setShowRemix] = useState(!!promptRemix);
  const [optObjectives, setOptObjectives] = useState(true);
  const [optMcqs, setOptMcqs] = useState(true);
  const [optTryIt, setOptTryIt] = useState(false);
  const [optTips, setOptTips] = useState(false);
  const [optTakeaways, setOptTakeaways] = useState(true);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
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
      <button onClick={() => setShowRemix(true)} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold whitespace-nowrap w-full sm:w-auto">Remix</button>
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
      {showRemix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[92vw] max-w-md rounded-xl border border-ink-200 bg-white p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Remix with ALAIN</h3>
              <button className="text-ink-600" onClick={()=> setShowRemix(false)}>✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={optObjectives} onChange={(e)=> setOptObjectives(e.target.checked)} /> Add Learning Objectives</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={optMcqs} onChange={(e)=> setOptMcqs(e.target.checked)} /> Insert Knowledge Checks (MCQs)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={optTryIt} onChange={(e)=> setOptTryIt(e.target.checked)} /> Add "Try It Yourself" prompts</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={optTips} onChange={(e)=> setOptTips(e.target.checked)} /> Add Pro Tips</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={optTakeaways} onChange={(e)=> setOptTakeaways(e.target.checked)} /> Add Key Takeaways</label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="h-9 px-3 rounded border border-ink-200" onClick={()=> setShowRemix(false)}>Cancel</button>
              <button
                className="h-9 px-3 rounded bg-alain-yellow text-alain-blue font-semibold disabled:opacity-50"
                disabled={busy}
                onClick={async ()=>{
                  setBusy(true);
                  try {
                    setToast('Remixing…');
                    const res = await fetch('/api/notebooks/remix', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id, options: { objectives: optObjectives, mcqs: optMcqs, tryIt: optTryIt, tips: optTips, takeaways: optTakeaways } })
                    });
                    const j = await res.json().catch(()=>({}));
                    if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
                    const newId = j?.id;
                    setShowRemix(false);
                    setToast('Remix ready');
                    if (newId) {
                      // Use encodeURIComponent to keep gh:/slashes safe
                      router.push(`/notebooks/${encodeURIComponent(newId)}`);
                    }
                  } catch (e: any) {
                    setToast(e?.message || 'Remix failed');
                  } finally {
                    setBusy(false);
                    setTimeout(()=> setToast(null), 3000);
                  }
                }}
              >{busy ? 'Working…' : 'Apply Remix'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
