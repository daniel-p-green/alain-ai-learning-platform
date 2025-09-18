import Image from 'next/image';
import Link from 'next/link';
import HomeNotebookPreview from '@/components/HomeNotebookPreview';
import { PageContainer } from '@/components/layout/PageContainer';

// Hero journey mirrors the PRD narrative—show users the three beats between paste and export.
const heroJourney = [
  {
    title: '1. Capture the brief',
    body: 'Drop in a model card or spec. ALAIN distills objectives, guardrails, and setup requirements into a structured outline.',
  },
  {
    title: '2. Build the manual',
    body: 'Sections expand into balanced markdown and runnable code. Validators flag missing installs or risky placeholders along the way.',
  },
  {
    title: '3. Ship with confidence',
    body: 'Export a Colab-ready notebook, validation summary, and metrics JSON—ready for reviewers, workshops, or CI.',
  },
];

const notebookDeliverables = [
  { title: '.ipynb notebook', body: 'Runnable, parameterized sections with reproducible setup.' },
  { title: 'Validation report', body: 'Markdown summary of quality score, fixes, and next checks.' },
  { title: 'Metrics JSON', body: 'Structured data for sections, readability, and timings.' },
];

const heroProofPoints = [
  { label: 'Models awaiting manuals', value: '1.86M on Hugging Face' },
  { label: 'Outline-first pipeline', value: 'Research → Draft → Validate' },
  { label: 'Open ecosystem', value: 'MIT Licensed, provider agnostic' },
];

const pipelineStages = [
  {
    title: 'Research Scout',
    description: 'Digest model cards, specs, and community notes into a machine-readable brief.',
  },
  {
    title: 'Outline Generator',
    description: 'Enforces structured objectives, guardrails, and setup requirements as deterministic JSON.',
  },
  {
    title: 'Section Builder',
    description: 'Expands each outline step into balanced markdown, runnable code, and assessment items.',
  },
  {
    title: 'Validators',
    description: 'Quality + Colab checks catch missing installs, placeholders, and readability regressions.',
  },
  {
    title: 'Export',
    description: 'Publish a Colab-ready notebook, validation summary, and metrics JSON for reviewers.',
  },
];

const providerCards = [
  {
    name: 'Poe (default)',
    summary: 'Fastest path to GPT-OSS teachers—just add `POE_API_KEY`.',
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
  description: 'AI Manuals for AI Models — generate step-by-step, runnable guides you can trust.',
};

export default function HomePage() {
  return (
    <main className="flex flex-col text-ink-900">
      <section className="bg-paper-0">
        <PageContainer maxWidth="wide" paddingY="none" className="py-16 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-alain-blue/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.2em] text-alain-blue">APPLIED LEARNING AI NOTEBOOKS</span>
              <h1 className="font-display text-[42px] leading-[1.05] tracking-tight text-ink-900 md:text-[54px]">
                AI Manuals for AI Models
              </h1>
              <p className="font-inter text-lg leading-8 text-ink-700 max-w-xl">
                ALAIN turns undocumented models into reproducible labs. The outline-first pipeline researches, drafts, validates, and exports so teams adopt the long-tail of AI without reverse-engineering docs.
              </p>
              <div className="flex flex-wrap gap-3 text-sm font-medium text-alain-blue">
                {heroProofPoints.map((point) => (
                  <div key={point.label} className="flex items-center gap-2 rounded-full border border-alain-blue/20 bg-white/70 px-3 py-1">
                    <span className="font-semibold text-alain-blue">{point.value}</span>
                    <span className="text-alain-blue/80">{point.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/generate"
                  className="inline-flex items-center h-12 px-6 rounded-[14px] bg-alain-blue text-white font-semibold shadow-cardHover transition hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
                >
                  Generate manual
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center h-12 px-6 rounded-[14px] border border-white/30 text-white/85 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue"
                >
                  See how it works
                </Link>
              </div>
              <ol className="grid gap-3 sm:grid-cols-3">
                {heroJourney.map((item) => (
                  <li key={item.title} className="rounded-[16px] border border-ink-100 bg-white p-4 text-sm text-ink-700 shadow-card">
                    <div className="font-semibold text-ink-900">{item.title}</div>
                    <p className="mt-1 leading-5">{item.body}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -top-6 -left-6 hidden h-20 w-20 rounded-full bg-gradient-to-br from-alain-yellow/60 to-transparent blur-2xl md:block" aria-hidden />
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
        </PageContainer>
      </section>

      <section className="bg-white">
        <PageContainer maxWidth="wide" paddingY="none" className="py-14 lg:py-18">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-5">
            <h2 className="font-display text-[34px] leading-[1.1] tracking-tight text-ink-900">See the manual before you export</h2>
            <p className="text-base text-ink-600 max-w-xl">
              Notebook preview renders live output from the generator—the same `.ipynb` you can export to Colab or Jupyter. No secrets baked in, no extra wiring.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {notebookDeliverables.map((item) => (
                <li key={item.title} className="rounded-card border border-ink-100 bg-paper-50 p-4 shadow-card">
                  <div className="text-sm font-semibold uppercase tracking-wide text-ink-500">{item.title}</div>
                  <p className="mt-1 text-sm text-ink-700 leading-5">{item.body}</p>
                </li>
              ))}
            </ul>
            </div>
            <div className="rounded-2xl bg-white shadow-card border border-ink-100 p-5">
              <HomeNotebookPreview />
            </div>
          </div>
        </PageContainer>
      </section>

      <section id="how-it-works" className="bg-paper-50">
        <PageContainer maxWidth="wide" paddingY="none" className="py-16 lg:py-20 space-y-10">
          <header className="max-w-3xl space-y-3">
            <h2 className="font-display text-[34px] leading-[1.1] tracking-tight text-ink-900">How ALAIN works</h2>
            <p className="text-base text-ink-600">
              ALAIN-Kit powers the pipeline: outline → sections → notebook build → validation. Every phase is deterministic and runs locally once JSON comes back from the teacher.
            </p>
          </header>
          <ol className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {pipelineStages.map((step, index) => (
              <li key={step.title} className="relative flex md:flex-1">
                <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-alain-blue text-white text-sm font-semibold">
                    {index + 1}
                    {index < pipelineStages.length - 1 && (
                      <span className="absolute left-1/2 top-[calc(100%+0.5rem)] block h-10 w-[2px] -translate-x-1/2 bg-ink-200 md:hidden" />
                    )}
                    {index < pipelineStages.length - 1 && (
                      <span className="absolute top-1/2 left-[calc(100%+1.5rem)] hidden h-[2px] w-[calc(100%+1.5rem)] bg-ink-200 md:block" />
                    )}
                  </div>
                  <div className="max-w-xs space-y-2 text-left md:text-center">
                    <div className="text-sm font-semibold uppercase tracking-wide text-alain-blue/80">{step.title}</div>
                    <p className="text-sm leading-6 text-ink-700">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

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
