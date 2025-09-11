"use client";
import Link from "next/link";
import Image from "next/image";
import BrandLogo from "./BrandLogo";
import dynamic from "next/dynamic";
import MobileNav from "./MobileNav";
import EnvStatusBadge from "./EnvStatusBadge";

export default function NavBar() {
  const OfflineBadge = dynamic(() => import("./OfflineBadge"), { ssr: false });
  const LocalRuntimeStatus = dynamic(() => import("./LocalRuntimeStatus"), { ssr: false });
  return (
    <nav className="bg-paper-0 border-b border-ink-100 text-ink-900">
      <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue rounded">
            {/* ALAIN primary logo with theme-aware variant */}
            <BrandLogo width={160} height={40} />
          </Link>
          <div className="hidden md:flex items-center gap-6 ml-6">
            <Link href="/tutorials" className="text-sm text-ink-700 hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue rounded">Tutorials</Link>
            <Link href="/blueprint" className="text-sm text-ink-700 hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue rounded">Why ALAIN</Link>
            <Link href="/settings" className="text-sm text-ink-700 hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue rounded">Settings</Link>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <OfflineBadge />
          <LocalRuntimeStatus />
          <EnvStatusBadge />
          <Link href="/generate" className="inline-flex items-center h-10 px-4 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Get Started</Link>
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
