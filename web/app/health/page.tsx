"use client";

import { useEffect, useState } from "react";

export default function HealthPage() {
  const [data, setData] = useState<any>(null);
  const [models, setModels] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-black font-display">System Health</h1>
      {error && <div className="p-2 text-red-300 bg-red-950/30 border border-red-900 rounded">{error}</div>}
      {!data && !error && <p className="text-sm text-gray-500">Loading…</p>}
      {data && (
        <div className="space-y-2">
          <div>Status: <b>{data.status}</b> • Offline mode: {String(data.offlineMode)}</div>
          <div className="text-sm text-gray-400">Teacher provider: {data.teacherProvider} • OPENAI_BASE_URL: {data.openaiBaseUrl || 'n/a'}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {Object.entries<any>(data.services || {}).map(([k,v]) => (
              <div key={k} className="p-2 rounded border border-gray-800">
                <div className="font-medium">{k}</div>
                <div className="text-sm">{v.status}</div>
                {v.responseTime != null && <div className="text-xs text-gray-500">{v.responseTime} ms</div>}
                {v.message && <div className="text-xs text-gray-500">{v.message}</div>}
              </div>
            ))}
          </div>
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

