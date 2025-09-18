"use client";
import Link from "next/link";
import MobileNav from "./MobileNav";

export default function NavBarPublic() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ink-100 bg-paper-0/95 text-ink-900 backdrop-blur supports-[backdrop-filter]:bg-paper-0/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-0"
            aria-label="ALAIN Home"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-alain-blue/30 bg-alain-blue/10 font-logo text-[18px] tracking-[0.2em] text-alain-blue transition-colors group-hover:bg-alain-blue/15 group-hover:text-alain-blue">
              A
            </span>
            <span className="leading-tight">
              <span className="block font-logo text-[20px] tracking-[0.42em] text-alain-blue">ALAIN</span>
              <span className="block text-xs uppercase tracking-[0.24em] text-ink-400">Applied Learning AI</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/notebooks"
              className="rounded-[10px] px-2 py-1 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-0"
            >
              Library
            </Link>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center px-3 rounded-alain-lg border border-ink-200 bg-paper-0 text-ink-700 transition hover:bg-paper-50 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-0"
          >
            Sign in
          </Link>
          <Link
            href="/generate"
            className="inline-flex h-10 items-center px-4 rounded-alain-lg bg-alain-blue text-white font-semibold shadow-brand transition hover:bg-alain-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-0"
          >
            Generate Manual
          </Link>
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
