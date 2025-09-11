import Link from "next/link";

export const metadata = {
  title: "ALAIN — Agent-style landing",
  description: "A bold gradient hero with animated cards and clear CTAs.",
};

export default function AgentVariant() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,87,173,0.18),rgba(251,218,12,0.12)_40%,transparent_70%)]" />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <section className="text-center space-y-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">Imagine</p>
          <h1 className="text-5xl md:text-7xl font-black leading-tight">IKEA for AI.</h1>
          <p className="mx-auto max-w-3xl text-lg md:text-xl text-gray-700">
            ALAIN turns raw models into runnable lessons in one click. Paste a Hugging Face link → get working
            code with guardrails, explanations, and assessments. Local or Colab.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Primary href="/generate">Generate a lesson</Primary>
            <Secondary href="/tutorials">Browse tutorials</Secondary>
          </div>
        </section>

        <section className="mt-16 grid md:grid-cols-3 gap-4">
          <Feature title="Blueprints for every model" desc="Setup, examples, and MCQs — generated on demand with citations." />
          <Feature title="Run anywhere" desc="Local-first via Ollama/vLLM or one‑click to Colab." />
          <Feature title="Evaluate quickly" desc="Side‑by‑side templates to compare cost, latency, and quality." />
        </section>

        <section className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold">Democratize adoption</h2>
          <p className="mt-2 max-w-3xl text-gray-700">
            Small labs ship great models but lack DevRel armies. ALAIN gives every model the same professional
            onboarding, so teams choose on merit — not on documentation budgets.
          </p>
          <div className="mt-4 flex gap-3">
            <Secondary href="/blueprint">Why ALAIN</Secondary>
            <Primary href="/settings">Configure providers</Primary>
          </div>
        </section>
      </main>
    </div>
  );
}

function Primary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center rounded-card bg-alain-blue px-5 py-2 text-white font-semibold hover:brightness-95">
      {children}
    </Link>
  );
}

function Secondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center rounded-brand border border-gray-800 px-5 py-2 text-ink hover:bg-gray-50">
      {children}
    </Link>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-card border border-ink-100 bg-paper-0 p-5 shadow-card">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-ink-700">{desc}</div>
    </div>
  );
}
