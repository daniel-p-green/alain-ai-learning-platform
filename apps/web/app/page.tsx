import Image from "next/image";
import HomeNotebookPreview from "@/components/HomeNotebookPreview";
import { ButtonLink } from "@/components/ButtonLink";
import HFQuickOpen from "@/components/HFQuickOpen";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const heroHighlights = [
  {
    eyebrow: "Outline-first pipeline",
    heading: "Keep every stage observable",
    body: "Research Scout, Lesson Architect, and Outline Builder lock model context into deterministic JSON before a single section is drafted.",
    bullets: [
      "Replay or tweak any stage without losing downstream work.",
      "Artifacts stay versioned so handoffs include exact prompts and refs.",
    ],
  },
  {
    eyebrow: "Validators + repairs",
    heading: "Ship notebooks reviewers trust",
    body: "Semantic Reviewer and Quality & Colab Fixer catch placeholders, markdown/code drift, and runtime issues before anything ships.",
    bullets: [
      "Auto-repair paths keep JSON on schema and surface retry history.",
      "Validation summaries highlight required manual follow-ups.",
    ],
  },
  {
    eyebrow: "Provider choice",
    heading: "Switch runtimes without rewriting",
    body: "ALAIN works with Poe, OpenAI-compatible gateways, and local Ollama or vLLM so the same lesson contract follows your deployment.",
    bullets: [
      "Environment instructions ship inside each generated notebook.",
      "Metrics + metadata blocks keep CI, Colab, and launch teams aligned.",
    ],
  },
];

const pipelineStages = [
  {
    title: "Research Scout",
    description: "Digest cards, specs, and community notes into a structured brief you can reuse.",
  },
  {
    title: "Lesson Architect",
    description: "Define learners, objectives, and assessments so downstream stages stay aligned.",
  },
  {
    title: "Outline Builder",
    description: "Capture titles, references, and sequenced steps in deterministic outline JSON.",
  },
  {
    title: "Section Scribe",
    description: "Expand each step into balanced markdown, runnable code, and reproducibility callouts.",
  },
  {
    title: "Classroom Monitor",
    description: "Catch placeholders, missing next steps, or uneven pacing before reviewers ever look.",
  },
  {
    title: "Semantic Reviewer",
    description: "Audit clarity, terminology, and completeness with targeted repair notes.",
  },
  {
    title: "Quality & Colab Fixer",
    description: "Apply Colab runtime fixes automatically and capture expected runtimes for handoff.",
  },
  {
    title: "Orchestrator",
    description: "Assemble the notebook, validation summary, and artifacts so you can export with confidence.",
  },
];

const providerCards = [
  {
    name: "Poe (default)",
    summary: "Fastest path to GPT-OSS teachers—just add `POE_API_KEY`.",
    steps: ["Set `POE_API_KEY` in `.env`.", "Run `npm run dev:hosted` or CLI `--baseUrl https://api.poe.com`."],
  },
  {
    name: "OpenAI-compatible",
    summary: "Point at existing enterprise infra and reuse your gateway policies.",
    steps: ["Provide `OPENAI_BASE_URL` and `OPENAI_API_KEY`.", "Web + CLI share the same config automatically."],
  },
  {
    name: "Local (Ollama / vLLM)",
    summary: "Keep lessons fully offline with the same prompts and validations.",
    steps: ["Expose `http://localhost:11434` or your vLLM endpoint.", "Skip `--apiKey`; notebooks stay local-first."],
  },
];

export const metadata = {
  title: "ALAIN · Home",
  description: "AI Manuals for AI Models. Generate step-by-step, runnable guides you can trust.",
};

export default function HomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Applied learning pipeline"
        headline="Ship runnable AI manuals in minutes"
        description="Paste a model card, pick a teacher, and let ALAIN assemble outline JSON, runnable sections, and validators so launch and enablement teams stay in lockstep."
        primaryAction={<ButtonLink href="/generate" variant="primary">Get started</ButtonLink>}
        secondaryAction={<ButtonLink href="#pipeline" variant="secondary">Explore the pipeline</ButtonLink>}
        className="bg-white"
        media={
          <div className="relative flex items-center justify-center rounded-2xl border border-border/70 bg-card p-6 shadow-md">
            <Image
              src="/hero/ALAIN-figure-hero_brand-colors.svg"
              alt="An ALAIN manual illustration"
              priority
              width={520}
              height={360}
              className="h-auto w-full max-w-[420px]"
            />
          </div>
        }
      />

      <section id="preview">
        <PageContainer className="py-12">
          <div className="mb-8">
            <h3 className="mb-2 text-display-3 font-semibold">Paste a Hugging Face link</h3>
            <p className="mb-3 text-sm text-muted-foreground">Get started with any model by pasting its Hugging Face repo (owner/model) or full URL.</p>
            <HFQuickOpen suggestions={[
              "openai/gpt-oss-20b",
              "openai/gpt-oss-120b",
              "meta-llama/Meta-Llama-3.1-8B-Instruct",
              "qwen/Qwen2.5-7B-Instruct",
              "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
            ]} />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {heroHighlights.map((item) => (
              <Card
                key={item.heading}
                className="h-full border border-primary/10 bg-card shadow-md"
              >
                <CardHeader className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                    {item.eyebrow}
                  </span>
                  <CardTitle className="text-lg text-foreground">{item.heading}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{item.body}</p>
                  <ul className="space-y-2">
                    {item.bullets?.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="bg-muted/40">
        <PageContainer className="py-16 space-y-10" maxWidth="wide">
          <header className="max-w-3xl space-y-4">
            <h2 className="text-display-2 font-semibold text-foreground">Preview the notebook before export</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              ALAIN assembles markdown, runnable cells, validators, and analytics metadata before you ever download the `.ipynb`. Review it, edit it, or rerun any stage without losing the thread.
            </p>
          </header>
          <HomeNotebookPreview />
        </PageContainer>
      </section>

      <section id="pipeline">
        <PageContainer className="py-16 space-y-10" maxWidth="wide">
          <header className="max-w-3xl space-y-4">
            <h2 className="text-display-2 font-semibold text-foreground">How ALAIN builds a manual</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Eight observable stages move a messy model card into a reviewed lesson. Every checkpoint stores artifacts and timings so you can replay just the part that needs love.
            </p>
          </header>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pipelineStages.map((stage, index) => (
              <Card key={stage.title} className="h-full border-dashed">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{stage.title}</CardTitle>
                  <span className="text-caption font-semibold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="providers" className="bg-muted/20">
        <PageContainer className="py-16 space-y-8" maxWidth="wide">
          <header className="max-w-3xl space-y-3">
            <h2 className="text-display-2 font-semibold text-foreground">Run it anywhere</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Swap teachers and runtimes without rewriting your docs. The same prompts and validators travel from hosted Poe to OpenAI-compatible APIs to local Ollama or vLLM runs.
            </p>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
            {providerCards.map((card) => (
              <Card key={card.name} className="h-full">
                <CardHeader>
                  <CardTitle>{card.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{card.summary}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {card.steps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden="true" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
