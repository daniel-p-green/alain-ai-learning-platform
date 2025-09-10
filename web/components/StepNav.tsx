"use client";

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
        <button
          key={s.id}
          className={`px-3 py-1 rounded ${i === currentStep ? "bg-blue-600 text-white" : "bg-gray-800"}`}
          onClick={() => onStepChange(i)}
        >
          Step {i + 1}
        </button>
      ))}
    </div>
  );
}
