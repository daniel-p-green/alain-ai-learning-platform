import React from 'react';
import nextDynamic from 'next/dynamic';
import { appBaseUrl } from '@/lib/requestBase';

const GitHubOpenForm = nextDynamic(() => import('@/components/GitHubOpenForm'), { ssr: false });

async function fetchFeatured() {
  try {
    const base = appBaseUrl();
    const res = await fetch(`${base}/api/notebooks/featured`, { cache: 'no-store' });
    const j = await res.json();
    return Array.isArray(j.items) ? j.items : [];
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function FeaturedNotebooks() {
  const items = await fetchFeatured();
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Featured Notebooks (GitHub)</h1>
      <div className="rounded-card border border-ink-200 bg-paper-0 p-4">
        <div className="font-medium">Demo guide: Remix → Export PR</div>
        <ul className="mt-1 text-sm text-ink-700 list-disc pl-5 space-y-1">
          <li>Open a featured notebook (from GitHub).</li>
          <li>Click “Remix” and select enhancements (Objectives, MCQs, Takeaways).</li>
          <li>Apply Remix to generate an enhanced copy in ALAIN.</li>
          <li>Click “Export ALAIN (PR)” on the remixed page to create a PR.</li>
          <li>Follow the PR link to review the exported lesson JSON.</li>
        </ul>
        <div className="mt-2 text-xs text-ink-600">
          Prereqs for export: set <code>GITHUB_TOKEN</code> (Settings → Advanced → GitHub Export) and <code>GITHUB_REPO</code> (<code>owner/name</code>), <code>GITHUB_BRANCH</code>, <code>NOTEBOOKS_DIR</code>, <code>LESSONS_DIR</code>.
          Sign‑in required.
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((it: any) => (
          <li key={it.id} className="rounded border p-4 bg-white/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-xs text-ink-600">{it.org} · <span className="break-all">{it.id}</span></div>
                {Array.isArray(it.tags) && it.tags.length > 0 && (
                  <div className="mt-1 text-xs text-ink-700">Tags: {it.tags.join(', ')}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a className="inline-flex items-center h-9 px-3 rounded bg-ink-200 text-ink-900 text-sm" href={`/notebooks/${encodeURIComponent(it.id)}`}>Open</a>
                <a
                  className="inline-flex items-center h-9 px-3 rounded bg-alain-blue text-white text-sm font-semibold hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40"
                  href={`/notebooks/${encodeURIComponent(it.id)}?remix=1`}
                >
                  Remix
                </a>
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded border border-ink-100 bg-paper-0 p-4 text-sm text-ink-700">
            Featured notebooks are temporarily unavailable. Check back soon or open any GitHub notebook below.
          </li>
        )}
      </ul>
      <hr className="my-6" />
      <div className="space-y-2">
        <div className="font-medium">Open any GitHub .ipynb</div>
        <GitHubOpenForm />
      </div>
    </div>
  );
}
