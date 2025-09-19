"use client";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type SetupProbe = {
  offlineMode?: boolean;
  teacherProvider?: string | null;
  openaiBaseUrl?: string | null;
  ollamaDetected?: boolean;
  poeConfigured?: boolean;
};

export type MobileNavLink = { href: string; label: string; external?: boolean };

type MobileNavProps = {
  links: MobileNavLink[];
  footer?: ReactNode;
  title?: string;
  triggerAriaLabel?: string;
  side?: "left" | "right";
};

export default function MobileNav({
  links,
  footer,
  title = "Menu",
  triggerAriaLabel = "Menu",
  side = "right",
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [anim, setAnim] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SetupProbe | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isRight = side !== "left";
  const fetchedStatusRef = useRef(false);
  // Build the provider status list ahead of render so we can reuse it for messaging and actions.
  const connections = buildConnectionList(status);
  const connectionNeedsHelp = connections.some((item) => !item.ok);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const id = requestAnimationFrame(() => setAnim(true));
      return () => {
        document.body.style.overflow = previous;
        cancelAnimationFrame(id);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open || fetchedStatusRef.current) return;
    fetchedStatusRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/setup', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setStatus(data);
          setStatusError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus(null);
          setStatusError(err?.message || 'Status unavailable');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function closeWithAnim() {
    setAnim(false);
    setTimeout(() => setOpen(false), 250);
  }

  const overlay = open && mounted && portalTarget
    ? createPortal(
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby={`${menuId}-title`}>
          <div
            className={`absolute inset-0 bg-ink-900/70 transition-opacity duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)] ${
              anim ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeWithAnim}
          />
          <div
            ref={panelRef}
            id={menuId}
            className={`absolute inset-y-0 ${
              isRight ? "right-0" : "left-0"
            } flex h-full w-full max-w-[92vw] flex-col bg-white text-ink-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)] will-change-transform ${
              anim ? "translate-x-0" : isRight ? "translate-x-full" : "-translate-x-full"
            }`}
          >
            <div className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4">
              <div id={`${menuId}-title`} className="text-sm font-semibold uppercase tracking-[0.22em] text-ink-500">
                {title}
              </div>
              <button
                onClick={closeWithAnim}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:bg-paper-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="stroke-current">
                  <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="space-y-1 px-4 py-6">
                <div className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Navigate
                </div>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-[14px] px-3 py-3 text-[17px] font-medium text-ink-800 transition hover:bg-paper-50 active:bg-paper-100"
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    onClick={closeWithAnim}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            {footer && (
              <div className="border-t border-ink-100 bg-paper-0 p-4" onClick={closeWithAnim}>
                {footer}
              </div>
            )}
            {fetchedStatusRef.current && (
              <div className="border-t border-ink-100 bg-paper-0 px-4 py-4 text-sm">
                <div className="pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Connections
                </div>
                {statusError && <div className="text-xs text-amber-600">{statusError}</div>}
                {!statusError && (
                  <ul className="space-y-1">
                    {connections.map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-[13px]">
                        <span className="text-ink-700">{item.label}</span>
                        <span className={`text-xs font-semibold ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{item.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {connectionNeedsHelp && (
                  <Link
                    href="/onboarding"
                    className="mt-3 inline-flex h-9 items-center justify-center rounded-[12px] border border-ink-200 px-3 text-xs font-semibold text-ink-800 hover:bg-paper-50"
                  >
                    Open setup wizard
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>,
        portalTarget
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? closeWithAnim() : setOpen(true))}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-2 text-ink-800 shadow-sm transition hover:border-alain-blue/40 hover:text-alain-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <span className="sr-only">{triggerAriaLabel}</span>
        <div className="relative h-4 w-5">
          <span
            className={`absolute left-0 h-0.5 w-5 bg-current transition-all duration-200 ease-out ${
              open ? "top-2 rotate-45" : "top-0 rotate-0"
            }`}
          />
          <span
            className={`absolute left-0 h-0.5 w-5 bg-current transition-all duration-200 ease-out ${
              open ? "top-2 opacity-0" : "top-2 opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 h-0.5 w-5 bg-current transition-all duration-200 ease-out ${
              open ? "top-2 -rotate-45" : "top-4 rotate-0"
            }`}
          />
        </div>
        <span className="hidden text-sm font-medium text-ink-700 sm:inline">Menu</span>
      </button>
      {overlay}
    </div>
  );
}

function buildConnectionList(data: SetupProbe | null) {
  const baseUrl = data?.openaiBaseUrl?.toString() || '';
  const poeReady = Boolean(data?.poeConfigured);
  const ollamaReady = Boolean(data?.ollamaDetected) || baseUrl.includes('11434') || baseUrl.toLowerCase().includes('ollama');
  const lmStudioReady = baseUrl.includes('1234') || baseUrl.toLowerCase().includes('lmstudio');

  return [
    {
      id: 'poe',
      label: 'Poe (hosted)',
      ok: poeReady,
      message: poeReady ? 'Ready' : 'Add API key',
    },
    {
      id: 'ollama',
      label: 'Ollama',
      ok: ollamaReady,
      message: ollamaReady ? 'Detected' : 'Start local runtime',
    },
    {
      id: 'lmstudio',
      label: 'LM Studio',
      ok: lmStudioReady,
      message: lmStudioReady ? 'Connected' : 'Not connected',
    },
  ];
}
