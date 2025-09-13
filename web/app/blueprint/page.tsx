export const metadata = {
  title: "ALAIN — Make every model teach itself",
  description:
    "Turn any model reference into a runnable, graded lab. Active learning, vendor‑neutral, exportable to Colab/Jupyter, and works hosted or fully local (Ollama, LM Studio, vLLM).",
};

export default function BlueprintPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 space-y-16 text-ink-900">
      {/* Mission-aligned Hero */}
      <section className="space-y-4">
        <p className="uppercase tracking-wide text-xs text-ink-700">ALAIN</p>
        <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">Make every model teach itself</h1>
        <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-3xl">
          ALAIN turns any model reference (Hugging Face, LM Studio, Ollama, vLLM) into a runnable, graded lab. Learn by doing — with instant feedback, vendor‑neutral APIs, and one‑click export to Colab/Jupyter.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/generate" className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Generate a lab</a>
            <a href="/notebooks" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Browse notebooks</a>
        </div>
      </section>

      {/* Mission, Vision, Value */}
      <section className="grid md:grid-cols-3 gap-6 items-start">
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h2 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">Mission</h2>
          <p className="font-inter text-ink-700">Make AI learning active, verifiable, and accessible — so every model ships with a hands‑on lesson you can actually run.</p>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h2 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">Vision</h2>
          <p className="font-inter text-ink-700">A world where “hello world” takes minutes, not days — and teams compare models on real outcomes, not hype.</p>
        </div>
        <div className="p-6 rounded-card bg-alain-card text-ink-900 border border-alain-stroke/15 space-y-2 shadow-alain-sm">
          <h2 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">Value</h2>
          <ul className="list-disc pl-5 space-y-1 text-ink-700">
            <li><b>Active learning:</b> Runnable steps with instant checks.</li>
            <li><b>Portable:</b> Same request shape across providers.</li>
            <li><b>Trustworthy:</b> Validated schema with auto‑repair.</li>
            <li><b>Local‑first:</b> No arbitrary code; works fully offline.</li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="grid md:grid-cols-3 gap-6 items-start">
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">1) Paste a model link</h3>
          <p className="font-inter text-ink-700">Drop in a reference from Hugging Face, LM Studio, Ollama, or your OpenAI‑compatible endpoint.</p>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">2) Generate a graded lab</h3>
          <p className="font-inter text-ink-700">Our teacher model builds a guided lesson with runnable steps, guardrails, and quick checks in strict JSON.</p>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">3) Run anywhere</h3>
          <p className="font-inter text-ink-700">Stream results, inspect requests, copy cURL, and export to Colab/Jupyter. Use hosted or fully local backends with the same API shape.</p>
        </div>
      </section>

      {/* Who it's for */}
      <section className="grid md:grid-cols-3 gap-6 items-start">
        <div className="p-6 rounded-card bg-alain-card text-ink-900 border border-alain-stroke/15 space-y-2 shadow-alain-sm">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">Model builders</h3>
          <p className="font-inter text-ink-700">Ship a runnable “learn” experience with every release. Reduce support, accelerate adoption, and show real capability.</p>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">Educators</h3>
          <p className="font-inter text-ink-700">Design verifiable labs fast. Standardized steps, instant grading, and exports that fit your curriculum.</p>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">Engineering teams</h3>
          <p className="font-inter text-ink-700">Evaluate models apples‑to‑apples. Same lesson template, identical requests, and local‑first mode for secure environments.</p>
        </div>
      </section>

      {/* Proof & Principles */}
      <section className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-3 shadow-card">
        <h3 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">Principles we won’t compromise</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink-700 mt-1">
          <li className="border border-ink-100 rounded-card p-3"><b>Schema‑first</b><br/>Lessons are strict JSON with repair for reliability.</li>
          <li className="border border-ink-100 rounded-card p-3"><b>Safety</b><br/>No arbitrary code; parameterized calls only.</li>
          <li className="border border-ink-100 rounded-card p-3"><b>Portability</b><br/>Same request shape across providers; easy to switch.</li>
          <li className="border border-ink-100 rounded-card p-3"><b>Offline</b><br/>Local‑first mode with zero external calls.</li>
        </ul>
      </section>

      {/* Closing CTA */}
      <section className="p-6 rounded-card bg-alain-card text-ink-900 border border-alain-stroke/15 shadow-alain-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h3 className="font-display font-semibold text-[28px] leading-[34px] tracking-tight">Paste link. Get a lab. Run it anywhere.</h3>
            <p className="font-inter text-ink-700">Active, graded, and portable — cloud or fully local. Export to Colab in one click.</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <a href="/generate" className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold">Try ALAIN</a>
            <a href="/settings" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-alain-stroke/30 text-alain-blue">Configure providers</a>
            <a
              href="https://www.linkedin.com/in/danielpgreen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-11 px-5 rounded-[12px] border border-alain-stroke/30 text-alain-blue"
            >
              Partner with us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// Page redesigned to center mission, vision, and value proposition
