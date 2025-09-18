import Image from 'next/image';
import HomeNotebookPreview from '@/components/HomeNotebookPreview';
import { ButtonLink } from '@/components/ButtonLink';
import { PageContainer } from '@/components/layout/PageContainer';

const heroBullets = [
  'Outline-first prompts keep every lesson predictable and remixable.',
  'Quality + Colab validators guard readability, installs, and safety notes.',
  'Exports ship with a runnable notebook, validation summary, and metrics JSON.',
];

const heroMeta = 'Built for launch · OpenAI Open Model Hackathon · 3rd place at leap.new 2025 · MIT Licensed';

const notebookDeliverables = [
  { title: '.ipynb notebook', body: 'Runnable, parameterized sections with reproducible setup.' },
  { title: 'Validation report', body: 'Markdown summary of quality score, fixes, and next checks.' },
  { title: 'Metrics JSON', body: 'Structured data for sections, readability, and timings.' },
];

const timelineSteps = [
  {
    title: 'Outline Generator',
    description: 'Outline-first prompt requests strict JSON (title, objectives, steps, assessments) so lessons start structured.',
    code: 'const outline = await kit.outline.generate({ modelReference: "gpt-oss-20b" });',
  },
  {
    title: 'Section Generator',
    description: 'Fills each step with balanced markdown + code locally, respecting token hints and pedagogy notes.',
    code: 'await kit.sections.generate({ outline, sectionNumber: 3 });',
  },
  {
    title: 'Notebook Builder',
    description: 'Stitches outline and sections into a runnable notebook with setup cells, assessments, and troubleshooting.',
    code: 'const notebook = kit.builder.compose({ outline, sections });',
  },
  {
    title: 'Validators',
    description: 'Quality + Colab validators score readability, ensure installs, and auto-fix cells before exporting.',
    code: 'await kit.validate({ notebook, quality: true, colab: true });',
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
            <div className="space-y-7">
              <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-500">
                {heroMeta}
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-alain-blue uppercase tracking-[0.18em]">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-alain-yellow" />
                  AI Manuals for AI Models
                </div>
                <h1 className="font-display text-[42px] leading-[1.05] tracking-tight text-ink-900 md:text-[54px]">
                  AI Manuals for AI Models
                </h1>
                <p className="font-inter text-lg leading-8 text-ink-700 max-w-2xl">
                  Paste a model card and get the runnable lesson in minutes—complete with setup, safe experiments, assessments, and clean exports.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-ink-700 font-inter">
                {heroBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-alain-yellow" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <ButtonLink href="/generate" variant="accent" className="px-6 py-3 shadow-cardHover">
                  Generate Manual
                </ButtonLink>
                <ButtonLink
                  href="https://github.com/AppliedLearningAI/alain-ai-learning-platform"
                  variant="secondary"
                  className="px-6 py-3 font-semibold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Contribute on GitHub
                </ButtonLink>
              </div>
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

      <section className="bg-paper-50">
        <PageContainer maxWidth="wide" paddingY="none" className="py-16 lg:py-20 space-y-10">
          <header className="max-w-3xl space-y-3">
            <h2 className="font-display text-[34px] leading-[1.1] tracking-tight text-ink-900">How ALAIN works</h2>
            <p className="text-base text-ink-600">
              ALAIN-Kit powers the pipeline: outline → sections → notebook build → validation. Every phase is deterministic and runs locally once JSON comes back from the teacher.
            </p>
          </header>
          <div className="grid gap-6 lg:grid-cols-2">
            {timelineSteps.map((step) => (
              <div key={step.title} className="flex flex-col gap-4 rounded-2xl border border-ink-100 border-l-[6px] border-l-alain-blue/80 bg-white p-6 pl-7 shadow-card">
                <div className="space-y-1">
                  <div className="text-sm font-semibold uppercase tracking-wide text-alain-blue/80">{step.title}</div>
                  <p className="text-base text-ink-800 leading-6">{step.description}</p>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-ink-900 text-ink-50 text-xs leading-relaxed p-4">
                  <code>{step.code}</code>
                </pre>
              </div>
            ))}
          </div>
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
