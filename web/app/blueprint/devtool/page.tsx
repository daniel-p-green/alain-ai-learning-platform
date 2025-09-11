import Link from "next/link";

export const metadata = {
  title: "ALAIN — Devtool-style landing",
  description: "A pragmatic, product-first layout with code and benefits.",
};

export default function DevtoolVariant() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-5xl font-black">Blueprints that actually run</h1>
          <p className="text-gray-700 text-lg">
            ALAIN ingests a model card and repo, then outputs a runnable notebook: setup, examples, assessments,
            and guardrails. One-click Colab; local-first via Ollama.
          </p>
          <div className="flex gap-3">
            <Primary href="/generate">Paste link</Primary>
            <Secondary href="/tutorials">See examples</Secondary>
          </div>
        </div>
        <div className="hidden md:block rounded-xl border border-gray-200 bg-white p-4 w-[420px]">
          <pre className="text-xs text-gray-800 whitespace-pre-wrap">{`# ALAIN Notebook (excerpt)
!pip install -q openai ollama
from alain import Lesson
lesson = Lesson.from_hf("meta-llama/Meta-Llama-3.1-8B-Instruct")
lesson.setup(local=True)
for step in lesson.steps:
    out = step.run()
    print(out.summary)
`}</pre>
        </div>
      </header>

      <section className="mt-14 grid md:grid-cols-3 gap-4">
        <Block title="Structured JSON" text="Validated schemas with repair; cite sources for safety." />
        <Block title="Bench-ready" text="Side‑by‑side evaluation templates for cost/latency/quality." />
        <Block title="Onboarding kits" text="Turn docs into day‑one workflows for new hires." />
      </section>

      <section className="mt-14 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Why ALAIN</h2>
        <p className="mt-2 text-gray-700 max-w-3xl">
          Adoption follows documentation budgets. We make every model equally learnable so teams can choose on
          merit. Paste link. Get lesson. Run it.
        </p>
        <div className="mt-4 flex gap-3">
          <Secondary href="/blueprint">Read the blueprint</Secondary>
          <Primary href="/settings">Configure providers</Primary>
        </div>
      </section>
    </div>
  );
}

function Primary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center rounded-brand bg-brand-blue px-5 py-2 text-white font-semibold hover:brightness-95">
      {children}
    </Link>
  );
}

function Secondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center rounded-brand border border-gray-800 px-5 py-2 text-ink hover:bg-gray-50">
      {children}
    </Link>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-gray-700">{text}</div>
    </div>
  );
}

