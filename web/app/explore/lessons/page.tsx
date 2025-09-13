import React from 'react';

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

      <hr className="my-8" />
      <PublishForms />
    </div>
  );
}

function PublishForms() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form className="space-y-3" action={async (formData: FormData) => {
        'use server';
        const file_path = String(formData.get('file_path') || '').trim();
        const visibility = String(formData.get('visibility') || 'private');
        if (!file_path) return;
        await fetch('/api/catalog/lessons/publish', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path, visibility })
        });
      }}>
        <h2 className="text-lg font-medium">Publish Generated Lesson</h2>
        <div className="grid gap-2">
          <input className="border rounded px-3 py-2 text-sm" type="text" name="file_path" placeholder="content/lessons/.../lesson_<id>.json" />
          <select className="border rounded px-3 py-2 text-sm" name="visibility" defaultValue="public">
            <option value="private">private</option>
            <option value="public">public</option>
            <option value="unlisted">unlisted</option>
          </select>
          <button className="inline-flex items-center px-3 py-2 rounded bg-black text-white text-sm w-fit" type="submit">Apply</button>
        </div>
      </form>

      <form className="space-y-3" action={async (formData: FormData) => {
        'use server';
        const id = String(formData.get('id') || '').trim();
        const visibility = String(formData.get('visibility') || 'private');
        if (!id) return;
        await fetch(`/api/tutorials/${encodeURIComponent(id)}/publish`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibility })
        });
      }}>
        <h2 className="text-lg font-medium">Publish Tutorial</h2>
        <div className="grid gap-2">
          <input className="border rounded px-3 py-2 text-sm" type="text" name="id" placeholder="tutorial id (number)" />
          <select className="border rounded px-3 py-2 text-sm" name="visibility" defaultValue="public">
            <option value="private">private</option>
            <option value="public">public</option>
            <option value="unlisted">unlisted</option>
          </select>
          <button className="inline-flex items-center px-3 py-2 rounded bg-black text-white text-sm w-fit" type="submit">Apply</button>
        </div>
      </form>
    </div>
  );
}
