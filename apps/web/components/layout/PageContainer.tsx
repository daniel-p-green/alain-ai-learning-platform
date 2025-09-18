import type { ReactNode } from "react";

const MAX_WIDTHS = {
  standard: "max-w-7xl",
  wide: "max-w-[1400px]",
} as const;

const PADDING = {
  none: "px-0",
  default: "px-4 md:px-6 lg:px-8",
} as const;

const VERTICAL = {
  none: "py-0",
  default: "py-6 lg:py-10",
} as const;

type PageContainerProps = {
  children: ReactNode;
  maxWidth?: keyof typeof MAX_WIDTHS;
  paddingX?: keyof typeof PADDING;
  paddingY?: keyof typeof VERTICAL;
  className?: string;
};

export function PageContainer({
  children,
  maxWidth = "standard",
  paddingX = "default",
  paddingY = "default",
  className,
}: PageContainerProps) {
  const classes = [
    "mx-auto w-full",
    MAX_WIDTHS[maxWidth],
    PADDING[paddingX],
    VERTICAL[paddingY],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes}>{children}</div>;
}
