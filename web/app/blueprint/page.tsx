export const metadata = {
  title: "ALAIN — IKEA for AI (Blueprint Layer)",
  description:
    "ALAIN turns any model into runnable, teachable workflows – the open-source blueprint layer for all models.",
};

export default function BlueprintPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-16">
      {/* Hero */}
      <section className="space-y-4">
        <p className="uppercase tracking-wide text-xs text-gray-500">Imagine</p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight">
          IKEA for AI: instruction booklets for every model
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          ALAIN is the open‑source blueprint layer for all models. Models are the raw
          materials. ALAIN is the instruction booklet that turns them into things you use every day.
        </p>
        <div className="flex gap-3">
          <a href="/generate" className="inline-flex items-center px-4 py-2 rounded-brand bg-brand-blue text-white font-semibold hover:brightness-95">Generate a lesson</a>
          <a href="/tutorials" className="inline-flex items-center px-4 py-2 rounded-brand border border-gray-800 text-ink hover:bg-gray-50">Browse tutorials</a>
        </div>
      </section>

      {/* Problem tiles */}
      <section className="grid md:grid-cols-3 gap-4">
        <Tile title="Model releases outpace learning" note="Docs become guesses, retries, delays."/>
        <Tile title="Adoption concentrates on a few providers" note="The long tail stalls without education."/>
        <Tile title="Small labs can’t afford DevRel" note="Great models die in obscurity."/>
      </section>

      {/* Solution */}
      <section className="grid md:grid-cols-2 gap-6 items-start">
        <div className="p-6 rounded-2xl bg-gray-900 text-gray-100 border border-gray-800 space-y-3">
          <h2 className="text-2xl font-bold">Paste link → working code in 1 click</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Reads model cards and repos (Hugging Face)</li>
            <li>Generates runnable lessons with setup, concepts, and MCQs</li>
            <li>1‑click Colab or fully local (Ollama/vLLM)</li>
            <li>Guardrails: citations, linting, and safe defaults</li>
          </ul>
          <div className="text-sm text-gray-400">“What took days now takes minutes.”</div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4">
          <h3 className="text-xl font-semibold">Why it matters</h3>
          <p className="text-gray-700">The best model doesn’t win if developers can’t use it. ALAIN makes every model equally learnable so teams can choose on merit — not marketing budget.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <li className="border border-gray-200 rounded-lg p-3"><b>Global</b><br/>Portuguese, Spanish, more — lower barriers worldwide.</li>
            <li className="border border-gray-200 rounded-lg p-3"><b>Evaluate</b><br/>Side‑by‑side quality/cost/latency templates.</li>
            <li className="border border-gray-200 rounded-lg p-3"><b>Onboard</b><br/>New hires productive on day one.</li>
            <li className="border border-gray-200 rounded-lg p-3"><b>Private</b><br/>Local‑first mode with no external calls.</li>
          </ul>
        </div>
      </section>

      {/* Slides as headers */}
      <section className="space-y-6">
        <Slide text="Alain: The open‑source blueprint layer for all models"/>
        <Slide text="Any model → working code in 1 click (Colab/Local)"/>
        <Slide text="Turns any model into a daily workflow"/>
      </section>

      {/* Closing CTA */}
      <section className="p-6 rounded-2xl bg-gray-900 text-gray-100 border border-gray-800">
        <div className="md:flex items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Stop reading docs. Start shipping models.</h3>
            <p className="text-gray-300">Paste link. Get lesson. Run it. Reuse it. ALAIN makes every model ready to run.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <a href="/generate" className="inline-flex items-center px-4 py-2 rounded-brand bg-brand-blue text-white font-semibold hover:brightness-95">Try ALAIN</a>
            <a href="/settings" className="inline-flex items-center px-4 py-2 rounded-brand border border-gray-700 text-gray-100 hover:bg-gray-800">Configure providers</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Tile({ title, note }: { title: string; note: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{note}</div>
    </div>
  );
}

function Slide({ text }: { text: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-gray-200">
      <div className="text-xl md:text-2xl font-bold">{text}</div>
    </div>
  );
}

