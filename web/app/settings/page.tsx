"use client";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

type ProviderInfo = {
  id: string; name: string; description: string;
  supportsStreaming: boolean; requiresAuth: boolean;
  status: "available" | "configuring" | "unavailable" | "unknown";
};

export default function SettingsPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [smoke, setSmoke] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const resp = await fetch("/api/providers");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setProviders(data.providers || []);
    } catch (e: any) {
      setMessage(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function validate(providerId: string) {
    setMessage(null);
    try {
      const resp = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const data = await resp.json();
      setMessage(data.valid ? `${providerId} validated successfully` : (data.message || `${providerId} invalid`));
    } catch (e: any) {
      setMessage(e?.message || String(e));
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SignedOut>
        <div className="text-gray-300">
          Please sign in to manage settings. <SignInButton />
        </div>
      </SignedOut>
      <SignedIn>
        <p className="text-gray-400">Validate provider configuration (BYOK and Poe).</p>
        {message && (
          <div className="p-3 rounded bg-gray-900 border border-gray-700 text-sm">{message}</div>
        )}
        {loading ? (
          <div className="text-gray-400">Loading providers…</div>
        ) : (
          <div className="grid gap-3">
            {providers.map(p => (
              <div key={p.id} className="p-3 rounded border border-gray-800 bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white flex items-center gap-2">
                      {p.name}
                      <span className={`text-xs px-2 py-0.5 rounded border ${p.status === 'available' ? 'bg-green-900/40 border-green-700 text-green-300' : p.status === 'configuring' ? 'bg-yellow-900/40 border-yellow-700 text-yellow-300' : 'bg-red-900/40 border-red-700 text-red-300'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{p.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Status: {p.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => validate(p.id)} className="px-3 py-1 rounded bg-blue-600 text-white">
                      Validate
                    </button>
                    <button
                      onClick={async ()=>{
                        setSmoke(null);
                        const model = (p.models?.[0]?.id) || (p.id==='poe' ? 'gpt-4o-mini' : 'gpt-4o');
                        const resp = await fetch('/api/providers/smoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider: p.id, model }) });
                        const data = await resp.json();
                        setSmoke(data.success ? `OK: ${(data.sample||'').slice(0,80)}...` : `Error: ${data?.error?.message || 'unknown'}`);
                      }}
                      className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white text-xs"
                    >Run smoke test</button>
                    {p.id === "openai-compatible" && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText("export OPENAI_BASE_URL=https://api.openai.com/v1\nexport OPENAI_API_KEY=YOUR_KEY_HERE")}
                        className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white text-xs"
                      >Copy env snippet</button>
                    )}
                    {p.id === "poe" && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText("export POE_API_KEY=YOUR_KEY_HERE\n# Base URL: https://api.poe.com/v1")}
                        className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white text-xs"
                      >Copy env snippet</button>
                    )}
                  </div>
                </div>
                {p.id === "openai-compatible" && (
                  <div className="text-xs text-gray-500 mt-2">
                  Set OPENAI_BASE_URL and OPENAI_API_KEY in backend env. Example base URL: https://api.openai.com/v1 or http://localhost:11434/v1 (Ollama).
                  </div>
                )}
                {p.id === "poe" && (
                  <div className="text-xs text-gray-500 mt-2">
                    Set POE_API_KEY in backend env. Provider base: https://api.poe.com/v1
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SignedIn>
    </div>
  );
}
