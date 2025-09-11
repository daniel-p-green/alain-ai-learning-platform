import Link from "next/link";

export const metadata = {
  title: "ALAIN — Academy-style landing",
  description: "Soft neutrals, serif headings, friendly blocks (Anthropic-inspired).",
};

export default function AnthropicVariant() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black">ALAIN Academy</h1>
        <p className="mx-auto max-w-3xl text-gray-700 text-lg">
          Learn any model with runnable lessons, safe defaults, and exportable notebooks. From API quickstarts
          to enterprise onboarding, the academy has you covered.
        </p>
        <div className="flex gap-3 justify-center">
          <Primary href="/generate">Start with a model</Primary>
          <Secondary href="/tutorials">See courses</Secondary>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Featured" desc="AI Fluency for Models — a practical guide to reading cards and running baselines." color="bg-amber-100"/>
        <Card title="Build with ALAIN" desc="Step-by-step API guides, templates, and best practices." color="bg-teal-100"/>
        <Card title="For Teams" desc="Roll out model onboarding at scale with shared playbooks." color="bg-indigo-100"/>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-semibold">Data & Privacy</h2>
        <p className="mt-2 text-gray-700">Local-first option lets you learn with zero external calls. Configure Ollama or vLLM and stay private.</p>
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

function Card({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 ${color} p-5`}>
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-gray-700">{desc}</div>
    </div>
  );
}

