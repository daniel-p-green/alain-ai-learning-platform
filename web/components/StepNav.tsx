"use client";
import { Button } from "./Button";

/**
 * StepNav
 * - Minimal step navigation control with current index highlighting
 */

type Step = { id: number; step_order: number; title: string };

type Props = {
  steps: Step[];
  currentStep: number; // index
  onStepChange: (index: number) => void;
};

export function StepNav({ steps, currentStep, onStepChange }: Props) {
  if (!steps?.length) return null;
  return (
    <div className="flex gap-2 mt-2">
      {steps.map((s, i) => (
        <Button
          key={s.id}
          className="px-3 py-1 text-sm"
          variant={i === currentStep ? "primary" : "secondary"}
          onClick={() => onStepChange(i)}
        >
          {s.title?.trim() ? s.title : `Step ${i + 1}`}
        </Button>
      ))}
    </div>
  );
}
