import React from "react";

type Item = { id: number; file_path: string; model: string; provider: string; difficulty: string; created_at: string; visibility: string; share_slug?: string | null };

async function fetchMine(): Promise<Item[]> {
  const res = await fetch('/api/catalog/notebooks/mine', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export default async function MyNotebooks() {
  const items = await fetchMine();
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Notebooks</h1>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{i.model} · {i.provider} · <span className="uppercase">{i.difficulty}</span></div>
              <div className="text-xs text-ink-600">{new Date(i.created_at).toLocaleString()}</div>
              <div className="text-xs text-ink-700 mt-1 break-all">{i.file_path}</div>
              {i.share_slug && <div className="text-xs text-ink-700">Share code: {i.share_slug}</div>}
            </div>
            <span className="text-xs px-2 py-1 rounded bg-ink-100 text-ink-700">{i.visibility}</span>
          </div>
        ))}
        {items.length === 0 && <div className="text-ink-600">You have no indexed notebooks yet. Generate one and ensure CATALOG_INDEX=1.</div>}
      </div>
    </div>
  );
}
