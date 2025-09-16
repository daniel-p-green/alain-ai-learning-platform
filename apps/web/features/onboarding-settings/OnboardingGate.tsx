"use client";
import { useEffect } from "react";
import { useOnboarding } from "./useOnboarding";

type Props = {
  redirect: (to: string) => void;
  children: React.ReactNode;
  path?: string; // onboarding path
};

export default function OnboardingGate({ redirect, children, path = "/onboarding" }: Props) {
  const { completed } = useOnboarding();
  useEffect(() => {
    if (!completed) redirect(path);
  }, [completed, redirect, path]);
  return <>{children}</>;
}

