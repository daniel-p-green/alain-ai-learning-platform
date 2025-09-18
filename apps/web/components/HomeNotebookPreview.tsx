import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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

const codeCell = `model = "gpt-oss-20b"\nprint(f"Ready to generate with {model}")\nhealth_checks = ["outline ok", "sections ok", "colab-ready ok"]\nfor check in health_checks:\n    print(check)`;

const pipelineStages = [
  {
    title: "Research Scout",
    description:
      "A research helper explores model cards, docs, and community notes, returning a structured JSON report about specs, strengths, and challenges.",
  },
  {
    title: "Lesson Architect",
    description:
      "The design helper builds learner personas, objectives, and assessment plans, all stored as structured JSON for later stages.",
  },
  {
    title: "Outline Builder",
    description:
      "An outline helper writes the strict table of contents—title, overview, four objectives, 6–12 steps, references—and flags gaps for human review.",
  },
  {
    title: "Section Scribe",
    description:
      "Each step gets multi-paragraph markdown, runnable code, and reproducibility notes. If JSON fails, a placeholder section is saved for editors.",
  },
  {
    title: "Classroom Monitor",
    description:
      "Lightweight QA checks for balanced content, clear next steps, and no placeholders. Issues are logged, but the pipeline keeps moving.",
  },
  {
    title: "Semantic Reviewer",
    description:
      "A second model critiques clarity, completeness, and defined terminology, capturing precise edits for the human team.",
  },
  {
    title: "Quality & Colab Fixer",
    description:
      "Quality metrics and reading-time estimates are generated, and Colab fixes are applied automatically so notebooks run out of the box.",
  },
  {
    title: "Orchestrator",
    description:
      "Everything is assembled into the final .ipynb, validation reports are exported, and artifacts are stored so any stage can be replayed when providers misbehave.",
  },
];

export default function HomeNotebookPreview() {
  return (
    <div className="space-y-6">
      <Card className="border-ink-100 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between text-xs font-medium uppercase tracking-wide text-ink-500">
          <span>Notebook Preview</span>
          <span>ALAINKit · Sample</span>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-hidden rounded-xl border border-ink-800 bg-ink-900 text-ink-50">
            <div className="space-y-4 p-4 text-sm">
              {markdownCells.map((cell, index) => (
                <article key={index} className="space-y-2">
                  <h3 className="font-semibold text-ink-100">{cell.heading}</h3>
                  {cell.body?.map((paragraph, paragraphIndex) => (
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
        </CardContent>
      </Card>

      <Card className="border-ink-100 shadow-card">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-ink-500">How ALAIN-Kit Builds Notebooks</CardTitle>
          <CardDescription className="text-xs text-ink-400">
            Eight observable stages, each with its own artifacts and review points—so editors can step in wherever automation stumbles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {pipelineStages.map((stage, index) => (
              <Card key={stage.title} className="border-ink-100 bg-ink-50">
                <CardHeader className="flex items-start gap-3 p-4 pb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-alain-blue/10 text-sm font-semibold text-alain-blue">
                    {index + 1}
                  </div>
                  <CardTitle className="text-sm text-ink-700">{stage.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-ink-500">
                  {stage.description}
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-400">
            Every stage saves its raw output, structured JSON, and any issues it spots. If a helper fails, we stash the artifact and flag it for manual review so editors can rerun just that part without losing progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
