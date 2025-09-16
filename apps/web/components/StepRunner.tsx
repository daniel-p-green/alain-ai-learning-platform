"use client";
import React from 'react';

type Props = {
  provider: string;
  model: string;
  codeTemplate: string;
  temperature?: number;
  maxTokens?: number;
};

export default function StepRunner({ provider, model, codeTemplate, temperature = 0.7, maxTokens = 300 }: Props) {
  const [prompt, setPrompt] = React.useState<string>(codeTemplate || "");
  const [out, setOut] = React.useState<string>("");
  const [err, setErr] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  async function run() {
    setLoading(true); setOut(""); setErr("");
    try {
      const resp = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          stream: false,
        })
      });
      const data = await resp.json();
      if (data?.success) {
        setOut(String(data.content || ''));
      } else {
        setErr(String(data?.error?.message || `Run failed (HTTP ${resp.status})`));
      }
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-alain-lg p-3 bg-ink-50/50">
      <div className="text-xs text-ink-700 mb-2">Edit the step prompt and click Run.</div>
      <textarea
        className="w-full min-h-28 p-2 text-sm font-mono rounded border border-ink-100 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
        value={prompt}
        onChange={(e)=> setPrompt(e.target.value)}
        aria-label="Step prompt"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          className="inline-flex items-center h-9 px-3 rounded bg-ink-900 text-white disabled:opacity-50"
          disabled={loading}
          onClick={run}
        >{loading ? 'Running…' : 'Run step'}</button>
        <span className="text-xs text-ink-700">Provider: {provider} · Model: {model}</span>
      </div>
      {out && (
        <pre className="mt-3 text-xs bg-white p-3 rounded border border-ink-100 whitespace-pre-wrap">{out}</pre>
      )}
      {err && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap">{err}</div>
      )}
    </div>
  );
}

