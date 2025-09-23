import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

import type { ButtonSize, LegacyVariant } from "./ui/button-variants";
import { buttonVariants } from "./ui/button-variants";

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: LegacyVariant;
  size?: ButtonSize;
};

export function ButtonLink({ variant = "primary", className, size = "md", ...props }: ButtonLinkProps) {
  const classes = cn(buttonVariants(variant, size), className);
  return <Link {...props} className={classes} />;
}
