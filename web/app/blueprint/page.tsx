export const metadata = {
  title: "ALAIN - The Instruction Layer",
  description:
    "The open source IKEA instruction layer for AI models. Learn AI with AI: pick any model in Hugging Face, Ollama, or LM Studio and get interactive how-to guides. Run locally or in the cloud with gpt-oss.",
};

export default function BlueprintPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 space-y-16 text-ink-900">
      {/* Hero */}
      <section className="space-y-4">
        <p className="uppercase tracking-wide text-xs text-ink-700">Imagine</p>
        <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">The instruction layer for AI models</h1>
        <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-3xl">
          ALAIN is the open source IKEA instruction layer for AI models. Models are the raw materials; ALAIN is the instruction booklet that turns them into things you use every day.
        </p>
        <div className="flex gap-3">
          <a href="/generate" className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Generate a lesson</a>
          <a href="/tutorials" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Browse tutorials</a>
        </div>
      </section>

      {/* Problem tiles */}
      <section className="grid md:grid-cols-3 gap-6">
        <Tile title="Model releases outpace learning" note="Docs become guesses, retries, delays."/>
        <Tile title="Adoption concentrates on a few providers" note="The long tail stalls without education."/>
        <Tile title="Small labs can’t afford DevRel" note="Great models die in obscurity."/>
      </section>

      {/* Solution */}
      <section className="grid md:grid-cols-2 gap-6 items-start">
        <div className="p-6 rounded-card bg-ink-900 text-white border border-ink-100/10 space-y-3">
          <h2 className="font-display font-semibold text-[32px] leading-[38px] tracking-tight">Paste link → working code in 1 click</h2>
          <ul className="list-disc pl-5 space-y-1 text-white/80">
            <li>Reads model cards and repos (Hugging Face)</li>
            <li>Generates runnable lessons with setup, concepts, and MCQs</li>
            <li>1‑click Colab or fully local (Ollama/vLLM)</li>
            <li>Guardrails: citations, linting, and safe defaults</li>
          </ul>
          <div className="text-sm text-white/70">“What took days now takes minutes.”</div>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-4 shadow-card">
          <h3 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">Why it matters</h3>
          <p className="font-inter text-ink-700">The best model does not win if developers cannot use it. ALAIN makes every model equally learnable so teams can choose on merit, not marketing budget.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink-700">
            <li className="border border-ink-100 rounded-card p-3"><b>Global</b><br/>Portuguese, Spanish, more — lower barriers worldwide.</li>
            <li className="border border-ink-100 rounded-card p-3"><b>Evaluate</b><br/>Side‑by‑side quality/cost/latency templates.</li>
            <li className="border border-ink-100 rounded-card p-3"><b>Onboard</b><br/>New hires productive on day one.</li>
            <li className="border border-ink-100 rounded-card p-3"><b>Private</b><br/>Local‑first mode with no external calls.</li>
          </ul>
        </div>
      </section>

      {/* Slides as headers */}
      <section className="space-y-6">
        <Slide text="Alain: The open-source blueprint layer for all models"/>
        <Slide text="Any model → working code in 1 click (Colab/Local)"/>
        <Slide text="Turns any model into a daily workflow"/>
      </section>

      {/* Closing CTA */}
      <section className="p-6 rounded-card bg-ink-900 text-white border border-ink-100/10">
        <div className="md:flex items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-semibold text-[32px] leading-[38px] tracking-tight">Stop reading docs. Start shipping models.</h3>
            <p className="font-inter text-white/80">Paste link. Get lesson. Run it. Reuse it. ALAIN makes every model ready to run.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <a href="/generate" className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold">Try ALAIN</a>
            <a href="/settings" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-white/30 text-white">Configure providers</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Tile({ title, note }: { title: string; note: string }) {
  return (
    <div className="p-6 rounded-card bg-paper-0 border border-ink-100 shadow-card">
      <div className="font-display font-semibold text-[20px] leading-[28px]">{title}</div>
      <div className="text-sm font-inter text-ink-700 mt-1">{note}</div>
    </div>
  );
}

function Slide({ text }: { text: string }) {
  return (
    <div className="p-5 rounded-card bg-paper-0 border border-ink-100 shadow-card">
      <div className="font-display font-semibold text-[24px] leading-[30px] tracking-tight">{text}</div>
    </div>
  );
}
