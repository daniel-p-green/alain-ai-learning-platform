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
  const navClassName = ["sticky top-0 z-50 bg-alain-blue text-white shadow-brand", className].filter(Boolean).join(" ");
  return (
    <nav className={navClassName}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-5">
          {brand}
          {desktopLinks && <div className="hidden lg:flex items-center gap-5">{desktopLinks}</div>}
        </div>
        <div className="flex items-center gap-3">
          {desktopActions && <div className="hidden md:flex items-center gap-2.5">{desktopActions}</div>}
          {mobileMenu && <div>{mobileMenu}</div>}
        </div>
      </div>
    </nav>
  );
}
