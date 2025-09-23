import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type LegacyVariant = ButtonVariant | "accent" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 focus-visible:ring-primary",
  secondary: "border border-border bg-card text-foreground hover:bg-muted/50 focus-visible:ring-primary/30",
  ghost: "text-foreground hover:bg-muted/50 focus-visible:ring-primary/20",
  destructive: "bg-danger text-danger-foreground shadow-md hover:bg-danger/90 focus-visible:ring-danger",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-3 text-small font-semibold",
  md: "h-10 rounded-lg px-4 text-body font-semibold",
  lg: "h-12 rounded-xl px-6 text-body font-semibold",
};

const LEGACY_VARIANT_MAP: Record<LegacyVariant, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  destructive: "destructive",
  accent: "primary",
  danger: "destructive",
  outline: "secondary",
};

function normalizeVariant(variant: LegacyVariant | ButtonVariant): ButtonVariant {
  return LEGACY_VARIANT_MAP[variant] ?? (variant as ButtonVariant);
}

function normalizeSize(size: ButtonSize): ButtonSize {
  return SIZE_CLASSES[size] ? size : "md";
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap align-middle font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

export function buttonVariants(variant: LegacyVariant | ButtonVariant = "primary", size: ButtonSize = "md") {
  const v = normalizeVariant(variant);
  const s = normalizeSize(size);
  return cn(BASE, VARIANT_CLASSES[v], SIZE_CLASSES[s]);
}

export { VARIANT_CLASSES as buttonVariantStyles, SIZE_CLASSES as buttonSizeStyles, normalizeVariant, normalizeSize };
