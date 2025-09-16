"use client";
import React, { useState } from "react";

function toGhId(input: string): string | null {
  if (!input) return null;
  const s = input.trim();
  if (s.startsWith('gh:')) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.replace(/^\/+/, '');
    if (host === 'raw.githubusercontent.com') {
      const parts = path.split('/');
      if (parts.length >= 4 && path.endsWith('.ipynb')) {
        const owner = parts[0];
        const repo = parts[1];
        const ref = parts[2];
        const filePath = parts.slice(3).join('/');
        return `gh:${owner}/${repo}@${ref}:${filePath}`;
      }
    }
    if (host === 'github.com') {
      // Handle ***REMOVED*** URLs
      const parts = path.split('/');
      const ***REMOVED***Idx = parts.indexOf('***REMOVED***');
      if (***REMOVED***Idx !== -1 && parts.length > ***REMOVED***Idx + 2) {
        const owner = parts[0];
        const repo = parts[1];
        const ref = parts[***REMOVED***Idx + 1];
        const filePath = parts.slice(***REMOVED***Idx + 2).join('/');
        if (filePath.endsWith('.ipynb')) return `gh:${owner}/${repo}@${ref}:${filePath}`;
      }
    }
  } catch {}
  return null;
}

export default function GitHubOpenForm({ defaultRemix }: { defaultRemix?: boolean }) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
      e.preventDefault();
      setErr(null);
      const id = toGhId(url);
      if (!id) { setErr('Enter a valid GitHub .ipynb URL'); return; }
      const target = `/notebooks/${encodeURIComponent(id)}${defaultRemix ? '?remix=1' : ''}`;
      window.location.assign(target);
    }}>
      <div className="grow min-w-[260px]">
        <label className="block text-xs text-ink-600">GitHub Notebook URL</label>
        <input value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="https://github.com/owner/repo/***REMOVED***/main/path/notebook.ipynb" className="w-full rounded border px-3 py-2" />
        {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
      </div>
      <button type="submit" className="inline-flex items-center h-9 px-3 rounded bg-ink-900 text-white">Open</button>
      <button type="button" onClick={() => { const id = toGhId(url); if (!id) { setErr('Enter a valid GitHub .ipynb URL'); return; } const target = `/notebooks/${encodeURIComponent(id)}?remix=1`; window.location.assign(target); }} className="inline-flex items-center h-9 px-3 rounded bg-alain-yellow text-alain-blue font-semibold">Remix</button>
    </form>
  );
}

