import Accordion from "@/components/Accordion";

export const metadata = {
  title: "ALAIN Brand Demo — Docs",
};

function DocCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="bg-paper-50 border border-ink-100 rounded-card shadow-card">
      <div className="p-6 space-y-2">
        <h3 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">{title}</h3>
        <p className="font-inter text-[16px] leading-[26px] text-ink-700">{children}</p>
      </div>
    </article>
  );
}

export default function DocsDemo() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 space-y-12">
      <header>
        <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">Academy</h1>
        <p className="font-inter text-[18px] leading-[28px] text-ink-700 mt-2">Structured guides for popular providers and workflows.</p>
      </header>
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DocCard title="OpenAI">
          Quickstart notebooks, best practices, and evaluation patterns.
        </DocCard>
        <DocCard title="Hugging Face">
          Inference APIs, Spaces, and Transformers with Colab recipes.
        </DocCard>
        <DocCard title="Local Runtimes">
          Ollama and vLLM setups with safety and monitoring.
        </DocCard>
      </section>
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[32px] leading-[38px] tracking-tight">FAQ</h2>
        <Accordion title="How do I run locally?">
          Use the Settings page to detect Ollama or LM Studio and generate notebooks with local endpoints.
        </Accordion>
        <Accordion title="How does ALAIN handle credentials?">
          Use environment variables and local secrets. The generator avoids embedding secrets in notebooks.
        </Accordion>
        <Accordion title="How do I contribute lessons?">
          Fork the repo, add a lesson under tutorials, and open a PR with runnable steps.
        </Accordion>
      </section>
    </div>
  );
}

