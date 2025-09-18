import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariantClasses } from "./Button";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "accent" | "secondary" | "danger";
  className?: string;
  prefetch?: boolean;
  target?: string;
  rel?: string;
};

export function ButtonLink({ href, children, variant = "primary", className = "", prefetch, target, rel }: ButtonLinkProps) {
  const classes = buttonVariantClasses(variant, className);
  return (
    <Link href={href} prefetch={prefetch} target={target} rel={rel} className={classes}>
      {children}
    </Link>
  );
}
