"use client";
import { useEffect, useState } from "react";
import { Button } from "./Button";

export default function LocalSetupHelper({ visible = true }: { visible?: boolean }) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; models: string[] }>(null);

  if (!visible) return null;

  async function testConnection() {
    setChecking(true);
    setStatus(null);
    try {
      const resp = await fetch('/api/providers/models', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Request failed');
      const data = await resp.json();
      const models = Array.isArray(data?.models) ? data.models : [];
      setStatus({ ok: models.length > 0, models });
    } catch {
      setStatus({ ok: false, models: [] });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mt-2 border border-ink-100 rounded-card p-3 bg-paper-0 text-sm text-ink-900">
      <div className="font-medium mb-1">Local Setup Helper</div>
      <div className="text-ink-700">To run the teacher locally, install Ollama or use LM Studio.</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="px-2 py-1 rounded-card bg-paper-0 border border-ink-100 text-xs">ollama pull gpt-oss:20b</code>
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText('ollama pull gpt-oss:20b')}>Copy</Button>
        <Button variant="secondary" onClick={testConnection} disabled={checking}>{checking ? 'Testing…' : 'Test Connection'}</Button>
        {status && (
          status.ok ? (
            <span className="inline-flex items-center text-xs px-2 py-1 rounded-card bg-green-100 text-green-800 border border-green-200">Ready to generate! ({status.models.length} models detected)</span>
          ) : (
            <span className="inline-flex items-center text-xs px-2 py-1 rounded-card bg-yellow-100 text-yellow-800 border border-yellow-200">Not detected. Open Settings → Offline.</span>
          )
        )}
      </div>
    </div>
  );
}
