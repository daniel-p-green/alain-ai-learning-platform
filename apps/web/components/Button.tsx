"use client";

import React from "react";

type ButtonVariant = "primary" | "accent" | "secondary" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary" | "danger";
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-alain-blue text-white hover:brightness-95",
  accent: "bg-alain-yellow text-alain-blue border border-alain-stroke hover:brightness-95",
  secondary: "bg-paper-0 text-ink-900 border border-ink-100 hover:bg-paper-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function buttonVariantClasses(variant: ButtonVariant = "primary", className = "") {
  const base = [
    "inline-flex items-center justify-center px-3 py-2 rounded-card transition-colors whitespace-nowrap",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-alain-stroke",
    "focus-visible:ring-offset-paper-0",
  ].join(" ");
  return [base, variants[variant] || variants.primary, className].join(" ");
}

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type as any} className={buttonVariantClasses(variant, className)} {...props} />;
}
