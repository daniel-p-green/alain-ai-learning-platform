"use client";
import React from 'react';

export default function TryPrompt({ provider, model }: { provider: string; model: string }) {
  const [prompt, setPrompt] = React.useState('Hello from ALAIN');
  const [out, setOut] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  return (
    <div className="mt-8 p-4 rounded border bg-white/70">
      <div className="font-medium mb-2">Try a prompt</div>
      <div className="text-xs text-ink-700 mb-2">Provider: {provider} · Model: {model}</div>
      <label htmlFor="promptTextarea" className="sr-only">Prompt</label>
      <textarea
        id="promptTextarea"
        className="w-full border rounded p-2 text-sm"
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt here"
        title="Prompt input"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          className="inline-flex items-center px-3 py-1.5 rounded bg-ink-900 text-white text-xs"
          disabled={loading}
          onClick={async ()=>{
            setLoading(true); setOut(null);
            try {
              const resp = await fetch('/api/execute', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider, model, messages:[{ role:'user', content: prompt }], max_tokens: 200 }) });
              const data = await resp.json();
              if (data?.success) setOut(data.content || ''); else setOut(data?.error?.message || 'Error');
            } catch(e:any) { setOut(String(e?.message || e)); }
            finally { setLoading(false); }
          }}
        >Run</button>
        {loading && <span className="text-xs text-ink-700">Running…</span>}
      </div>
      {out && <pre className="mt-3 text-xs bg-ink-50 p-3 rounded whitespace-pre-wrap">{out}</pre>}
    </div>
  );
}

