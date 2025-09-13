export const metadata = {
  title: 'ALAIN — Home (Preview)',
  description:
    'Cleaner, focused home for ALAIN. Try Generate or browse Tutorials.',
};

export default function NewHomePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 space-y-12 text-ink-900">
      <section className="space-y-4">
        <p className="uppercase tracking-wide text-xs text-ink-700">ALAIN</p>
        <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">Learn AI by doing — fast</h1>
        <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-3xl">
          Paste a model reference and get a runnable, graded lab. Export to Colab, run locally or hosted, and inspect every request.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={process.env.NEXT_PUBLIC_NEW_SHELL === '1' ? '/new/generate' : '/generate'} className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold">Get Started</a>
          <a href="/tutorials" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900">Browse Tutorials</a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 items-start">
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">Paste</h3>
          <p className="font-inter text-ink-700">Drop a Hugging Face link or choose a local model.</p>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">Generate</h3>
          <p className="font-inter text-ink-700">ALAIN builds a leveled lab with guardrails and quick checks.</p>
        </div>
        <div className="p-6 rounded-card bg-paper-0 border border-ink-100 space-y-2 shadow-card">
          <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">Run anywhere</h3>
          <p className="font-inter text-ink-700">Export to Colab/Jupyter; switch hosted ↔ local with the same API shape.</p>
        </div>
      </section>
    </div>
  );
}

