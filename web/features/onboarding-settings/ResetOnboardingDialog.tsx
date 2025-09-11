"use client";
import React, { useEffect, useRef } from "react";
import { useOnboarding } from "./useOnboarding";
import { useSettings } from "./useSettings";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ResetOnboardingDialog({ open, onClose }: Props) {
  const { reset } = useOnboarding();
  const { clearAll } = useSettings();
  const [clearProviders, setClearProviders] = React.useState(false);
  const first = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => { if (open && first.current) first.current.focus(); }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[12px] border border-ink-100 bg-paper-0 p-5 shadow-lg">
        <h2 id="reset-title" className="font-display font-semibold text-ink-900 text-[20px]">Reset onboarding</h2>
        <p className="font-inter text-ink-700 mt-1">Reset onboarding now? You will see the welcome flow on next launch.</p>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="scope" checked={!clearProviders} onChange={() => setClearProviders(false)} />
            <span>Reset only the onboarding flag</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="scope" checked={clearProviders} onChange={() => setClearProviders(true)} />
            <span>Reset onboarding and clear providers</span>
          </label>
          <p className="text-xs text-ink-700">Reset keeps API keys unless you also clear providers.</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button ref={first} className="h-10 px-4 rounded-[12px] border-2 border-alain-blue bg-white text-alain-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue" onClick={onClose}>Cancel</button>
          <button
            data-testid="confirm-reset"
            className="h-10 px-4 rounded-[12px] bg-alain-blue text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-alain-blue"
            onClick={() => {
              reset();
              if (clearProviders) clearAll();
              console.info("alain.onboarding.reset");
              onClose();
            }}
          >
            Confirm reset
          </button>
        </div>
      </div>
    </div>
  );
}

