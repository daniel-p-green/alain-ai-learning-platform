"use client";
import Link from "next/link";
import { Fragment } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import TopNav from "./TopNav";

export default function NavBar() {
  const { user } = useUser();
  const isAdmin = (user?.publicMetadata as any)?.role === "admin";

  const desktopActions = (
    <Fragment>
      <Link
        href="/generate"
        className="inline-flex items-center h-10 px-5 rounded-alain-lg border border-white/80 bg-transparent text-white/90 font-semibold hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
      >
        Generate Manual
      </Link>
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
    </Fragment>
  );

  const mobileLinks = [
    { href: "/notebooks", label: "Library" },
    ...(user ? [{ href: "/settings", label: "Settings" }] : []),
    ...(isAdmin ? [{ href: "/admin/moderation", label: "Moderation" }] : []),
  ];

  const mobileFooter = (
    <div className="space-y-2">
      <Link
        href="/generate"
        className="inline-flex w-full items-center justify-center h-11 px-4 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold"
      >
        Generate Manual
      </Link>
      <SignedOut>
        <SignInButton>
          <button className="inline-flex w-full items-center justify-center h-11 px-4 rounded-[12px] border border-ink-200 text-ink-900 font-medium">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  );

  return (
    <TopNav
      brand={
        <Link
          href="/"
          className="h-[60px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded"
          aria-label="ALAIN Home"
        >
          <BrandLogo variant="blue" width={240} height={64} />
        </Link>
      }
      desktopActions={desktopActions}
      mobileMenu={<MobileNav links={mobileLinks} footer={mobileFooter} triggerAriaLabel="Open main menu" />}
    />
  );
}
