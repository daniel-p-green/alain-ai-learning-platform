"use client";
import React from 'react';

type Depth = 'basic' | 'intermediate' | 'advanced';

function parseRef(input: string): { owner?: string; repo?: string } {
  const t = (input || '').trim();
  if (!t) return {};
  const m = t.match(/^(?:https?:\/\/huggingface\.co\/)?([^\s\/]+)\/([^\s\/]+)/);
  if (m) return { owner: m[1], repo: m[2] };
  return {};
}

export default function ResearchPage() {
  const [ref, setRef] = React.useState('openai/gpt-oss-20b');
  const [depth, setDepth] = React.useState<Depth>('intermediate');
  const [offlineCache, setOfflineCache] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<any | null>(null);
  const [dir, setDir] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<string[]>([]);
  const [activeFile, setActiveFile] = React.useState<string | null>(null);
  const [fileContent, setFileContent] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSummary(null);
    setDir(null);
    const p = parseRef(ref);
    if (!p.owner || !p.repo) {
      setError('Enter a valid Hugging Face reference like owner/repo');
      setLoading(false);
      return;
    }
    try {
      const resp = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: p.owner, model: p.repo, depth, offlineCache }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.success) {
        setError(data?.error?.message || `Request failed (HTTP ${resp.status})`);
        setLoading(false);
        return;
      }
      setSummary(data.summaryV2 || null);
      setDir(data.dir || null);
      // Load available artifacts list
      try {
        const u = new URL('/api/content/research', window.location.origin);
        const pr = parseRef(ref);
        if (pr.owner && pr.repo) {
          u.searchParams.set('provider', pr.owner);
          u.searchParams.set('model', pr.repo);
          const listResp = await fetch(u.toString(), { cache: 'no-store' });
          const listData = await listResp.json().catch(() => null);
          if (listResp.ok && listData?.files) setFiles(listData.files);
        }
      } catch {}
    } catch (e: any) {
      setError(e?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Research Models</h1>
      <p className="text-sm text-ink-700 mb-6">Run research-only analysis and save findings under resources/content/research/&lt;provider&gt;/&lt;model&gt;/</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hugging Face Model (owner/repo or URL)</label>
          <input className="w-full h-10 px-3 rounded-[10px] border border-ink-200" value={ref} onChange={e => setRef(e.target.value)} placeholder="openai/gpt-oss-20b" />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Depth</label>
            <select className="h-10 px-3 rounded-[10px] border border-ink-200" value={depth} onChange={e => setDepth(e.target.value as Depth)}>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 mt-6">
            <input type="checkbox" checked={offlineCache} onChange={e => setOfflineCache(e.target.checked)} />
            <span className="text-sm">Download offline cache (HF/Unsloth/Cookbook)</span>
          </label>
        </div>
        <div>
          <button className="inline-flex items-center h-10 px-4 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold disabled:opacity-50" disabled={loading}>
            {loading ? 'Running…' : 'Run Research'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-3 rounded-[10px] border border-red-200 text-red-800 bg-red-50">{error}</div>
      )}

      {summary && (
        <div className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Summary</h2>
          <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 space-y-2">
            <p className="text-sm"><strong>Parameters:</strong> {summary?.architecture?.parameter_scale || '—'}</p>
            <p className="text-sm"><strong>Context:</strong> {summary?.architecture?.context_length ?? '—'}</p>
            <p className="text-sm"><strong>Quantization:</strong> {(summary?.quantization || []).join(', ') || '—'}</p>
            <p className="text-sm"><strong>Tasks:</strong> {(summary?.capabilities?.tasks || []).slice(0, 8).join(', ') || '—'}</p>
            {summary?.benchmarks && summary.benchmarks.length > 0 && (
              <p className="text-sm"><strong>Benchmarks:</strong> {summary.benchmarks.slice(0,3).map((b: any) => `${b.dataset} ${b.value}`).join('; ')}</p>
            )}
            <p className="text-sm"><strong>Suggested:</strong> T={summary?.recommendations?.temperature ?? 0.3}, top_p={summary?.recommendations?.top_p ?? 0.9}</p>
            {dir && <p className="text-xs text-ink-600">Saved under: {dir}</p>}
          </div>
          <div className="mt-3">
            <a className="inline-flex items-center h-9 px-3 rounded-[10px] border border-ink-200 bg-paper-0 text-ink-900 mr-2" href={`/generate?hf=${encodeURIComponent((parseRef(ref).owner||'') + '/' + (parseRef(ref).repo||''))}`}>Generate from this model</a>
            {(() => {
              const pr = parseRef(ref);
              const href = `/api/content/research?provider=${encodeURIComponent(pr.owner||'')}&model=${encodeURIComponent(pr.repo||'')}&file=research-summary.v2.json`;
              return <a className="inline-flex items-center h-9 px-3 rounded-[10px] border border-ink-200 bg-paper-0 text-ink-900" href={href} download>Download summary JSON</a>;
            })()}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Artifacts</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((f) => {
              const pr = parseRef(ref);
              const href = `/api/content/research?provider=${encodeURIComponent(pr.owner||'')}&model=${encodeURIComponent(pr.repo||'')}&file=${encodeURIComponent(f)}`;
              return (
                <div key={f} className="inline-flex items-center gap-2">
                  <button className={`h-9 px-3 rounded-[10px] border ${activeFile===f?'border-alain-blue text-alain-blue':'border-ink-200 text-ink-900'} bg-paper-0`} onClick={async () => {
                    setActiveFile(f);
                    setFileContent('Loading...');
                    try {
                      const r = await fetch(href, { cache: 'no-store' });
                      const text = await r.text();
                      setFileContent(text);
                    } catch {
                      setFileContent('Failed to load.');
                    }
                  }}>{f}</button>
                  <a className="text-sm text-ink-700 underline" href={href} download>download</a>
                </div>
              );
            })}
          </div>
          {activeFile && (
            <div className="rounded-[12px] border border-ink-100 bg-paper-0 p-4 whitespace-pre-wrap text-sm">
              {fileContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
