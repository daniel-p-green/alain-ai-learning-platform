import React from 'react';

type Item = {
  id: number;
  file_path: string;
  model: string;
  provider: string;
  difficulty: 'beginner'|'intermediate'|'advanced';
  created_at: string;
  visibility: 'private'|'public'|'unlisted';
  share_slug?: string | null;
  tags?: string[];
};

async function fetchItems(searchParams: Record<string, string | undefined>): Promise<Item[]> {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => { if (v) params.set(k, v); });
  const res = await fetch(`/api/catalog/notebooks/public?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return [] as any;
  const data = await res.json();
  return data.items || [];
}

export default async function PublicNotebooks({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const items = await fetchItems(searchParams);
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Public & Unlisted Notebooks</h1>
      <p className="text-sm text-ink-600 mb-6">Configure NEXT_PUBLIC_BACKEND_URL for backend access.</p>
      {items.length === 0 && (
        <div className="text-ink-600">No public notebooks yet.</div>
      )}
      <ul className="space-y-3">
        {items.map(i => (
          <li key={i.id} className="border rounded p-4 bg-white/70">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{i.model} · {i.provider} · <span className="uppercase">{i.difficulty}</span></div>
                <div className="text-xs text-ink-600">{new Date(i.created_at).toLocaleString()}</div>
                <div className="text-xs text-ink-700 mt-1 break-all">{i.file_path}</div>
                {i.share_slug && <div className="text-xs text-ink-700">Share code: {i.share_slug}</div>}
              </div>
              <span className="text-xs px-2 py-1 rounded bg-ink-100 text-ink-700">{i.visibility}</span>
            </div>
            {i.tags && i.tags.length > 0 && (
              <div className="mt-2 text-xs text-ink-700">Tags: {i.tags.join(', ')}</div>
            )}
          </li>
        ))}
      </ul>
      <hr className="my-8" />
      <PublishForm />
    </div>
  );
}

function PublishForm() {
  return (
    <form className="space-y-3" action={async (formData: FormData) => {
      'use server';
      const file_path = String(formData.get('file_path') || '').trim();
      const visibility = String(formData.get('visibility') || 'private');
      if (!file_path) return;
      await fetch('/api/catalog/notebooks/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path, visibility })
      });
    }}>
      <h2 className="text-lg font-medium">Publish / Unpublish</h2>
      <div className="grid gap-2">
        <input className="border rounded px-3 py-2 text-sm" type="text" name="file_path" placeholder="content/notebooks/.../file.ipynb" />
        <select className="border rounded px-3 py-2 text-sm" name="visibility" defaultValue="public">
          <option value="private">private</option>
          <option value="public">public</option>
          <option value="unlisted">unlisted</option>
        </select>
        <button className="inline-flex items-center px-3 py-2 rounded bg-black text-white text-sm w-fit" type="submit">Apply</button>
      </div>
    </form>
  );
}

