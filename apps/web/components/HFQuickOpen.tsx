"use client";

import { useState } from "react";
import { parseHfRef } from "@/lib/api";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button-variants";

type HFQuickOpenProps = {
  className?: string;
  size?: 'default' | 'compact';
  showError?: boolean;
};

export default function HFQuickOpen({ className, size = 'default', showError = true }: HFQuickOpenProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function normalizeInput(raw: string) {
    const trimmed = raw.trim();
    const parsed = parseHfRef(trimmed);
    if (parsed.ok && parsed.repo) {
      return parsed.repo;
    }
    return trimmed;
  }

  function handleOpen() {
    const next = normalizeInput(value);
    if (next !== value) setValue(next);
    setError(null);
    const p = parseHfRef(next);
    if (!p.ok || !p.repo) {
      setError("Enter a valid Hugging Face repo, e.g. owner/model");
      return;
    }
    const url = new URL("/generate", window.location.origin);
    url.searchParams.set("hf", `https://huggingface.co/${p.repo}`);
    window.location.assign(url.toString());
  }

  const inputSize = size === 'compact' ? 'h-10 text-sm' : 'h-12 text-base';
  const btnSize = size === 'compact' ? 'md' : 'lg';
  const containerPad = size === 'compact' ? 'p-2' : 'p-3';
  const containerWidth = size === 'compact' ? 'max-w-2xl' : 'max-w-4xl';
  const layoutClass = size === 'compact'
    ? 'flex flex-col gap-2 sm:flex-row sm:items-stretch'
    : 'flex flex-col gap-2 md:flex-row md:items-stretch';

  return (
    <div className={cn("w-full rounded-xl border border-border/70 bg-white shadow-sm", containerPad, containerWidth, className)}>
      <label htmlFor="hf-quick" className="sr-only">
        Paste a Hugging Face link
      </label>
      <div className={layoutClass}>
        <input
          id="hf-quick"
          inputMode="url"
          placeholder={size === 'compact' ? "Hugging Face: owner/model or URL" : "Paste a Hugging Face model link (owner/model or URL)"}
          value={value}
          onChange={(e) => {
            if (error) setError(null);
            setValue(normalizeInput(e.target.value));
          }}
          onBlur={() => {
            const next = normalizeInput(value);
            if (next !== value) setValue(next);
          }}
          className={cn(
            "w-full flex-1 rounded-lg border border-border/70 bg-white px-3 text-body text-foreground placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            inputSize,
          )}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={handleOpen}
          className={cn(buttonVariants("primary", btnSize), 'sm:px-6')}
        >
          Get started
        </button>
      </div>
      {error && showError && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
