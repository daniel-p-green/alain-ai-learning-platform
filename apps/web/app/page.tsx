import Image from 'next/image';
import Link from 'next/link';
import HomeNotebookPreview from '@/components/HomeNotebookPreview';
import { PageContainer } from '@/components/layout/PageContainer';

// Quick-to-scan proof points that reinforce the hero promise.
const heroHighlights = [
  {
    heading: '1.86M models waiting',
    body: 'Hugging Face keeps shipping new models faster than manuals arrive. ALAIN makes them reproducible in minutes.',
  },
  {
    heading: 'Outline → Notebook → Validate',
    body: 'Deterministic JSON stages keep every run observable and repairable—no more guessing what changed.',
  },
  {
    heading: 'Poe, OpenAI-compatible, or local',
    body: 'Swap providers without rewriting docs. The same lesson contract runs hosted or fully offline.',
  },
];

// Eight deterministic stages surface how ALAIN builds and validates manuals.
const pipelineStages = [
  {
    title: 'Research Scout',
    description: 'Digest model cards, specs, and community notes into a machine-readable brief.',
  },
  {
    title: 'Lesson Architect',
    description: 'Define learner personas, objectives, and assessments in structured JSON for downstream stages.',
  },
  {
    title: 'Outline Builder',
    description: 'Capture titles, objectives, 6–12 steps, and references in deterministic outline JSON.',
  },
  {
    title: 'Section Scribe',
    description: 'Expand each outline step into balanced markdown, runnable code, and reproducibility notes.',
  },
  {
    title: 'Classroom Monitor',
    description: 'Flag placeholders, missing next steps, or unbalanced sections while keeping momentum.',
  },
  {
    title: 'Semantic Reviewer',
    description: 'Inspect terminology, clarity, and completeness so editors receive focused notes.',
  },
  {
    title: 'Quality & Colab Fixer',
    description: 'Apply Colab readiness fixes and capture reading-time metrics automatically.',
  },
  {
    title: 'Orchestrator',
    description: 'Assemble the `.ipynb`, validation summary, and metrics JSON so teams can ship or audit with confidence.',
  },
];

// Provider CTA blocks stay unchanged so CLI + web share messaging.
const providerCards = [
  {
    name: 'Poe (default)',
    summary: 'Fastest path to GPT-OSS teachers; add `POE_API_KEY` and go.',
    instructions: ['Set `POE_API_KEY` in `.env`.', 'Start with `npm run dev:hosted` or CLI `--baseUrl https://api.poe.com`.'],
  },
  {
    name: 'OpenAI-compatible',
    summary: 'Point at any compatible endpoint to reuse enterprise infra.',
    instructions: ['Set `OPENAI_BASE_URL` + `OPENAI_API_KEY`.', 'Web + CLI pick up the same config automatically.'],
  },
  {
    name: 'Local (Ollama / vLLM)',
    summary: 'Keep everything offline while using identical lesson contracts.',
    instructions: ['Run `http://localhost:11434` or your vLLM endpoint.', 'Skip `--apiKey`; notebooks stay local-first.'],
  },
];

export const metadata = {
  title: 'ALAIN · Home',
  description: 'AI Manuals for AI Models. Generate step-by-step, runnable guides you can trust.',
};

export default function HomePage() {
  return (
    <main className="flex flex-col text-ink-900">
      {/* Hero ---------------------------------------------------------------- */}
      <section className="bg-paper-0">
        <PageContainer maxWidth="wide" paddingY="none" className="py-16 lg:py-20 space-y-12">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="space-y-7">
              <span className="inline-flex items-center rounded-full bg-alain-blue/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.2em] text-alain-blue">APPLIED LEARNING AI NOTEBOOKS</span>
              <h1 className="font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 md:text-[56px]">
                Ship runnable AI manuals in minutes
              </h1>
              <p className="font-inter text-lg leading-8 text-ink-700 max-w-xl">
                Paste a model card, pick a teacher, and let ALAIN assemble the outline, sections, and validators. Every artifact is review-ready so launch, enablement, and safety teams move together.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/generate"
                  className="inline-flex h-12 items-center rounded-[14px] bg-alain-blue px-6 font-semibold text-white shadow-cardHover transition hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
                >
                  Get started
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-12 items-center rounded-[14px] border border-ink-200 px-6 text-ink-800 transition hover:bg-paper-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200/60"
                >
                  Explore the pipeline
                </Link>
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
                sizes="(max-width: 1024px) 82vw, 520px"
              />
            </div>
          </div>
          <dl className="grid gap-5 border-t border-ink-100 pt-10 md:grid-cols-3">
            {heroHighlights.map((signal) => (
              <div
                key={signal.heading}
                className="rounded-2xl border border-ink-100/70 bg-white/90 p-6 transition duration-200 ease-out hover:border-alain-blue/30 hover:shadow-card"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-alain-blue/80">{signal.heading}</dt>
                <dd className="mt-2 text-sm leading-6 text-ink-700">{signal.body}</dd>
              </div>
            ))}
          </dl>
        </PageContainer>
      </section>

      {/* Notebook preview --------------------------------------------------- */}
      <section className="bg-gradient-to-b from-paper-0 via-white to-paper-50">
        <PageContainer maxWidth="wide" paddingY="none" className="py-20 lg:py-24 space-y-8">
          <header className="max-w-3xl space-y-4">
            <h2 className="font-display text-[36px] leading-[1.05] tracking-tight text-ink-900">
              Preview the notebook before you hit export
            </h2>
            <p className="text-base text-ink-600">
              ALAIN assembles a living notebook—markdown, runnable cells, validators, and analytics metadata—before you ever download the `.ipynb`. Review it, edit it, or rerun any stage without losing the thread.
            </p>
          </header>
          <HomeNotebookPreview />
        </PageContainer>
      </section>

      {/* Pipeline ------------------------------------------------------------ */}
      <section id="how-it-works" className="bg-paper-50">
        <PageContainer maxWidth="wide" paddingY="none" className="py-20 lg:py-24 space-y-12">
          <header className="max-w-3xl space-y-4">
            <h2 className="font-display text-[36px] leading-[1.05] tracking-tight text-ink-900">How ALAIN works</h2>
            <p className="text-base text-ink-600">
              Eight observable stages turn a messy model card into a repeatable lesson. Every checkpoint saves artifacts, timings, and repair notes so you can replay just the part that needs love.
            </p>
          </header>
          <div className="-mx-4 overflow-x-auto pb-4 sm:mx-0">
            <ol className="mx-4 grid gap-6 sm:mx-0 sm:grid-cols-2 xl:grid-cols-4">
              {pipelineStages.map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-3 rounded-3xl border border-ink-100 bg-white/95 p-6 shadow-alain-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-alain-blue/40 font-display text-[18px] font-semibold text-alain-blue">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="text-xs font-semibold uppercase tracking-[0.26em] text-ink-400">
                      Stage {index + 1}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-ink-900">{step.title}</h3>
                    <p className="text-sm leading-6 text-ink-600">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </PageContainer>
      </section>

      {/* Providers ----------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-paper-50 via-white to-paper-0">
        <PageContainer maxWidth="wide" paddingY="none" className="py-16 lg:py-20 space-y-8">
          <header className="space-y-3">
            <h2 className="font-display text-[34px] leading-[1.1] tracking-tight text-ink-900">Run it anywhere</h2>
            <p className="text-base text-ink-600 max-w-3xl">
              Swap teachers and runtimes without rewriting lessons. ALAIN shares the same request shape across Poe, OpenAI-compatible APIs, and fully local stacks.
            </p>
          </header>
          <div className="grid gap-6 lg:grid-cols-3">
            {providerCards.map((card) => (
              <div key={card.name} className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
                <div className="space-y-1">
                  <h3 className="font-display text-xl text-ink-900">{card.name}</h3>
                  <p className="text-sm text-ink-600">{card.summary}</p>
                </div>
                <ul className="space-y-2 text-sm text-ink-700">
                  {card.instructions.map((instruction) => (
                    <li key={instruction} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-alain-yellow" />
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
