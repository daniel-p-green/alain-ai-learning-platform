export const metadata = {
  title: "ALAIN — Applied Learning AI Notebooks",
  description:
    "Paste a model link and get a runnable, graded lesson. Export to Colab/Jupyter. Run with hosted or local OpenAI-compatible endpoints (Ollama/LM Studio/vLLM).",
};

export default function BlueprintPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 space-y-16 text-ink-900">
      {/* Hero */}
      <section className="space-y-4">
        <p className="uppercase tracking-wide text-xs text-ink-700">ALAIN</p>
        <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">Paste model link → get a runnable, graded lesson</h1>
        <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-3xl">
          Turns a model reference (Hugging Face, LM Studio, Ollama) into a guided, interactive tutorial with setup, runnable steps, and quick assessments. Export to Colab/Jupyter. Run hosted or fully local with the same request shape.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/generate" className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Generate a lesson</a>
          <a href="/tutorials" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Browse tutorials</a>
        </div>
      </section>

      {/* Key features (Devpost-aligned) */}
      <section className="grid md:grid-cols-2 gap-6 items-start">
        <div className="p-6 rounded-card bg-alain-card text-ink-900 border border-alain-stroke/15 space-y-3 shadow-alain-sm">
          <h2 className="font-display font-semibold text-[28px] leading-[34px] tracking-tight">What it does</h2>
          <ul className="list-disc pl-5 space-y-1 text-ink-700">
            <li>Guided, interactive lessons with setup, runnable steps, and quick assessments</li>
            <li>One‑click export to Colab/Jupyter</li>
            <li>Run with hosted or local OpenAI‑compatible endpoints (Ollama/LM Studio/vLLM)</li>
            <li>Streaming output, “Show Request”, and cURL copy</li>
          </ul>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-3 shadow-card">
          <h3 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">How it works</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink-700">
            <li>Teacher model (GPT‑OSS‑20B) with Harmony prompts and strict JSON schema</li>
            <li>Validation + auto‑repair for reliable, well‑formed lessons</li>
            <li>Encore backend for generation; web‑only fallback for demos</li>
            <li>Same API shape across providers; seamless hosted ↔ local switch</li>
          </ul>
        </div>
      </section>

      {/* Why it matters */}
      <section className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-3 shadow-card">
        <h3 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">Why we built it</h3>
        <p className="font-inter text-ink-700 max-w-3xl">
          New models drop weekly, but adoption lags. Docs are passive, scattered, and inconsistent; “hello world” takes hours. ALAIN makes every model equally learnable so teams can choose on merit — not marketing budgets.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink-700 mt-2">
          <li className="border border-ink-100 rounded-card p-3"><b>Schema‑first</b><br/>Validated JSON with repair for reliability.</li>
          <li className="border border-ink-100 rounded-card p-3"><b>Safety</b><br/>No arbitrary code; parameterized calls only.</li>
          <li className="border border-ink-100 rounded-card p-3"><b>Cost aware</b><br/>Token estimates and preflight checks.</li>
          <li className="border border-ink-100 rounded-card p-3"><b>Offline</b><br/>Local‑first mode with zero external calls.</li>
        </ul>
      </section>

      {/* Closing CTA */}
      <section className="p-6 rounded-card bg-alain-card text-ink-900 border border-alain-stroke/15 shadow-alain-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h3 className="font-display font-semibold text-[28px] leading-[34px] tracking-tight">Paste link. Get lesson. Run it.</h3>
            <p className="font-inter text-ink-700">Identical UX in the cloud or fully local. Export to Colab in one click.</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <a href="/generate" className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold">Try ALAIN</a>
            <a href="/settings" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-alain-stroke/30 text-alain-blue">Configure providers</a>
          </div>
        </div>
      </section>
    </div>
  );
}

// Removed unused Tile/Slide helpers from earlier concept copy
