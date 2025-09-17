"use client";
import NotebookViewer from "./NotebookViewer";

const sampleNotebook = {
  cells: [
    {
      cell_type: "markdown",
      source: [
        "# Quick Start Cell\n",
        "You're looking at a live preview of an ALAIN-generated notebook.\n",
        "\n",
        "It ships with setup notes, reproducible commands, and Try-it-yourself cells.\n",
      ],
    },
    {
      cell_type: "markdown",
      source: [
        "**Checklist**\n",
        "- Install requirements (`%pip install -U transformers kernels accelerate triton`)\n",
        "- Load your `POE_API_KEY` or local provider URL\n",
        "- Run the quick smoke test before deeper experiments\n",
      ],
    },
    {
      cell_type: "code",
      metadata: { lang: "python" },
      source: [
        "model = 'gpt-oss-20b'\n",
        "print(f'Ready to generate with {model}')\n",
        "health_checks = ['outline ok', 'sections ok', 'colab-ready ok']\n",
        "for check in health_checks:\n",
        "    print(check)\n",
      ],
    },
  ],
};

export default function HomeNotebookPreview() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-ink-900/90 p-4 shadow-card backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-ink-400">
        <span>Notebook Preview</span>
        <span>ALAINKit · Sample</span>
      </div>
      <div className="max-h-64 overflow-hidden rounded-xl border border-ink-700 bg-ink-900/60">
        <NotebookViewer nb={sampleNotebook} />
      </div>
    </div>
  );
}
