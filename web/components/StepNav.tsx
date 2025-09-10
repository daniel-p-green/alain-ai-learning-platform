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
          className={`px-3 py-1 ${i === currentStep ? "bg-brand-blue text-white rounded-brand" : "bg-gray-800 rounded"}`}
          onClick={() => onStepChange(i)}
        >
          {s.title?.trim() ? s.title : `Step ${i + 1}`}
        </button>
      ))}
    </div>
  );
}
