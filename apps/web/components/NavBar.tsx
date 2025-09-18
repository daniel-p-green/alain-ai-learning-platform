"use client";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

export default function NavBar() {
  const { user } = useUser();
  const isAdmin = (user?.publicMetadata as any)?.role === 'admin';
  return (
    <nav className="bg-alain-blue text-white shadow-brand">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-[68px] flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="h-[56px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded" aria-label="ALAIN Home">
            <BrandLogo variant="blue" className="h-14 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-5">
            <Link href="/notebooks" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Library</Link>
            <SignedIn>
              <Link href="/settings" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Settings</Link>
            </SignedIn>
            {/* Labs hidden from main nav for demo simplicity */}
            {isAdmin && <Link href="/admin/moderation" className="text-sm text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5">Moderation</Link>}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href={'/generate'}
            className="inline-flex items-center h-10 px-5 rounded-alain-lg border border-white/80 bg-transparent text-white/90 font-semibold hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
          >
            Generate Manual
          </Link>
          {/* Auth: show Sign In when signed out; avatar menu when signed in */}
          <SignedOut>
            <SignInButton>
              <button className="inline-flex items-center h-10 px-3 rounded-alain-lg border border-white/25 bg-white/10 hover:bg-white/15 text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  userButtonTrigger:
                    "inline-flex items-center h-10 rounded-alain-lg border border-white/25 bg-white/10 px-1 hover:bg-white/15 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue",
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </SignedIn>
          {/* Labs hidden from main nav for demo simplicity */}
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
