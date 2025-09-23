"use client";

import React from "react";

import { cn } from "@/lib/utils";

import type { ButtonSize, LegacyVariant } from "./ui/button-variants";
import { buttonVariants } from "./ui/button-variants";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: LegacyVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

export function buttonVariantClasses(
  variant: LegacyVariant = "primary",
  className = "",
  size: ButtonSize = "md",
) {
  return cn(buttonVariants(variant, size), className);
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const buttonClassName = buttonVariantClasses(variant, className, size);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn(buttonClassName, (children.props as { className?: string }).className),
      ...props,
    });
  }

  return (
    <button type={type as any} className={buttonClassName} {...props}>
      {children}
    </button>
  );
}
