"use client";
import dynamic from "next/dynamic";
import React from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false, loading: () => <textarea className="w-full h-32 rounded border p-2" /> });

type Props = { value: string; onChange: (v: string) => void };

export default function MarkdownEditor({ value, onChange }: Props) {
  return (
    <div className="w-full">
      <MDEditor value={value} onChange={(v: any) => onChange(typeof v === 'string' ? v : (v || ''))} />
    </div>
  );
}

