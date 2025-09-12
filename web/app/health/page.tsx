"use client";

import { useEffect, useState } from "react";

export default function HealthPage() {
  const [data, setData] = useState<any>(null);
  const [models, setModels] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [h, m] = await Promise.all([
          fetch('/api/health').then(r=>r.json()),
          fetch('/api/providers/models', { cache: 'no-store' }).then(r=>r.json()).catch(()=>null),
        ]);
        if (!mounted) return;
        setData(h);
        setModels(m);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || String(e));
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function runTests() {
    try {
      setBusy(true); setSummary(null);
      const tests: Promise<Response>[] = [];
      tests.push(fetch('/api/providers/smoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider: 'poe', model: 'gpt-4o-mini' }) }));
      tests.push(fetch('/api/providers/smoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider: 'openai-compatible', model: 'gpt-4o' }) }));
      const res = await Promise.allSettled(tests);
      let pass = 0, fail = 0; let hint = '';
      for (const r of res) {
        if (r.status === 'fulfilled') {
          const ct = r.value.headers.get('content-type') || '';
          const j = ct.includes('application/json') ? await r.value.json().catch(()=>({})) : {};
          if (j?.success) pass++; else { fail++; if (!hint && Array.isArray(j?.error?.hints) && j.error.hints.length) hint = j.error.hints[0]; }
        } else fail++;
      }
      setSummary(`${pass} OK · ${fail} error${hint ? ` — ${hint}` : ''}`);
    } finally { setBusy(false); }
  }

  function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${ok ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>{children}</span>;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4 text-ink-900">
      <h1 className="text-2xl font-black font-display">System Health</h1>
      {error && <div className="p-2 text-red-300 bg-red-950/30 border border-red-900 rounded">{error}</div>}
      {!data && !error && <p className="text-sm text-ink-700">Loading…</p>}
      {data && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge ok={data.offlineMode || data.teacherProvider === 'poe'}>{data.offlineMode ? 'Offline' : `Hosted: ${data.teacherProvider || 'unknown'}`}</Badge>
            <Badge ok={!!data.poeConfigured}>Poe key: {data.poeConfigured ? 'configured' : 'missing'}</Badge>
            <Badge ok={!!data.openaiBaseUrl}>Base URL: {data.openaiBaseUrl ? 'present' : 'n/a'}</Badge>
          </div>
          <div className="text-sm text-ink-700">Teacher provider: {data.teacherProvider || 'n/a'} • OPENAI_BASE_URL: {data.openaiBaseUrl || 'n/a'}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {Object.entries<any>(data.services || {}).map(([k,v]) => (
              <div key={k} className="p-2 rounded-card border border-ink-100 bg-paper-0">
                <div className="font-medium">{k}</div>
                <div className="text-sm">{v.status}</div>
                {v.responseTime != null && <div className="text-xs text-ink-700">{v.responseTime} ms</div>}
                {v.message && <div className="text-xs text-ink-700">{v.message}</div>}
              </div>
            ))}
          </div>
          <button className="h-9 px-3 rounded-[12px] border border-ink-100 bg-paper-0" onClick={runTests} disabled={busy}>{busy ? 'Running tests…' : 'Run provider tests'}</button>
          {summary && <div className="text-sm text-ink-700">{summary}</div>}
        </div>
      )}
      {models && (
        <div className="space-y-2">
          <h2 className="font-semibold">Local Runtime</h2>
          <div className="text-sm">Provider: {models.provider} • Base: {models.baseUrl || 'n/a'}</div>
          <ul className="text-xs grid grid-cols-2 gap-1">
            {(models.models || []).map((m:string)=> <li key={m} className="truncate">{m}</li>)}
          </ul>
        </div>
      )}
    </main>
  );
}
