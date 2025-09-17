"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Pluggable } from "unified";
import { runPython } from "./PyRunner";
import { runJS } from "./JSRunner";

type Props = { nb: any };

const sanitizePlugin = rehypeSanitize as unknown as Pluggable;

function MarkdownCell({ source }: { source: string | string[] }) {
  const text = Array.isArray(source) ? source.join("") : source;
  return (
    <ReactMarkdown
      className="prose prose-invert max-w-none"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[sanitizePlugin]}
    >
      {text}
    </ReactMarkdown>
  );
}

function CodeCell({ source, lang }: { source: string | string[]; lang?: string }) {
  const code = Array.isArray(source) ? source.join("") : source;
  const [out, setOut] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  async function onRun() {
    setBusy(true); setErr(""); setOut("");
    try {
      const l = (lang || 'python').toLowerCase();
      if (l === 'python') {
        const res = await runPython(code);
        setOut(res.stdout || "");
        if (res.stderr) setErr(res.stderr);
      } else if (l === 'javascript' || l === 'js' || l === 'typescript' || l === 'ts') {
        const res = await runJS(code, l.startsWith('ts'));
        setOut(res.stdout || "");
        if (res.stderr) setErr(res.stderr);
      } else {
        setErr(`Execution for ${lang} not supported`);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bg-ink-900/50 rounded p-3 overflow-x-auto text-sm">
      <pre className="overflow-x-auto text-sm"><code>{code}</code></pre>
      <div className="mt-2 flex items-center gap-2">
        <button onClick={onRun} disabled={busy} className="h-8 px-3 rounded bg-alain-yellow text-alain-blue font-semibold disabled:opacity-50">{busy ? 'Running…' : 'Run'}</button>
        {lang && <span className="text-xs text-ink-400">{lang}</span>}
      </div>
      {(out || err) && (
        <div className="mt-2 rounded bg-black/40 p-2 text-xs whitespace-pre-wrap">
          {out && <div>{out}</div>}
          {err && <div className="text-red-400">{err}</div>}
        </div>
      )}
    </div>
  );
}

export default function NotebookViewer({ nb }: Props) {
  const cells = nb?.cells || [];
  return (
    <div className="space-y-4">
      {cells.map((cell: any, i: number) => {
        if (cell.cell_type === "markdown") return <MarkdownCell key={i} source={cell.source} />;
        if (cell.cell_type === "code") return <CodeCell key={i} source={cell.source} lang={cell.metadata?.lang} />;
        return (
          <div key={i} className="text-ink-500 text-sm">
            Unsupported cell type: {cell.cell_type}
          </div>
        );
      })}
    </div>
  );
}
