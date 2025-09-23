"use client";

import { useState } from "react";
import { parseHfRef } from "@/lib/api";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button-variants";

type HFQuickOpenProps = {
  className?: string;
  size?: 'default' | 'compact';
  showError?: boolean;
  suggestions?: string[];
  expandOnFocus?: boolean;
};

export default function HFQuickOpen({
  className,
  size = 'default',
  showError = true,
  suggestions = [],
  expandOnFocus = false,
}: HFQuickOpenProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  function normalizeInput(raw: string) {
    const trimmed = raw.trim();
    const parsed = parseHfRef(trimmed);
    if (parsed.ok && parsed.repo) {
      return parsed.repo;
    }
    return trimmed;
  }

  function openRepo(repo: string) {
    const url = new URL("/generate", window.location.origin);
    url.searchParams.set("hf", `https://huggingface.co/${repo}`);
    window.location.assign(url.toString());
  }

  function attemptOpen(raw: string) {
    const next = normalizeInput(raw);
    setValue(next);
    const p = parseHfRef(next);
    if (!p.ok || !p.repo) {
      setError("Enter a valid Hugging Face repo, e.g. owner/model");
      return;
    }
    setError(null);
    openRepo(p.repo);
  }

  function handleOpen() {
    attemptOpen(value);
  }

  const inputSize = size === 'compact' ? 'h-10 text-sm' : 'h-12 text-base';
  const btnSize = size === 'compact' ? 'md' : 'lg';
  const containerPad = size === 'compact' ? 'p-2' : 'p-3';
  const containerWidth = size === 'compact' ? 'max-w-2xl' : 'max-w-4xl';
  const layoutClass = size === 'compact'
    ? 'flex flex-col gap-2 sm:flex-row sm:items-stretch'
    : 'flex flex-col gap-2 md:flex-row md:items-stretch';
  const hasSuggestions = suggestions.length > 0;
  const containerFocusStyles = expandOnFocus
    ? 'transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-white'
    : '';
  const containerActiveStyles = expandOnFocus && isFocused ? 'ring-2 ring-primary/40 shadow-md' : '';

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/70 bg-white shadow-sm",
        containerPad,
        containerWidth,
        containerFocusStyles,
        containerActiveStyles,
        className,
      )}
    >
      <label htmlFor="hf-quick" className="sr-only">
        Paste a Hugging Face link
      </label>
      <div className={layoutClass}>
        <input
          id="hf-quick"
          inputMode="url"
          placeholder={size === 'compact' ? "Hugging Face: owner/model or URL" : "Paste a Hugging Face model link (owner/model or URL)"}
          value={value}
          onFocus={() => {
            if (expandOnFocus) setIsFocused(true);
          }}
          onChange={(e) => {
            if (error) setError(null);
            setValue(normalizeInput(e.target.value));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleOpen();
            }
          }}
          onBlur={() => {
            if (expandOnFocus) setIsFocused(false);
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
      {hasSuggestions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setError(null);
                setValue(normalizeInput(suggestion));
              }}
              className={cn(
                buttonVariants("secondary", "sm"),
                "border border-dashed border-border/80 bg-white/80 text-sm font-normal text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
