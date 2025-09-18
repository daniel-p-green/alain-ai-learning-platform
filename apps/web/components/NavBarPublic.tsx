"use client";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import TopNav from "./TopNav";

const linkClass = "text-sm font-medium text-white/85 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5";

export default function NavBarPublic() {
  const primaryLinks = [
    { href: "/", label: "Home" },
    { href: "/generate", label: "Generate Manual" },
    { href: "/notebooks", label: "Notebook Library" },
    { href: "/notebooks/featured", label: "Featured" },
  ];

  const desktopLinks = (
    <>
      {primaryLinks.map((item) => (
        <Link key={item.href} href={item.href} className={linkClass}>
          {item.label}
        </Link>
      ))}
    </>
  );

  const desktopActions = (
    <>
      <Link
        href="/generate"
        className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-alain-blue shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
      >
        Generate Manual
      </Link>
      <Link
        href="/sign-in"
        className="inline-flex h-10 items-center rounded-full border border-white/30 px-4 text-sm font-medium text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
      >
        Sign in
      </Link>
    </>
  );

  const mobileFooter = (
    <div className="space-y-2">
      <Link
        href="/generate"
        className="inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-alain-blue text-sm font-semibold text-white shadow-card hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/30"
      >
        Generate Manual
      </Link>
      <Link
        href="/sign-in"
        className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-ink-200 bg-white text-sm font-medium text-ink-900 hover:bg-paper-50"
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
          className="flex h-[44px] items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
          aria-label="ALAIN home"
        >
          <BrandLogo variant="blue" width={148} height={44} />
        </Link>
      }
      desktopLinks={desktopLinks}
      desktopActions={desktopActions}
      mobileMenu={<MobileNav links={primaryLinks} footer={mobileFooter} triggerAriaLabel="Open main menu" side="right" />}
    />
  );
}
