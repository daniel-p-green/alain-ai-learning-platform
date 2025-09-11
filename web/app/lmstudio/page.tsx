"use client";

import { useEffect, useState } from "react";

type SearchItem = { id: string; name: string; exact?: boolean; staffPick?: boolean };
type OptionItem = { index: number; name: string; sizeBytes: number; quantization?: string; fitEstimation?: string; recommended?: boolean; indexedModelIdentifier: string };

function humanSize(bytes: number) {
  const units = ["B","KB","MB","GB","TB"]; let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function LMStudioExplorerPage() {
  const [term, setTerm] = useState("llama");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selected, setSelected] = useState<SearchItem | null>(null);
  const [options, setOptions] = useState<OptionItem[] | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [identifier, setIdentifier] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  async function doSearch() {
    try {
      setLoading(true); setError(null); setResults([]); setSelected(null); setOptions(null); setIdentifier("");
      const params = new URLSearchParams();
      if (term) params.set("term", term);
      params.set("limit", "10");
      const res = await fetch(`/api/lmstudio/search?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        setErrorCode(res.status);
        throw new Error(`Search failed (${res.status})`);
      }
      const j = await res.json();
      setResults(j.results || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions(item: SearchItem) {
    try {
      setSelected(item); setOptions(null); setError(null); setIdentifier("");
      const res = await fetch(`/api/lmstudio/options/${encodeURIComponent(item.id)}`, { cache: 'no-store' });
      if (!res.ok) {
        setErrorCode(res.status);
        throw new Error(`Options failed (${res.status})`);
      }
      const j = await res.json();
      setOptions(j.options || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function download(idx: number) {
    try {
      setDownloading(true); setError(null); setIdentifier("");
      const res = await fetch(`/api/lmstudio/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected?.id, optionIndex: idx }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErrorCode(res.status);
        throw new Error(j?.error?.message || `Download failed (${res.status})`);
      }
      setIdentifier(j.identifier || "");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => { doSearch().catch(()=>{}); }, []);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-black font-display">LM Studio Model Explorer</h1>
      <p className="text-sm text-gray-400">Search curated models, view quantization options, and download locally via LM Studio.</p>
      {errorCode === 501 && (
        <div className="p-3 rounded border border-yellow-700 bg-yellow-900/30 text-sm text-yellow-200">
          <div className="font-medium">SDK not available or LM Studio not running</div>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Install SDK in web server: <code>npm i @lmstudio/sdk</code></li>
            <li>Open LM Studio → Developer tab → enable Local Server (default http://localhost:1234/v1)</li>
            <li>Refresh this page</li>
          </ul>
          <div className="mt-2">
            <a className="underline text-yellow-100" href="/generate">Back to Generate</a>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <input className="flex-1 p-2 rounded bg-gray-900 border border-gray-800" value={term} onChange={e => setTerm(e.target.value)} placeholder="Search term (e.g. llama-3)" />
        <button className="px-3 py-2 rounded bg-blue-600 disabled:opacity-60" onClick={doSearch} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </div>
      {error && <div className="p-2 text-red-300 bg-red-950/30 border border-red-900 rounded">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold">Results</h2>
          <ul className="space-y-2">
            {results.map(r => (
              <li key={r.id} className="p-2 rounded border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name} {r.staffPick ? '⭐' : ''} {r.exact ? '(exact)' : ''}</div>
                </div>
                <button className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600" onClick={() => loadOptions(r)}>Options</button>
              </li>
            ))}
            {results.length === 0 && !loading && <li className="text-sm text-gray-500">No results.</li>}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Download Options {selected ? `for ${selected.name}` : ''}</h2>
          {!options && selected && <p className="text-sm text-gray-500">Loading options…</p>}
          {options && (
            <ul className="space-y-2">
              {options.map(o => (
                <li key={o.index} className="p-2 rounded border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm">{o.name}</div>
                    <div className="text-xs text-gray-400">{o.quantization || 'quant?'} • {humanSize(o.sizeBytes)} • fit: {o.fitEstimation || 'unknown'} {o.recommended ? ' (recommended)' : ''}</div>
                  </div>
                  <button className="px-2 py-1 rounded bg-green-700 hover:bg-green-600 disabled:opacity-60" onClick={() => download(o.index)} disabled={downloading}>{downloading ? 'Downloading…' : 'Download'}</button>
                </li>
              ))}
            </ul>
          )}
          {identifier && (
            <div className="mt-2 p-2 rounded border border-gray-800">
              <div className="text-sm">Model identifier:</div>
              <div className="font-mono text-xs break-all">{identifier}</div>
              <div className="text-xs text-gray-400 mt-1">Use this identifier with provider <code>lmstudio</code> in your Execute calls.</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
