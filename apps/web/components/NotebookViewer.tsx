"use client";
import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Pluggable } from "unified";
import { runPython } from "./PyRunner";
import { runJS } from "./JSRunner";

type Props = {
  nb: any;
  editable?: boolean;
  onChange?: (nb: any) => void;
};

const sanitizePlugin = rehypeSanitize as unknown as Pluggable;

type MarkdownCellProps = {
  source: string | string[];
  editable?: boolean;
  onChange?: (value: string) => void;
};

function MarkdownCell({ source, editable, onChange }: MarkdownCellProps) {
  const text = Array.isArray(source) ? source.join("") : source;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useEffect(() => {
    if (!editing) {
      setDraft(text);
    }
  }, [text, editing]);

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      {editable && (
        <div className="mb-3 flex justify-end gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded bg-transparent px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-paper-100 hover:text-ink-700"
            >
              Edit
            </button>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={() => { setDraft(text); setEditing(false); }}
                className="rounded bg-transparent px-2 py-1 text-xs font-semibold text-ink-400 hover:bg-paper-100 hover:text-ink-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange?.(draft);
                  setEditing(false);
                }}
                className="rounded bg-alain-blue px-3 py-1 text-xs font-semibold text-white hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40"
              >
                Save
              </button>
            </>
          )}
        </div>
      )}
      {editing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full rounded-[14px] border border-ink-200 bg-white p-3 text-sm text-ink-800 shadow-inner focus:border-alain-blue focus:outline-none"
          rows={Math.max(6, draft.replace(/\r?\n$/, '').split(/\r?\n/).length + 1)}
        />
      ) : (
        <ReactMarkdown
          className="prose prose-slate max-w-none text-ink-800"
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[sanitizePlugin]}
        >
          {text}
        </ReactMarkdown>
      )}
    </section>
  );
}

type CodeCellProps = {
  source: string | string[];
  lang?: string;
  editable?: boolean;
  onChange?: (value: string) => void;
};

function CodeCell({ source, lang, editable, onChange }: CodeCellProps) {
  const code = Array.isArray(source) ? source.join("") : source;
  const [out, setOut] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(code);

  useEffect(() => {
    if (!editing) {
      setDraft(code);
    }
  }, [code, editing]);

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
    <section className="space-y-3 rounded-2xl border border-ink-900/70 bg-[#0B1120] p-5 text-sm text-ink-50 shadow-sm">
      {editable && (
        <div className="flex justify-end gap-2 text-xs">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded bg-transparent px-2 py-1 font-semibold text-ink-200 hover:bg-white/10 hover:text-white"
            >
              Edit
            </button>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={() => { setDraft(code); setEditing(false); }}
                className="rounded bg-transparent px-2 py-1 font-semibold text-ink-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange?.(draft);
                  setEditing(false);
                }}
                className="rounded bg-alain-blue px-3 py-1 font-semibold text-white hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40"
              >
                Save
              </button>
            </>
          )}
        </div>
      )}
      {editing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full rounded-[14px] border border-ink-700 bg-ink-950 p-3 font-mono text-sm text-ink-50 focus:border-alain-blue focus:outline-none"
          rows={Math.max(8, draft.replace(/\r?\n$/, '').split(/\r?\n/).length + 1)}
        />
      ) : (
        <pre className="overflow-x-auto text-sm leading-relaxed"><code>{code}</code></pre>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={busy || editing}
          className="inline-flex h-9 items-center rounded-full bg-alain-blue px-4 text-xs font-semibold text-white transition hover:bg-alain-blue/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
        >
          {busy ? 'Running…' : 'Run cell'}
        </button>
        {lang && <span className="text-xs text-ink-300 uppercase tracking-wide">{lang}</span>}
      </div>
      {(out || err) && (
        <div className="rounded-xl border border-white/20 bg-black/30 p-3 text-xs whitespace-pre-wrap">
          {out && <div>{out}</div>}
          {err && <div className="text-red-300">{err}</div>}
        </div>
      )}
    </section>
  );
}

function normaliseSource(value: string, original: string | string[] | undefined) {
  if (Array.isArray(original)) {
    const lines = value.replace(/\r\n/g, "\n").split("\n");
    return lines.map((line, index) => (index < lines.length - 1 ? `${line}\n` : line));
  }
  if (typeof original === "string") {
    return value;
  }
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  if (lines.length === 1) return value;
  return lines.map((line, index) => (index < lines.length - 1 ? `${line}\n` : line));
}

export default function NotebookViewer({ nb, editable, onChange }: Props) {
  const cells = nb?.cells || [];
  const handleCellChange = useCallback((index: number, nextValue: string) => {
    if (!editable || !onChange || !nb) return;
    const currentCells = Array.isArray(nb.cells) ? nb.cells : [];
    if (!currentCells[index]) return;
    const nextCells = currentCells.map((cell: any, cellIndex: number) => {
      if (cellIndex !== index) return cell;
      return {
        ...cell,
        source: normaliseSource(nextValue, cell.source),
      };
    });
    onChange({ ...nb, cells: nextCells });
  }, [editable, nb, onChange]);

  return (
    <div className="space-y-6">
      {cells.map((cell: any, i: number) => {
        if (cell.cell_type === "markdown") {
          return (
            <MarkdownCell
              key={i}
              source={cell.source}
              editable={editable}
              onChange={(value) => handleCellChange(i, value)}
            />
          );
        }
        if (cell.cell_type === "code") {
          return (
            <CodeCell
              key={i}
              source={cell.source}
              lang={cell.metadata?.lang}
              editable={editable}
              onChange={(value) => handleCellChange(i, value)}
            />
          );
        }
        return (
          <div key={i} className="text-ink-500 text-sm">
            Unsupported cell type: {cell.cell_type}
          </div>
        );
      })}
    </div>
  );
}
