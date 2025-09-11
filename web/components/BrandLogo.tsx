"use client";
import Image from "next/image";

type Props = {
  variant?: "blue" | "yellow";
  width?: number;
  height?: number;
  className?: string;
};

// Theme-aware ALAIN logo. Switch via CSS class on <html> or a prop.
// - If documentElement has class "theme-yellow", forces yellow variant
// - Otherwise uses prop or defaults to blue variant
export default function BrandLogo({ variant, width = 160, height = 40, className = "" }: Props) {
  let v: "blue" | "yellow" = variant || "blue";
  if (typeof document !== "undefined") {
    if (document.documentElement.classList.contains("theme-yellow")) v = "yellow";
  }
  const src = v === "yellow" ? "/brand/ALAIN_logo_primary_yellow-bg.svg" : "/brand/ALAIN_logo_primary_blue-bg.svg";
  return <Image src={src} alt="ALAIN" width={width} height={height} priority className={className} />;
}

