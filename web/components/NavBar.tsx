"use client";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import { useUser } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  const { user } = useUser();
  const isAdmin = (user?.publicMetadata as any)?.role === 'admin';
  const newHome = process.env.NEXT_PUBLIC_NEW_HOME === '1';
  return (
    <nav className="bg-alain-blue text-white shadow-brand">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="h-10 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded" aria-label="ALAIN Home">
            {/* Yellow variant on blue bar for optimal contrast */}
            <BrandLogo variant="yellow" className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-5">
            {newHome && (
              <Link href="/home" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">New Home</Link>
            )}
            <Link href="/blueprint" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Why ALAIN</Link>
            <Link href="/explore/notebooks" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Explore</Link>
            <Link href="/explore/lessons" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Lessons</Link>
            <Link href={'/my/notebooks'} className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">My</Link>
            <Link href={'/generate'} className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Generate</Link>
            {isAdmin && <Link href="/admin/moderation" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Moderation</Link>}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {/* Auth: show Sign In when signed out; avatar menu when signed in */}
          <SignedOut>
            <SignInButton>
              <button className="inline-flex items-center h-10 px-3 rounded-alain-lg bg-white/10 hover:bg-white/20 text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} afterSignOutUrl="/" />
          </SignedIn>
          <Link href={'/generate'} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">Get Started</Link>
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
