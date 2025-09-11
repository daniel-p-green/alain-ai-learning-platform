"use client";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import type { ProviderInfo } from "../../lib/types";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Toast } from "../../components/Toast";

// Types imported from shared definitions

export default function SettingsPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [smoke, setSmoke] = useState<string | null>(null);
  const [probe, setProbe] = useState<any>(null);
  const [wizardMsg, setWizardMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");

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

  async function loadProbe() {
    try {
      const resp = await fetch('/api/setup', { cache: 'no-store' });
      const data = await resp.json();
      setProbe(data);
    } catch (e: any) {
      setProbe({ error: e?.message || String(e) });
    }
  }

  useEffect(() => { load(); loadProbe(); }, []);

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
        {/* Quick Setup Wizard */}
        <div className="p-4 rounded border border-gray-800 bg-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-white">Setup Wizard</div>
              <div className="text-sm text-gray-400">Get running in one click. We’ll detect local Ollama/LM Studio and configure the backend.</div>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-gray-300">
            <div>
              Status: {probe?.offlineMode ? <span className="text-yellow-300">OFFLINE</span> : <span className="text-gray-300">Hosted</span>} · Provider: <span className="text-gray-200">{probe?.teacherProvider || 'unknown'}</span> · Base URL: <span className="text-gray-200">{probe?.openaiBaseUrl || 'n/a'}</span>
            </div>
            <div>
              Ollama detected at localhost:11434: {probe?.ollamaDetected ? <span className="text-green-300">yes</span> : <span className="text-red-300">no</span>}
            </div>
            <div>
              LM Studio detected at localhost:1234: {probe?.lmStudioDetected ? <span className="text-green-300">yes</span> : <span className="text-red-300">no</span>}
            </div>
            <div>
              Poe configured: {probe?.poeConfigured ? <span className="text-green-300">yes</span> : <span className="text-yellow-300">no</span>}
            </div>
          </div>
          {wizardMsg && <div className="mt-3 p-2 text-xs border border-gray-700 rounded bg-gray-950">{wizardMsg}</div>}
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={async ()=>{
              setWizardMsg(null);
              const resp = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode: 'offline' }) });
              const data = await resp.json();
              if (data.success) {
                setWizardMsg('Switched to Offline Mode (Ollama).');
                setToastVariant('success');
                setToastMsg('Switched to Offline Mode');
                await loadProbe();
                await load();
              } else {
                setWizardMsg(`Error: ${data.message || 'failed to switch'}`);
                setToastVariant('error');
                setToastMsg('Failed to switch to Offline Mode');
              }
            }}>Switch to Offline Mode</Button>
            <Button onClick={async ()=>{
              setWizardMsg(null);
              const resp = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode: 'offline', baseUrl: 'http://localhost:1234/v1', apiKey: 'lmstudio' }) });
              const data = await resp.json();
              if (data.success) {
                setWizardMsg('Configured for LM Studio (local).');
                setToastVariant('success');
                setToastMsg('Using LM Studio at localhost:1234');
                await loadProbe();
                await load();
              } else {
                setWizardMsg(`Error: ${data.message || 'failed to switch'}`);
                setToastVariant('error');
                setToastMsg('Failed to configure LM Studio');
              }
            }}>Use LM Studio (local)</Button>
            <Button onClick={async ()=>{
              setWizardMsg(null);
              const resp = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode: 'offline', baseUrl: 'http://localhost:11434/v1', apiKey: 'ollama' }) });
              const data = await resp.json();
              if (data.success) {
                setWizardMsg('Configured for Ollama (local).');
                setToastVariant('success');
                setToastMsg('Using Ollama at localhost:11434');
                await loadProbe();
                await load();
              } else {
                setWizardMsg(`Error: ${data.message || 'failed to switch'}`);
                setToastVariant('error');
                setToastMsg('Failed to configure Ollama');
              }
            }}>Use Ollama (local)</Button>
            <Button variant="secondary" onClick={async ()=>{
              setWizardMsg(null);
              const resp = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode: 'hosted' }) });
              const data = await resp.json();
              if (data.success) {
                setWizardMsg('Switched to Hosted Mode (Poe).');
                setToastVariant('success');
                setToastMsg('Switched to Hosted Mode');
                await loadProbe();
                await load();
              } else {
                setWizardMsg(`Error: ${data.message || 'failed to switch'}`);
                setToastVariant('error');
                setToastMsg('Failed to switch to Hosted Mode');
              }
            }}>Switch to Hosted (Poe)</Button>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText('ollama pull gpt-oss:20b')}>Copy: pull Ollama model</Button>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText('Open LM Studio → Download a model → Start server on port 1234')}>LM Studio: quick instructions</Button>
          </div>
        </div>

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
                    <div className="text-xs text-gray-500 mt-1">
                      Capabilities: {p.supportsHarmonyRoles ? 'harmony-roles ' : ''}{p.supportsTools ? 'tools ' : ''}
                    </div>
                    {p.notes && <div className="text-xs text-gray-500">{p.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => validate(p.id)}>Validate</Button>
                    <Button
                      className="text-xs px-2 py-1"
                      onClick={async ()=>{
                        setSmoke(null);
                        const model = (p.models?.[0]?.id) || (p.id==='poe' ? 'gpt-4o-mini' : 'gpt-4o');
                        const resp = await fetch('/api/providers/smoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider: p.id, model }) });
                        const data = await resp.json();
                        setSmoke(data.success ? `OK: ${(data.sample||'').slice(0,80)}...` : `Error: ${data?.error?.message || 'unknown'}`);
                      }}
                      variant="secondary"
                    >Run smoke test</Button>
                    {p.id === "openai-compatible" && (
                      <Button
                        type="button"
                        className="text-xs px-2 py-1"
                        onClick={() => navigator.clipboard.writeText("# LM Studio\nexport OPENAI_BASE_URL=http://localhost:1234/v1\nexport OPENAI_API_KEY=lmstudio\n\n# Ollama\n# export OPENAI_BASE_URL=http://localhost:11434/v1\n# export OPENAI_API_KEY=ollama\n\n# OpenAI (cloud)\n# export OPENAI_BASE_URL=https://api.openai.com/v1\n# export OPENAI_API_KEY=YOUR_KEY_HERE")}
                        variant="secondary"
                      >Copy env snippet</Button>
                    )}
                    {p.id === "poe" && (
                      <Button
                        type="button"
                        className="text-xs px-2 py-1"
                        onClick={() => navigator.clipboard.writeText("export POE_API_KEY=YOUR_KEY_HERE\n# Base URL: https://api.poe.com/v1")}
                        variant="secondary"
                      >Copy env snippet</Button>
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
      {toastMsg && (
        <Toast message={toastMsg} variant={toastVariant} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
}
