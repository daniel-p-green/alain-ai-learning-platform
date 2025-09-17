"use client";
import { useState } from "react";
import { Button } from "./Button";

/**
 * Quick helper that surfaces the minimum runtime commands for hosting GPT-OSS locally.
 * Keeps copyable blocks compact so the UI stays readable while still pointing to
 * the deeper setup docs in the notebook/README.
 */
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

  const installCommand = "pip install -U transformers kernels accelerate triton";
  const ollamaCommand = "ollama pull gpt-oss:20b";
  const pythonSnippet = `from transformers import AutoModelForCausalLM\n\nmodel = AutoModelForCausalLM.from_pretrained(\n    "openai/gpt-oss-20b",\n    dtype="auto",\n    device_map="auto",\n    use_kernels=True,\n)\n`;

  function Copyable({ value, inline = true }: { value: string; inline?: boolean }) {
    const Element = inline ? "code" : "pre";
    const className = inline
      ? "px-2 py-1 rounded-card bg-paper-0 border border-ink-100 text-xs"
      : "px-2 py-1 rounded-card bg-paper-0 border border-ink-100 text-xs whitespace-pre-wrap leading-snug";
    const handleCopy = () => {
      if (typeof navigator.clipboard?.writeText === "function") {
        navigator.clipboard.writeText(value).catch(() => {});
      }
    };
    return (
      <div className="flex flex-wrap items-start gap-2">
        <Element className={className}>{value}</Element>
        <Button variant="secondary" onClick={handleCopy}>Copy</Button>
      </div>
    );
  }

  return (
    <div className="mt-2 border border-ink-100 rounded-card p-3 bg-paper-0 text-sm text-ink-900 space-y-3">
      <div className="font-medium">Local Setup Helper</div>
      <p className="text-ink-700">
        Upgrade the Transformers stack, pull the model, and load it with the new downloadable kernels. Hopper GPUs can also enable Flash Attention 3 via
        <code className="mx-1 rounded bg-paper-0 px-1 py-[1px] border border-ink-100 text-[11px]">attn_implementation="kernels-community/vllm-flash-attn3"</code>.
      </p>
      <Copyable value={installCommand} />
      <Copyable value={ollamaCommand} />
      <Copyable value={pythonSnippet} inline={false} />
      <div className="flex flex-wrap items-center gap-2">
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
