"use client";
import type { ReactNode } from "react";

export type TopNavProps = {
  brand: ReactNode;
  desktopLinks?: ReactNode;
  desktopActions?: ReactNode;
  mobileMenu?: ReactNode;
  className?: string;
};

export default function TopNav({ brand, desktopLinks, desktopActions, mobileMenu, className }: TopNavProps) {
  const navClassName = [
    "sticky top-0 z-40 w-full border-b border-ink-100/70 bg-white/95 text-ink-900 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClassName} aria-label="Main">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <div className="flex items-center gap-4">
          {brand}
          {desktopLinks && <div className="hidden items-center gap-6 md:flex">{desktopLinks}</div>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {desktopActions && <div className="hidden items-center gap-2 md:flex">{desktopActions}</div>}
          {mobileMenu}
        </div>
      </div>
    </nav>
  );
}
