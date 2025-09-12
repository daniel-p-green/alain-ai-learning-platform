"use client";
import React, { useEffect, useState } from "react";

type Item = { id: string; title?: string; sourceOrg?: string; moderation?: string; path: string };

export default function ModerationQueue() {
  const [items, setItems] = useState<Item[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/notebooks?details=1&limit=50", { cache: "no-store" });
      const j = await res.json();
      const pending = (j.items || []).filter((x: any) => (x.moderation || 'pending') === 'pending');
      setItems(pending);
    })();
  }, []);

  async function act(id: string, action: 'approve' | 'reject') {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}/${action}`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'failed');
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Moderation Queue</h1>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{i.title || i.id}</div>
              <div className="text-xs text-ink-600">{i.id}{i.sourceOrg ? ` • ${i.sourceOrg}` : ''}</div>
            </div>
            <div className="flex items-center gap-2">
              <button disabled={busyId === i.id} onClick={() => act(i.id, 'reject')} className="h-8 px-3 rounded bg-ink-200 text-ink-900">Reject</button>
              <button disabled={busyId === i.id} onClick={() => act(i.id, 'approve')} className="h-8 px-3 rounded bg-alain-yellow text-alain-blue font-semibold">Approve</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-ink-600">No pending notebooks.</div>}
      </div>
    </div>
  );
}

