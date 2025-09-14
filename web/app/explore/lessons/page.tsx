import React from 'react';
import CopyButton from '@/components/CopyButton';

type GeneratedLesson = {
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

type Tutorial = {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: 'beginner'|'intermediate'|'advanced';
  created_at: string;
  visibility: 'private'|'public'|'unlisted';
  share_slug?: string | null;
  tags?: string[];
};

async function fetchGenLessons(searchParams: Record<string, string | undefined>): Promise<GeneratedLesson[]> {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => { if (v) params.set(k, v); });
  const res = await fetch(`/api/catalog/lessons/public?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return [] as any;
  const data = await res.json();
  return data.items || [];
}

async function fetchTutorials(searchParams: Record<string, string | undefined>): Promise<Tutorial[]> {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => { if (v) params.set(k, v); });
  const res = await fetch(`/api/tutorials/public?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return [] as any;
  const data = await res.json();
  return data.items || [];
}

export default async function PublicLessons({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [gens, tuts] = await Promise.all([
    fetchGenLessons(searchParams),
    fetchTutorials(searchParams),
  ]);
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Public & Unlisted Lessons</h1>
      <p className="text-sm text-ink-600 mb-6">Showing generated lessons (filesystem) and tutorials (DB).</p>
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

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-2">Generated Lessons</h2>
        {gens.length === 0 && <div className="text-ink-600">No generated lessons yet.</div>}
        <ul className="space-y-3">
          {gens.map(i => (
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
                <a href={`/api/files/download?path=${encodeURIComponent(i.file_path)}`} className="inline-flex items-center px-3 py-1.5 rounded bg-ink-900 text-white text-xs">Download JSON</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-2">Tutorials</h2>
        {tuts.length === 0 && <div className="text-ink-600">No public tutorials yet.</div>}
        <ul className="space-y-3">
          {tuts.map(t => (
            <li key={t.id} className="border rounded p-4 bg-white/70">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium"><a href={`/tutorials/${t.id}`} className="hover:underline">{t.title}</a></div>
                  <div className="text-xs text-ink-600">{t.model} · {t.provider} · <span className="uppercase">{t.difficulty}</span> · {new Date(t.created_at).toLocaleString()}</div>
                  <div className="text-xs text-ink-700 mt-1 line-clamp-2">{t.description}</div>
                  {t.share_slug && <div className="text-xs text-ink-700">Share code: {t.share_slug}</div>}
                </div>
                <span className="text-xs px-2 py-1 rounded bg-ink-100 text-ink-700">{t.visibility}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
