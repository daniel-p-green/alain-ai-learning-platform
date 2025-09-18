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
    "sticky top-0 z-40 w-full bg-alain-blue text-white shadow-brand/70 backdrop-blur",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClassName} aria-label="Main">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center gap-6 px-4 md:px-6">
        {/* Logo stays fixed at the left—mirrors IKEA treatment while keeping brand readable */}
        <div className="flex items-center gap-5">
          {brand}
          {desktopLinks && <div className="hidden items-center gap-5 md:flex">{desktopLinks}</div>}
        </div>
        {/* CTA cluster hugs the right edge so there’s a single focal point */}
        <div className="ml-auto flex items-center gap-3">
          {desktopActions && <div className="hidden items-center gap-2 md:flex">{desktopActions}</div>}
          {mobileMenu}
        </div>
      </div>
    </nav>
  );
}
