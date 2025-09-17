"use client";
import React, { useState } from "react";
import { toGhId } from "@/lib/githubNotebook";

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
        <input value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="https://github.com/owner/repo/blob/main/path/notebook.ipynb" className="w-full rounded border px-3 py-2" />
        {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
      </div>
      <button type="submit" className="inline-flex items-center h-9 px-3 rounded bg-ink-900 text-white">Open</button>
      <button type="button" onClick={() => { const id = toGhId(url); if (!id) { setErr('Enter a valid GitHub .ipynb URL'); return; } const target = `/notebooks/${encodeURIComponent(id)}?remix=1`; window.location.assign(target); }} className="inline-flex items-center h-9 px-3 rounded bg-alain-yellow text-alain-blue font-semibold">Remix</button>
    </form>
  );
}
