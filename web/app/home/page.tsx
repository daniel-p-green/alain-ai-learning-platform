export const metadata = {
  title: 'ALAIN · Home',
  description: 'AI Manuals for AI Models — generate step-by-step, runnable guides you can trust.',
};

export default function NewHomePage() {
  const generateHref = '/generate';
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 space-y-16 text-ink-900">
      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-5">
          <p className="uppercase tracking-wide text-xs text-ink-700">Applied Learning for AI</p>
          <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">AI Manuals for AI Models</h1>
          <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-prose">
            Paste a Hugging Face link or pick a local model. Generate a step‑by‑step manual with runnable code, checks, and clean exports.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={generateHref} className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold">Generate Manual</a>
            <a href="/notebooks" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-ink-100 bg-white text-ink-900">Browse Library</a>
          </div>
        </div>
        <div className="rounded-card border border-ink-100 bg-paper-0 p-5 shadow-card">
          <div className="font-display font-semibold text-[18px] text-ink-900">Why ALAIN</div>
          <ul className="mt-3 space-y-2 text-ink-700 text-[15px]">
            <li>• Build real skills with hands-on steps and checks</li>
            <li>• Use one request shape across hosted and local providers</li>
            <li>• Export clean notebooks with no embedded secrets</li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="grid md:grid-cols-3 gap-6 items-start">
        <HomeCard title="1. Paste a model link" text="Enter a Hugging Face URL or owner/repo, or select a local model." />
        <HomeCard title="2. Generate a lesson" text="ALAIN creates a guided notebook with setup, examples, and quick checks." />
        <HomeCard title="3. Run and export" text="Stream results, inspect requests, and export to Colab or Jupyter." />
      </section>

      {/* Audience */}
      <section className="grid md:grid-cols-3 gap-6 items-start">
        <HomeCard title="For teams" text="Evaluate models with the same template and clear requests." subtle />
        <HomeCard title="For educators" text="Design labs that students can run and verify in minutes." subtle />
        <HomeCard title="For builders" text="Ship tutorials that users can trust and reuse." subtle />
      </section>
    </div>
  );
}

function HomeCard({ title, text, subtle }: { title: string; text: string; subtle?: boolean }) {
  return (
    <div className={`p-6 rounded-card border ${subtle ? 'border-ink-100 bg-paper-0' : 'border-ink-100 bg-paper-0'} space-y-2 shadow-card`}>
      <h3 className="font-display font-semibold text-[20px] leading-[28px] tracking-tight">{title}</h3>
      <p className="font-inter text-ink-700">{text}</p>
    </div>
  );
}
