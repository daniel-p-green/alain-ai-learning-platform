"use client";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import dynamic from "next/dynamic";
import MobileNav from "./MobileNav";
// EnvStatusBadge (Poe status) removed from top nav for now
import { useUser } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  const OfflineBadge = dynamic(() => import("./OfflineBadge"), { ssr: false });
  const LocalRuntimeStatus = dynamic(() => import("./LocalRuntimeStatus"), { ssr: false });
  const { user } = useUser();
  const isAdmin = (user?.publicMetadata as any)?.role === 'admin';
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
            <Link href="/" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Why ALAIN</Link>
            <Link href="/settings" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Settings</Link>
            <Link href="/upload" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Upload</Link>
            <Link href="/my/notebooks" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">My Notebooks</Link>
            {isAdmin && <Link href="/admin/moderation" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Moderation</Link>}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <OfflineBadge />
          <LocalRuntimeStatus />
          {/* Auth: show Sign In when signed out; avatar menu when signed in */}
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton>
                <button className="inline-flex items-center h-10 px-3 rounded-alain-lg bg-white/10 hover:bg-white/20 text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="inline-flex items-center h-10 px-3 rounded-alain-lg bg-white text-alain-blue hover:opacity-90 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">
                  Sign up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} afterSignOutUrl="/" />
          </SignedIn>
          <Link href="/generate" className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">Get Started</Link>
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
