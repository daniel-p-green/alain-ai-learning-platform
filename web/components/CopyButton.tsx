"use client";
import React from "react";

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center px-2.5 py-1.5 rounded border text-xs ${copied ? 'bg-green-600 border-green-700 text-white' : 'bg-white/70 border-ink-200 text-ink-800 hover:bg-paper-50'}`}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

