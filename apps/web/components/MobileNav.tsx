"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type MobileNavLink = { href: string; label: string };

type MobileNavProps = {
  links: MobileNavLink[];
  footer?: ReactNode;
  title?: string;
  triggerAriaLabel?: string;
};

export default function MobileNav({ links, footer, title = "Menu", triggerAriaLabel = "Menu" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [anim, setAnim] = useState(false); // controls enter/exit transitions
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeWithAnim();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        closeWithAnim();
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  // Lock body scroll when the sheet is open
  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // trigger enter animation next frame
      const id = requestAnimationFrame(() => setAnim(true));
      return () => {
        document.body.style.overflow = previous;
        cancelAnimationFrame(id);
      };
    }
  }, [open]);

  function closeWithAnim() {
    // play exit transition then unmount
    setAnim(false);
    setTimeout(() => setOpen(false), 250);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-white/30 bg-transparent text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
      >
        <span className="sr-only">{triggerAriaLabel}</span>
        <div className="relative w-5 h-5">
          <span
            className={`absolute left-0 w-5 h-0.5 bg-white transition-all duration-200 ease-out ${open ? 'top-2.5 rotate-45' : 'top-1 rotate-0'}`}
          />
          <span
            className={`absolute left-0 w-5 h-0.5 bg-white transition-all duration-200 ease-out ${open ? 'top-2.5 opacity-0' : 'top-2.5 opacity-100'}`}
          />
          <span
            className={`absolute left-0 w-5 h-0.5 bg-white transition-all duration-200 ease-out ${open ? 'top-2.5 -rotate-45' : 'top-4 rotate-0'}`}
          />
        </div>
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={`${menuId}-title`}>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)] ${anim ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeWithAnim}
          />
          {/* Sheet */}
          <div
            ref={panelRef}
            id={menuId}
            className={`absolute inset-y-0 left-0 w-full max-w-[90vw] sm:max-w-[420px] bg-paper-0 border-r border-ink-100 shadow-card flex flex-col transform transition-all duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)] will-change-transform ${anim ? 'translate-x-0 scale-100' : '-translate-x-full scale-95'}`}
          >
            {/* Header */}
            <div className="h-14 px-3 flex items-center justify-between border-b border-ink-100">
              <div id={`${menuId}-title`} className="font-display font-semibold text-ink-900">{title}</div>
              <button
                onClick={closeWithAnim}
                aria-label="Close menu"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-ink-100 text-ink-700 hover:bg-paper-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="stroke-current">
                  <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <nav className="px-2 py-3">
                <div className="px-2 py-2 text-xs uppercase tracking-wide text-ink-500">Navigate</div>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-3 text-[16px] rounded-[12px] hover:bg-paper-50 active:bg-paper-100"
                    onClick={closeWithAnim}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Sticky bottom actions */}
            {footer && (
              <div className="p-3 border-t border-ink-100 bg-paper-0" onClick={closeWithAnim}>
                {footer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
