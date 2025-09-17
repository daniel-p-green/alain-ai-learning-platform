"use client";

import { useState } from "react";

type Panel = {
  key: string;
  label: string;
  headline: string;
  body: string;
  bullets: string[];
};

const PANELS: Panel[] = [
  {
    key: "teams",
    label: "Teams",
    headline: "Keep evaluations consistent",
    body: "Ship the same template across hosted and local providers. Compare results apples-to-apples and capture model notes in one place.",
    bullets: [
      "Shared manual templates for hosted + local",
      "Automated checks ensure reproducible runs",
      "Export summaries for stakeholders",
    ],
  },
  {
    key: "educators",
    label: "Educators",
    headline: "Design labs that run in minutes",
    body: "Give students runnable notebooks with expected outputs, guidance, and room to experiment without setup surprises.",
    bullets: [
      "Step-by-step setup with guardrails",
      "Inline questions and quick checks",
      "Colab export for zero-install classrooms",
    ],
  },
  {
    key: "builders",
    label: "Builders",
    headline: "Launch tutorials customers trust",
    body: "Create product-ready walkthroughs with validated code snippets, provenance, and exportable guides your users can remix.",
    bullets: [
      "Runtime-ready snippets and environment info",
      "Provenance tracking and licensing baked in",
      "Easy to remix and rebrand for partner docs",
    ],
  },
];

export function HomeAudienceTabs() {
  const [active, setActive] = useState(PANELS[0].key);
  const current = PANELS.find((panel) => panel.key === active) ?? PANELS[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-[16px] border border-ink-100 bg-paper-0 p-2 shadow-card">
        {PANELS.map((panel) => {
          const isActive = panel.key === active;
          return (
            <button
              key={panel.key}
              type="button"
              onClick={() => setActive(panel.key)}
              className={`inline-flex items-center justify-center rounded-[12px] px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-alain-blue text-white" : "bg-white text-ink-600 hover:bg-paper-50"
              }`}
            >
              {panel.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 rounded-[16px] border border-ink-100 bg-paper-0 p-6 shadow-card md:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)] md:items-center">
        <div className="space-y-3">
          <h3 className="font-display text-[26px] leading-[32px] text-ink-900">{current.headline}</h3>
          <p className="text-[16px] leading-[26px] text-ink-700">{current.body}</p>
        </div>
        <ul className="space-y-2 text-[14px] leading-[22px] text-ink-700">
          {current.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <span className="mt-[6px] inline-block h-[6px] w-[6px] rounded-full bg-alain-blue" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

