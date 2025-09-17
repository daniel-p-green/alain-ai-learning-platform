import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

const HeroNotebookPreview = dynamic(() => import('../components/HomeNotebookPreview'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-xl border border-ink-100 bg-ink-900/80 animate-pulse" aria-hidden />
  ),
});

const heroBullets = [
  'Outline-first prompts keep every lesson predictable and remixable.',
  'Quality + Colab validators gate readability, installs, and safety notes.',
  'Exports ship with a runnable notebook, validation summary, and metrics JSON.',
];

const socialProof = [
  { label: 'OpenAI Open Model Hackathon', value: 'Built for launch' },
  { label: 'leap.new 2025', value: '3rd place winner' },
  { label: 'MIT Licensed', value: 'Open source' },
];

const whatYouGet = [
  { title: '.ipynb notebook', body: 'Runnable, parameterized sections with reproducible setup.' },
  { title: 'Validation report', body: 'Markdown summary of quality score, fixes, and next checks.' },
  { title: 'Metrics JSON', body: 'Structured data for sections, readability, and timings.' },
];

const timelineSteps = [
  {
    title: '1 · Outline',
    description: 'ALAIN requests strict JSON outlines (title, steps, assessments) so every run starts structured.',
    proof: 'Prompt enforces 6–12 steps, ipywidgets install, and token budgets.',
    code: '{\n  "title": "Hands-on GPT-OSS-20B",\n  "outline": [{ "step": 1, "title": "Step 1: Setup" }]\n}',
  },
  {
    title: '2 · Sections',
    description: 'Each step is filled with balanced markdown + code, then stitched locally—no remote notebooks.',
    proof: 'Section generator respects markdown/code ratio (40–70%) and adds callouts.',
    code: 'await sectionGenerator.generateSection({\n  sectionNumber: 3,\n  modelReference: "gpt-oss-20b",\n  outline,\n});',
  },
  {
    title: '3 · Validation',
    description: 'Quality and Colab validators catch readability gaps, `%pip` installs, and `.env` handling issues.',
    proof: 'Colab fixes run automatically; optional Gemini rewrites patch tricky cells.',
    code: 'npm run validate:lesson output/manuals/gpt-oss-20b.json',
  },
  {
    title: '4 · Export',
    description: 'Deliverables drop together: notebook, Markdown report, metrics, and `.env.local` helper.',
    proof: 'CLI + web share the same pipeline; outputs are ready for Colab, Jupyter, or sharing.',
    code: 'npm run alain:cli -- --model gpt-oss-20b --outDir output/manuals',
  },
];

const providerCards = [
  {
    name: 'Poe (default)',
    summary: 'Fastest path to GPT-OSS teachers—just add `POE_API_KEY`.',
    instructions: ['Set `POE_API_KEY` in `.env`.', 'Run `npm run dev:hosted` or CLI with `--baseUrl https://api.poe.com`.'],
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
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-ink-600">
                {socialProof.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 shadow-sm">
                    <span className="text-[10px] text-ink-500">{item.value}</span>
                    <span className="text-ink-700">{item.label}</span>
                  </span>
                ))}
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-alain-blue uppercase tracking-[0.18em]">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-alain-yellow" />
                  AI Manuals for AI Models
                </div>
                <h1 className="font-display text-[44px] leading-tight tracking-tight text-ink-900 md:text-[56px] md:leading-[1.05]">
                  Paste a model card. Ship a runnable manual minutes later.
                </h1>
                <p className="font-inter text-lg leading-8 text-ink-700 max-w-2xl">
                  ALAIN turns every model release into a guided, reproducible notebook with setup, safe experiments, assessments, and exports—no guesswork or blank notebooks.
                </p>
              </div>
              <ul className="space-y-3 text-base text-ink-700 font-inter">
                {heroBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-alain-yellow" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/generate"
                  className="inline-flex items-center h-12 px-6 rounded-[14px] bg-alain-yellow text-alain-blue font-semibold shadow-cardHover focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40"
                >
                  Generate Manual
                </Link>
                <Link
                  href="https://github.com/AppliedLearningAI/alain-ai-learning-platform"
                  className="inline-flex items-center h-12 px-6 rounded-[14px] border border-ink-200 bg-white/60 text-ink-900 font-semibold hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40"
                >
                  Contribute on GitHub
                </Link>
              </div>
              <div className="grid gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:grid-cols-3">
                {whatYouGet.map((item) => (
                  <div key={item.title} className="space-y-1">
                    <div className="text-sm font-semibold uppercase tracking-wide text-ink-500">{item.title}</div>
                    <div className="text-sm text-ink-700 leading-5">{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-full max-w-[520px]">
                <div className="absolute -top-6 -left-6 hidden h-20 w-20 rounded-full bg-gradient-to-br from-alain-yellow/60 to-transparent blur-2xl md:block" aria-hidden />
                <Image
                  src="/hero/ALAIN-figure-hero_brand-colors.svg"
                  alt="Illustration of an ALAIN manual guiding AI model usage"
                  priority
                  width={581}
                  height={434}
                  className="h-auto w-full"
                  sizes="(max-width: 1024px) 80vw, 520px"
                />
              </div>
              <div className="w-full max-w-[520px]">
                <HeroNotebookPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 lg:py-20 space-y-10">
          <header className="max-w-3xl space-y-3">
            <h2 className="font-display text-[34px] leading-[1.1] tracking-tight text-ink-900">How ALAIN works</h2>
            <p className="text-base text-ink-600">
              One pipeline powers the CLI, web app, and backend. Every step is deterministic and grounded in the outline-first contract.
            </p>
          </header>
          <div className="grid gap-8 lg:grid-cols-2">
            {timelineSteps.map((step) => (
              <div key={step.title} className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-paper-0 p-6 shadow-card">
                <div className="space-y-1">
                  <div className="text-sm font-semibold uppercase tracking-wide text-alain-blue/80">{step.title}</div>
                  <p className="text-base text-ink-800 leading-6">{step.description}</p>
                </div>
                <p className="text-sm text-ink-500">{step.proof}</p>
                <pre className="overflow-x-auto rounded-xl bg-ink-900 text-ink-50 text-xs leading-relaxed p-4">
                  <code>{step.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-paper-50 via-white to-paper-0">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 lg:py-20 space-y-8">
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
        </div>
      </section>
    </main>
  );
}
