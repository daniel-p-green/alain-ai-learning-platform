import Link from 'next/link';
import { HomeAudienceTabs } from '../components/HomeAudienceTabs';

export const metadata = {
  title: 'ALAIN · Home',
  description: 'AI Manuals for AI Models — generate step-by-step, runnable guides you can trust.',
};

export default function HomePage() {
  const generateHref = '/generate';
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 space-y-20 text-ink-900">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-paper-0 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-600">
              <span className="h-1.5 w-1.5 rounded-full bg-alain-yellow" />
              OpenAI Open Model Hackathon Project
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-paper-0 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-600">
              <span className="h-1.5 w-1.5 rounded-full bg-alain-yellow" />
              leap.new Top 3
            </span>
          </div>
          <h1 className="font-display font-bold text-[44px] leading-[48px] tracking-tight md:text-[52px] md:leading-[56px]">AI Manuals for AI Models</h1>
          <p className="font-inter text-[19px] leading-[30px] text-ink-700 max-w-2xl">
            Paste any Hugging Face model link and get an interactive notebook you can run locally or in Colab—with runnable code, checks, and clean exports.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href={generateHref} className="inline-flex items-center justify-center h-12 px-6 rounded-[14px] bg-alain-yellow text-alain-blue font-semibold text-[16px] shadow-cardHover hover:translate-y-[-1px] transition-transform">
              Generate Manual
            </Link>
            <Link href="/notebooks" className="inline-flex items-center justify-center h-12 px-6 rounded-[14px] border border-ink-200 bg-white/80 text-ink-900 text-[16px] font-medium hover:bg-paper-50 transition-colors">
              Explore Library
            </Link>
          </div>
          <div className="grid gap-4 rounded-card border border-ink-100 bg-paper-0 p-6 shadow-card md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="space-y-2">
              <div className="font-display font-semibold text-[18px] text-ink-900">Why ALAIN</div>
              <ul className="space-y-2 text-ink-700 text-[15px]">
                <li>• AI adoption follows instructions. ALAIN writes them for every model.</li>
                <li>• Build real skills with hands-on steps and checks.</li>
                <li>• Use one request shape across hosted and local providers.</li>
                <li>• Export clean notebooks with no embedded secrets.</li>
              </ul>
            </div>
            <div className="hidden md:flex flex-col items-end text-right text-xs uppercase tracking-wide text-ink-500">
              <span>Teacher model</span>
              <span className="text-ink-700 font-semibold">gpt-oss-20b</span>
              <span className="mt-2 text-ink-500">Delivered via Poe API</span>
            </div>
          </div>
        </div>
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[520px] rounded-[20px] border border-ink-100 bg-paper-0/90 shadow-cardHover overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-alain-blue/10 to-transparent" />
            <div className="relative p-4">
              <div className="rounded-[16px] border border-ink-100 bg-paper-50/80 p-3">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-500">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-alain-blue text-white">↺</span>
                  Try Prompt
                </div>
                <div className="space-y-3 text-[14px] text-ink-700">
                  <p className="font-medium text-ink-900">Prompt</p>
                  <div className="rounded-[12px] border border-ink-100 bg-white p-3 font-mono text-[12px] leading-[18px] text-ink-700">
                    paste `meta-llama/Llama-3.1-8B-Instruct`
                    <br />and get a runnable tutorial.
                  </div>
                  <div className="rounded-[12px] border border-ink-100 bg-white p-3">
                    <p className="font-medium text-ink-900">Preview</p>
                    <ul className="mt-2 space-y-2 text-[12px] text-ink-700">
                      <li>• Setup instructions with environment checks</li>
                      <li>• Example prompts with expected outputs</li>
                      <li>• Export-ready notebook structure</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-10">
        <div className="space-y-3">
          <h2 className="font-display text-[30px] leading-[36px] tracking-tight">How it works</h2>
          <p className="text-ink-600 max-w-2xl text-[16px]">Three steps from link to lesson. We keep the manual interactive, runnable, and export-ready.</p>
        </div>
        <ol className="relative border-l border-ink-100 pl-6 space-y-10">
          <StepItem
            step="1"
            title="Paste a model"
            description="Drop in any Hugging Face URL or owner/repo. We fetch the cards, tags, and license info for context."
          />
          <StepItem
            step="2"
            title="Generate a manual"
            description="ALAIN writes runnable sections with setup, quick checks, and remediation tips tailored to the model."
          />
          <StepItem
            step="3"
            title="Run, remix, export"
            description="Stream results, fork the notebook, and export to Colab or Jupyter with zero secrets embedded."
          />
        </ol>
      </section>

      {/* Audience */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="font-display text-[30px] leading-[36px] tracking-tight">Built for your workflow</h2>
          <p className="text-ink-600 max-w-2xl text-[16px]">Switch use cases to see how teams, educators, and builders ship faster with ready-to-run manuals.</p>
        </div>
        <HomeAudienceTabs />
      </section>
    </div>
  );
}

function StepItem({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <li className="relative">
      <div className="absolute -left-[38px] top-0 flex h-8 w-8 items-center justify-center rounded-full border border-alain-blue bg-white font-display text-[16px] text-alain-blue">
        {step}
      </div>
      <div className="space-y-2 rounded-[16px] bg-paper-0/90 p-6 shadow-card">
        <h3 className="font-display text-[22px] leading-[28px] text-ink-900">{title}</h3>
        <p className="text-[15px] leading-[24px] text-ink-700">{description}</p>
      </div>
    </li>
  );
}
