"use client";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import dynamic from "next/dynamic";
import MobileNav from "./MobileNav";
import EnvStatusBadge from "./EnvStatusBadge";

export default function NavBar() {
  const OfflineBadge = dynamic(() => import("./OfflineBadge"), { ssr: false });
  const LocalRuntimeStatus = dynamic(() => import("./LocalRuntimeStatus"), { ssr: false });
  return (
    <nav className="bg-alain-blue text-white shadow-brand">
      <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="h-10 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded" aria-label="ALAIN Home">
            {/* Yellow variant on blue bar for optimal contrast */}
            <BrandLogo variant="yellow" className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/tutorials" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Tutorials</Link>
            <Link href="/blueprint" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Why ALAIN</Link>
            <Link href="/settings" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Settings</Link>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <OfflineBadge />
          <LocalRuntimeStatus />
          <EnvStatusBadge />
          <Link href="/generate" className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">Get Started</Link>
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
