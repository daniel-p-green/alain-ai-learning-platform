const markdownCells = [
  {
    heading: "Quick Start Cell",
    body: [
      "You're looking at a live preview of an ALAIN-generated notebook.",
      "It ships with setup notes, reproducible commands, and Try-it-yourself cells.",
    ],
  },
  {
    heading: "Checklist",
    list: [
      "Install requirements (%pip install -U transformers kernels accelerate triton)",
      "Load your POE_API_KEY or local provider URL",
      "Run the quick smoke test before deeper experiments",
    ],
  },
];

const pipelineStages = [
  {
    title: "Research Scout",
    description: "Collect specs, docs, and community intel so every downstream step starts with accurate facts.",
  },
  {
    title: "Lesson Architect",
    description: "Turn research into learner personas, objectives, and a plan for exercises and assessments.",
  },
  {
    title: "Outline Builder",
    description: "Generate a strict outline (title, objectives, 6–12 steps, references) and flag gaps for review.",
  },
  {
    title: "Section Scribe",
    description: "Fill each outline step with multi-paragraph markdown, runnable code, and reproducibility guidance.",
  },
  {
    title: "QA Gate",
    description: "Run quick structural checks—no placeholders, balanced content—and log anything needing a human eye.",
  },
  {
    title: "Semantic Reviewer",
    description: "Ask a second model to critique clarity, completeness, and definitions, capturing issues for editors.",
  },
  {
    title: "Quality & Colab Fixer",
    description: "Calculate quality metrics, estimate reading time, and apply Colab compatibility patches automatically.",
  },
  {
    title: "Orchestrator",
    description: "Assemble notebooks, export validation reports, and store human-review artifacts for stage replay.",
  },
];

const codeCell = `model = "gpt-oss-20b"\nprint(f"Ready to generate with {model}")\nhealth_checks = ["outline ok", "sections ok", "colab-ready ok"]\nfor check in health_checks:\n    print(check)`;

export default function HomeNotebookPreview() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-ink-500">
          <span>Notebook Preview</span>
          <span>ALAINKit · Sample</span>
        </div>
        <div className="max-h-64 overflow-hidden rounded-xl border border-ink-800 bg-ink-900 text-ink-50">
          <div className="space-y-4 p-4 text-sm">
            {markdownCells.map((cell, index) => (
              <article key={index} className="space-y-2">
                <h3 className="font-semibold text-ink-100">{cell.heading}</h3>
                {cell.body && cell.body.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="text-ink-200">
                    {paragraph}
                  </p>
                ))}
                {cell.list && (
                  <ul className="list-disc space-y-1 pl-5 text-ink-200">
                    {cell.list.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
            <pre className="overflow-x-auto rounded-lg bg-ink-900/80 p-4 font-mono text-xs leading-relaxed">
              <code>{codeCell}</code>
            </pre>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">How ALAIN-Kit Builds Notebooks</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pipelineStages.map((stage) => (
            <article key={stage.title} className="rounded-xl border border-ink-100 bg-ink-50 p-4">
              <h3 className="text-sm font-semibold text-ink-700">{stage.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{stage.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
