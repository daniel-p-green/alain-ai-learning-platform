"use client";
import { useId, useState } from "react";

export default function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border border-ink-100 rounded-card bg-paper-0">
      <button
        className="w-full flex items-center justify-between p-5 font-display font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-ink-900">{title}</span>
        <svg className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`} width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id={id} hidden={!open} className="px-5 pb-5 font-inter leading-relaxed text-ink-700">
        {children}
      </div>
    </div>
  );
}

