"use client";
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextText?: string;
  backText?: string;
  nextDisabled?: boolean;
  footer?: React.ReactNode;
};

export default function OnboardingStep({ title, subtitle, children, onNext, onBack, nextText = "Next", backText = "Back", nextDisabled, footer }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 text-ink-900">
      <header className="mb-6">
        <h1 className="font-display font-bold text-[32px] leading-[38px] tracking-tight">{title}</h1>
        {subtitle && <p className="font-inter text-ink-700 mt-1">{subtitle}</p>}
      </header>
      <div className="rounded-[12px] rounded-card border border-ink-100 bg-paper-0 p-5 shadow-sm" style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.06)" }}>
        {children}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>{footer}</div>
        <div className="flex gap-2">
          {onBack && (
            <button data-testid="ob-back" className="inline-flex items-center h-10 px-4 rounded-[12px] border-2 border-alain-blue text-alain-blue bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" onClick={onBack}>
              {backText}
            </button>
          )}
          {onNext && (
            <button data-testid="ob-next" disabled={!!nextDisabled} className="inline-flex items-center h-10 px-4 rounded-[12px] bg-alain-blue text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-alain-blue" onClick={onNext}>
              {nextText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

