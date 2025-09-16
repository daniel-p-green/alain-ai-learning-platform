"use client";

/**
 * PromptCell
 * - Renders a Monaco editor (with textarea fallback) for prompt editing
 * - Controlled via `codeTemplate`; emits changes via `onChange`
 * - Shows a primary action button via `onExecute`
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

type Props = {
  codeTemplate: string;
  onChange?: (value: string) => void;
  onExecute?: () => void;
  disabled?: boolean;
};

export function PromptCell({ codeTemplate, onChange, onExecute, disabled }: Props) {
  const monacoRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    async function init() {
      if (!monacoRef.current || editorRef.current) return;
      try {
        const monaco = await import("monaco-editor");
        if (disposed) return;
        editorRef.current = monaco.editor.create(monacoRef.current!, {
          value: codeTemplate || "",
          language: "markdown",
          theme: "vs",
          automaticLayout: true,
          minimap: { enabled: false },
        });
        editorRef.current.onDidChangeModelContent(() => {
          const v = editorRef.current.getValue();
          onChange?.(v);
        });
        setReady(true);
      } catch {
        setReady(false);
      }
    }
    init();
    return () => {
      disposed = true;
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [onChange]);

  // Keep editor content in sync when parent changes codeTemplate
  useEffect(() => {
    if (editorRef.current && typeof codeTemplate === 'string') {
      try {
        const current = editorRef.current.getValue();
        if (current !== codeTemplate) {
          editorRef.current.setValue(codeTemplate);
        }
      } catch {}
    }
  }, [codeTemplate]);

  return (
    <div className="space-y-2">
      <div ref={monacoRef} className={`h-48 border border-ink-100 rounded ${ready ? "block" : "hidden"}`} />
      {!ready && (
        <textarea
          className="w-full min-h-32 p-3 bg-paper-0 text-ink-900 rounded border border-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
          value={codeTemplate}
          onChange={(e) => { onChange?.(e.target.value); }}
          aria-label="Prompt editor"
          placeholder="Enter your prompt here..."
        />
      )}
      <div>
        <Button onClick={onExecute} disabled={disabled}>Run step</Button>
      </div>
    </div>
  );
}
