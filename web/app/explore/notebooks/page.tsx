import React from 'react';
import dynamic from 'next/dynamic';
const GitHubOpenForm = dynamic(() => import('@/components/GitHubOpenForm'), { ssr: false });
import CopyButton from '@/components/CopyButton';
import { headers } from 'next/headers';

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
  try {
    const h = headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'http';
    const base = `${proto}://${host}`;
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(new URL(`/api/catalog/notebooks/public?${params.toString()}`, base), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.items || [];
  } catch {
    return [] as any;
  }
}

export default async function PublicNotebooks({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const items = await fetchItems(searchParams);
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Public & Unlisted Notebooks</h1>
      <p className="text-sm text-ink-600 mb-6">Configure NEXT_PUBLIC_BACKEND_BASE for backend access. <a className="underline text-alain-blue" href="/notebooks/featured">Featured (GitHub)</a></p>
      <form className="mb-4 flex flex-wrap items-end gap-2" method="GET">
        <div>
          <label className="block text-xs text-ink-600">Model</label>
          <input name="model" defaultValue={searchParams.model} className="border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ink-600">Provider</label>
          <input name="provider" defaultValue={searchParams.provider} className="border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ink-600">Difficulty</label>
          <select name="difficulty" defaultValue={searchParams.difficulty} className="border rounded px-2 py-1 text-sm">
            <option value="">Any</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <button className="inline-flex items-center h-8 px-3 rounded bg-ink-900 text-white text-sm" type="submit">Filter</button>
      </form>
      <div className="mb-6 p-3 rounded border bg-white/70">
        <div className="font-medium text-sm mb-2">Open from GitHub</div>
        <GitHubOpenForm />
      </div>
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
                <div className="mt-1 flex items-center gap-2">
                  <CopyButton text={i.file_path} label="Copy path" />
                </div>
                {i.share_slug && (
                  <div className="text-xs text-ink-700 mt-1 flex items-center gap-2">
                    <span>Share code: {i.share_slug}</span>
                    <CopyButton text={i.share_slug} label="Copy code" />
                  </div>
                )}
              </div>
              <span className="text-xs px-2 py-1 rounded bg-ink-100 text-ink-700">{i.visibility}</span>
            </div>
            {i.tags && i.tags.length > 0 && (
              <div className="mt-2 text-xs text-ink-700">Tags: {i.tags.join(', ')}</div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <a href={`/api/files/download?path=${encodeURIComponent(i.file_path)}`} className="inline-flex items-center px-3 py-1.5 rounded bg-ink-900 text-white text-xs">Download .ipynb</a>
              {process.env.NEXT_PUBLIC_GITHUB_REPO && process.env.NEXT_PUBLIC_GITHUB_BRANCH && (
                <a
                  href={`https://colab.research.google.com/github/${process.env.NEXT_PUBLIC_GITHUB_REPO}/***REMOVED***/${process.env.NEXT_PUBLIC_GITHUB_BRANCH}/${i.file_path}`}
                  target="_blank"
                  className="inline-flex items-center px-3 py-1.5 rounded bg-alain-yellow text-alain-blue text-xs"
                >Open in Colab</a>
              )}
            </div>
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
