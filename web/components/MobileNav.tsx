"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-ink-100 bg-paper-0 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
      >
        <span className="sr-only">Menu</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current">
          <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-paper-0 border border-ink-100 rounded-[14px] shadow-card z-50" id={menuId} ref={panelRef} role="dialog" aria-modal="true">
          <nav className="p-2">
            <Link href="/tutorials" className="block px-3 py-2 rounded hover:bg-paper-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" onClick={() => setOpen(false)}>Tutorials</Link>
            <Link href="/blueprint" className="block px-3 py-2 rounded hover:bg-paper-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" onClick={() => setOpen(false)}>Why ALAIN</Link>
            <Link href="/settings" className="block px-3 py-2 rounded hover:bg-paper-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" onClick={() => setOpen(false)}>Settings</Link>
            <div className="h-px bg-ink-100 my-2" />
            <Link href="/generate" className="block px-3 py-2 rounded bg-alain-yellow text-alain-blue font-semibold text-center" onClick={() => setOpen(false)}>Get Started</Link>
          </nav>
        </div>
      )}
    </div>
  );
}

