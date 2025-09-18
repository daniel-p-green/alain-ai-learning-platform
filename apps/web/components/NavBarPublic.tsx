"use client";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import TopNav from "./TopNav";

export default function NavBarPublic() {
  const desktopLinks = (
    <Link
      href="/notebooks"
      className="text-sm text-white/85 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5"
    >
      Library
    </Link>
  );

  const desktopActions = (
    <>
      <Link
        href="/onboarding"
        className="inline-flex items-center h-10 px-4 rounded-alain-lg border border-white/40 bg-transparent text-white/85 text-sm font-medium hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
      >
        Setup Wizard
      </Link>
      <Link
        href="/generate"
        className="inline-flex items-center h-10 px-5 rounded-alain-lg border border-white/80 bg-transparent text-white/90 font-semibold hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
      >
        Generate Manual
      </Link>
      <Link
        href="/sign-in"
        className="inline-flex items-center h-10 px-3 rounded-alain-lg border border-white/25 bg-white/10 hover:bg-white/15 text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
      >
        Sign in
      </Link>
    </>
  );

  const mobileLinks = [
    { href: "/notebooks", label: "Library" },
    { href: "/onboarding", label: ".env Setup Wizard" },
  ];

  const mobileFooter = (
    <div className="space-y-2">
      <Link
        href="/onboarding"
        className="inline-flex w-full items-center justify-center h-11 px-4 rounded-[12px] border border-ink-200 bg-white text-ink-900 font-medium"
      >
        Open Setup Wizard
      </Link>
      <Link
        href="/generate"
        className="inline-flex w-full items-center justify-center h-11 px-4 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold"
      >
        Generate Manual
      </Link>
      <Link
        href="/sign-in"
        className="inline-flex w-full items-center justify-center h-11 px-4 rounded-[12px] border border-ink-200 text-ink-900 font-medium"
      >
        Sign in
      </Link>
    </div>
  );

  return (
    <TopNav
      brand={
        <Link
          href="/"
          className="h-[56px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded"
          aria-label="ALAIN Home"
        >
          <BrandLogo variant="blue" width={200} height={56} />
        </Link>
      }
      desktopLinks={desktopLinks}
      desktopActions={desktopActions}
      mobileMenu={<MobileNav links={mobileLinks} footer={mobileFooter} triggerAriaLabel="Open main menu" />}
    />
  );
}
