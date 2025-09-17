import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'ALAIN · Home',
  description: 'AI Manuals for AI Models — generate step-by-step, runnable guides you can trust.',
};

export default function HomePage() {
  const generateHref = '/generate';

  return (
    <main className="flex flex-col text-ink-900">
      {/* Hero */}
      <section className="bg-paper-0">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-paper-0 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-600">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-alain-yellow" />
                OpenAI Open Model Hackathon Project
              </div>
              <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight md:text-[48px] md:leading-[52px]">
                AI Manuals for AI Models
              </h1>
              <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-2xl">
                Paste a Hugging Face link (or pick a local model) and get a runnable lesson with code, checks, and clean exports. No guesswork—just the steps you need.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={generateHref} className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold shadow-cardHover">
                  Generate Manual
                </Link>
                <Link href="/notebooks" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-ink-100 bg-white text-ink-900">
                  Browse Library
                </Link>
              </div>
              <div className="rounded-card border border-ink-100 bg-paper-0 p-5 shadow-card space-y-2">
                <div className="font-display font-semibold text-[18px] text-ink-900">Why teams use ALAIN</div>
                <ul className="space-y-2 text-ink-700 text-[15px]">
                  <li>• Step-by-step guidance with runnable notebooks</li>
                  <li>• One workflow across hosted and local providers</li>
                  <li>• Exports stay clean—no embedded secrets</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Image
                src="/hero/ALAIN-figure-hero_brand-colors.svg"
                alt="Illustration of an ALAIN manual guiding AI model usage"
                priority
                width={581}
                height={434}
                className="h-auto w-full max-w-[520px]"
                sizes="(max-width: 1024px) 80vw, 520px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-paper-50">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 space-y-8">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-display text-[30px] leading-[36px] tracking-tight">From model link to lesson in minutes</h2>
            <p className="text-[16px] text-ink-600">
              ALAIN keeps the flow linear—drop a model, read your manual, export it where you want. No extra clicking.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <HomeCard title="1 · Paste a model" text="Enter a Hugging Face URL or owner/repo, or select a local preset." subtle />
            <HomeCard title="2 · Generate" text="ALAIN writes runnable sections with quick checks, metadata, and context." subtle />
            <HomeCard title="3 · Run & export" text="Stream results instantly, then export to Colab or Jupyter with zero embedded secrets." subtle />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 space-y-8">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-display text-[30px] leading-[36px] tracking-tight">Everything stays in one view</h2>
            <p className="text-[16px] text-ink-600">
              Preview the manual, tweak settings, and publish—without hopping around the product.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <HighlightCard title="Notebook viewer" body="Live render every section with code, callouts, and maker metadata." />
            <HighlightCard title="Share instantly" body="Publish public or unlisted with one toggle—share links copy in a single click." />
            <HighlightCard title="Local-friendly" body="Swap providers or run everything with LM Studio / Ollama in the same flow." />
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="bg-gradient-to-b from-paper-50 via-white to-paper-0">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 space-y-8">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-display text-[30px] leading-[36px] tracking-tight">Built for how you teach, test, and ship</h2>
            <p className="text-[16px] text-ink-600">
              Manuals land ready for action—no onboarding labyrinth, just the routes you already use.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <HomeCard title="For teams" text="Evaluate models with identical templates, notes, and reproducible checks." />
            <HomeCard title="For educators" text="Design labs students can run in minutes with expected outputs and assessments." />
            <HomeCard title="For builders" text="Ship tutorials customers can trust, remix, and embed in docs." />
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeCard({ title, text, subtle }: { title: string; text: string; subtle?: boolean }) {
  return (
    <div
      className={`rounded-card border border-ink-100 bg-paper-0 p-6 shadow-card space-y-2 ${
        subtle ? 'bg-white/90' : ''
      }`}
    >
      <h3 className="font-display text-[20px] leading-[28px] tracking-tight">{title}</h3>
      <p className="font-inter text-[15px] leading-[24px] text-ink-700">{text}</p>
    </div>
  );
}

function HighlightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-ink-100 bg-paper-0 p-6 shadow-card">
      <h3 className="font-display text-[20px] leading-[28px] tracking-tight">{title}</h3>
      <p className="font-inter text-[15px] leading-[24px] text-ink-700">{body}</p>
    </div>
  );
}
