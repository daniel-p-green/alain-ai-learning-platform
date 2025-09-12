"use client";
import React from "react";

type Props = { nb: any };

function MarkdownCell({ source }: { source: string | string[] }) {
  const text = Array.isArray(source) ? source.join("") : source;
  return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br/>") }} />;
}

function CodeCell({ source }: { source: string | string[] }) {
  const code = Array.isArray(source) ? source.join("") : source;
  return (
    <pre className="bg-ink-900/50 rounded p-3 overflow-x-auto text-sm">
      <code>{code}</code>
    </pre>
  );
}

export default function NotebookViewer({ nb }: Props) {
  const cells = nb?.cells || [];
  return (
    <div className="space-y-4">
      {cells.map((cell: any, i: number) => {
        if (cell.cell_type === "markdown") return <MarkdownCell key={i} source={cell.source} />;
        if (cell.cell_type === "code") return <CodeCell key={i} source={cell.source} />;
        return (
          <div key={i} className="text-ink-500 text-sm">
            Unsupported cell type: {cell.cell_type}
          </div>
        );
      })}
    </div>
  );
}

