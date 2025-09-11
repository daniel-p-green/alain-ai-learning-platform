"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Probe = {
  offlineMode?: boolean;
  teacherProvider?: string | null;
  openaiBaseUrl?: string | null;
  poeConfigured?: boolean;
};

export default function EnvStatusBadge() {
  const [probe, setProbe] = useState<Probe | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await fetch('/api/setup', { cache: 'no-store' });
        const data = await resp.json();
        if (!alive) return; setProbe(data);
      } catch { setProbe({}); }
    })();
    return () => { alive = false; };
  }, []);

  if (!probe) return null;
  const { offlineMode, teacherProvider, poeConfigured } = probe;
  const poe = teacherProvider === 'poe';
  const ok = offlineMode || (poe ? !!poeConfigured : !!teacherProvider);
  const baseLabel = offlineMode ? 'Offline' : poe ? (poeConfigured ? 'Poe configured' : 'Poe missing') : (teacherProvider || 'Hosted');

  async function runTests() {
    try {
      setBusy(true); setMsg(null);
      const tests: Promise<Response>[] = [];
      // Test both providers that we commonly use
      tests.push(fetch('/api/providers/smoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider: 'poe', model: 'gpt-4o-mini' }) }));
      tests.push(fetch('/api/providers/smoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider: 'openai-compatible', model: 'gpt-4o' }) }));
      const res = await Promise.allSettled(tests);
      let pass = 0; let fail = 0; let hints: string[] = [];
      for (const r of res) {
        if (r.status === 'fulfilled') {
          const ct = r.value.headers.get('content-type') || '';
          const j = ct.includes('application/json') ? await r.value.json().catch(()=>({})) : {};
          if (j?.success) pass++; else { fail++; if (Array.isArray(j?.error?.hints)) hints.push(...j.error.hints); }
        } else {
          fail++;
        }
      }
      setMsg(`${pass} passed, ${fail} failed${hints.length ? ` — ${hints[0]}` : ''}`);
    } finally {
      setBusy(false);
    }
  }

  const snippet = `# Hosted (Poe)\nexport POE_API_KEY=YOUR_KEY\n\n# Local (Ollama)\nexport OPENAI_BASE_URL=http://localhost:11434/v1\nexport OPENAI_API_KEY=ollama\n\n# Local (LM Studio)\nexport OPENAI_BASE_URL=http://localhost:1234/v1\nexport OPENAI_API_KEY=lmstudio\n`;

  return (
    <div className="relative">
      <button ref={btnRef} onClick={() => setOpen(v=>!v)} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border select-none ${ok ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`} aria-haspopup="menu" aria-expanded={open}>
        {baseLabel}
        <svg className="ml-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-[12px] border border-ink-100 bg-paper-0 shadow-card p-2 z-50">
          <div className="text-xs text-ink-700 p-2 border border-ink-100 rounded">{offlineMode ? 'Offline mode' : `Provider: ${teacherProvider || 'unknown'}`}</div>
          <div className="mt-2 flex flex-col gap-1">
            <button className="h-8 px-3 rounded-[12px] border border-ink-100 bg-paper-0 text-left" onClick={() => { navigator.clipboard.writeText(snippet); setMsg('Env snippets copied'); }}>
              Copy env snippets
            </button>
            <Link className="h-8 px-3 rounded-[12px] border border-ink-100 bg-paper-0 inline-flex items-center" href="/settings">Open Settings</Link>
            <button className="h-8 px-3 rounded-[12px] border border-ink-100 bg-paper-0 text-left disabled:opacity-50" disabled={busy} onClick={runTests}>{busy ? 'Running tests…' : 'Run tests'}</button>
          </div>
          {msg && <div className="mt-2 text-xs text-ink-700">{msg}</div>}
        </div>
      )}
    </div>
  );
}
