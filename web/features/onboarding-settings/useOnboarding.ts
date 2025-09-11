"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LS } from "./types";

const VERSION = "1"; // bump when flow changes

export type OnboardingState = {
  version: string;
  completed: boolean;
};

export function readOnboarding(): OnboardingState {
  if (typeof window === "undefined") return { version: VERSION, completed: false };
  const v = window.localStorage.getItem(LS.onboardingVersion) || VERSION;
  const c = (window.localStorage.getItem(LS.onboardingCompleted) || "false").toLowerCase();
  return { version: v, completed: c === "true" };
}

export function writeOnboarding(next: Partial<OnboardingState>) {
  if (typeof window === "undefined") return;
  const current = readOnboarding();
  const merged: OnboardingState = { ...current, ...next };
  window.localStorage.setItem(LS.onboardingVersion, merged.version);
  window.localStorage.setItem(LS.onboardingCompleted, String(merged.completed));
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => readOnboarding());

  // Keep windows in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !Object.values(LS).includes(e.key as any)) return;
      setState(readOnboarding());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const start = useCallback(() => {
    console.info("alain.onboarding.started");
    writeOnboarding({ version: VERSION, completed: false });
    setState(readOnboarding());
  }, []);

  const complete = useCallback(() => {
    console.info("alain.onboarding.completed");
    writeOnboarding({ version: VERSION, completed: true });
    setState(readOnboarding());
  }, []);

  const reset = useCallback(() => {
    console.info("alain.onboarding.reset");
    writeOnboarding({ version: VERSION, completed: false });
    setState(readOnboarding());
  }, []);

  return useMemo(() => ({ ...state, version: VERSION, start, complete, reset }), [state, start, complete, reset]);
}

// Export helpers for tests
export const __test__ = { readOnboarding, writeOnboarding };

