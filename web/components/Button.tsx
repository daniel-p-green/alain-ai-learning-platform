"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center px-3 py-2 rounded-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-brand-blue text-white hover:brightness-95",
    accent: "bg-brand-yellow text-ink border border-ink hover:brightness-95",
    secondary: "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700",
  };
  return (
    <button className={[base, variants[variant] || variants.primary, className].join(" ")} {...props} />
  );
}

