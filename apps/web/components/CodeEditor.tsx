"use client";
import dynamic from "next/dynamic";
import React from "react";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false, loading: () => <textarea className="w-full h-32 font-mono text-sm rounded border p-2" /> });

type Props = { value: string; onChange: (v: string) => void; height?: number | string; language?: string; theme?: "vs-dark" | "light" | "vs-light" };

export default function CodeEditor({ value, onChange, height = 200, language = "python", theme = "vs-dark" }: Props) {
  return (
    <Monaco
      height={height}
      defaultLanguage={language}
      language={language}
      theme={theme === "light" ? "vs-light" : theme}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on" }}
    />
  );
}
