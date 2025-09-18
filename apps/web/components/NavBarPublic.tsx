"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import TopNav from "./TopNav";

const linkClass = "text-sm font-medium text-white/85 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue rounded px-1 py-0.5";

function formatStars(count: number | null) {
  if (!count || Number.isNaN(count)) return null;
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

export default function NavBarPublic() {
  const [stars, setStars] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("https://api.github.com/repos/AppliedLearningAI/alain-ai-learning-platform", { cache: "force-cache" });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setStars(formatStars(typeof data?.stargazers_count === "number" ? data.stargazers_count : null));
      } catch {
        /* ignore errors */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const primaryLinks = useMemo(() => [
    { href: "/docs", label: "Documentation" },
    { href: "/notebooks", label: "Notebook Library" },
    { href: "https://github.com/AppliedLearningAI/alain-ai-learning-platform", label: stars ? `GitHub (${stars})` : "GitHub", external: true },
  ], [stars]);

  const desktopLinks = primaryLinks.map((item) => (
    <Link key={item.href} href={item.href} className={linkClass} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>
      {item.label}
    </Link>
  ));

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

  const mobileLinks = [
    { href: "/", label: "Home" },
    ...primaryLinks.map((item) => ({ href: item.href, label: item.label, external: item.external })),
    { href: "/generate", label: "Generate Manual" },
    { href: "/sign-in", label: "Sign in" },
  ];

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
      desktopLinks={<div className="hidden items-center gap-5 md:flex">{desktopLinks}</div>}
      desktopActions={desktopActions}
      mobileMenu={<MobileNav links={mobileLinks} footer={mobileFooter} triggerAriaLabel="Open main menu" side="right" />}
    />
  );
}
