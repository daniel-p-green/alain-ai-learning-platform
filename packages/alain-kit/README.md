# ALAIN-Kit

Applied Learning AI Notebooks (ALAIN) – Kit edition. This package orchestrates the full notebook generation pipeline that powers the SDK and CLI in `packages/alain-kit-sdk`.

## TL;DR

* Outline → section fill → notebook build happens locally – the model only produces small JSON payloads.
* Built-in quality and Colab validators enforce structure, pinned installs, readability, and environment safety.
* Optional Gemini (via Poe) review rewrites problematic cells and helps reach “Colab ✅” automatically.
* Outputs include the notebook, a markdown validation report, and structured metrics (quality, readability, timings).

## Versioning

* **v0.2.0 – Tooling Orchestrator (default)**: the current release that wires the outline/section pipeline through the new tool runtime (`core/tool-runtime.ts`, `core/notebook-tool-controller.ts`, `core/tool-orchestrator.ts`). Prompts and harmony files for this version continue to live under `resources/prompts/alain-kit/`.
* **v0.1.0 – Text Prompt Baseline**: the original prompt-only workflow (outline + section JSON without tool calling). The preserved prompt set lives in `resources/prompts/alain-kit/versions/v0.1-text/` so you can diff it against the tooling variant.

Both versions share the same validation and notebook assembly layers; the distinction is purely in orchestration and prompt strategy.

## Repository Layout

```
packages/alain-kit/
├── core/                    # Generation primitives
│   ├── outline-generator.ts # Calls provider for OutlineJSON
│   ├── section-generator.ts # Calls provider for StepFillJSON
│   └── notebook-builder.ts  # Assembles final ipynb (env cells, setup, assessments)
├── validation/              # Enforcement + integrations
│   ├── quality-validator.ts # Notebook quality score + readability gates
│   ├── colab-validator.ts   # Colab fixer, optional Gemini assistance
│   └── integration.ts       # Pipeline entry (ALAINKit)
├── examples/                # Minimal usage samples
└── README.md                # You are here
```

### Pipeline at a Glance

1. **Outline** – `OutlineGenerator` requests OutlineJSON (title, objectives, steps, references). Strict JSON mode; auto retry on “Thinking…” chatter.
2. **Sections** – `SectionGenerator` requests StepFillJSON for each outline item, respecting token budgets and structure hints.
3. **Assembly** – `NotebookBuilder` combines outline + sections, adds environment detection, `%pip` setup cells, `.env` helpers, assessments, and troubleshooting notes.
4. **QA Gate** – Lightweight structural checks (objectives, section coverage, placeholders) short-circuit obvious failures before validation.
5. **Validation** – `QualityValidator` and `ColabValidator` score the notebook, patch issues, and supply a human-readable report.

## Key Features

| Feature | Details |
| --- | --- |
| Outline-first contract | Providers only emit JSON; notebook assembly is deterministic and local. |
| Quality standards | Gate on objectives, steps, exercises, references, readability, and token budgets. Target quality score ≥ 90. |
| Colab compatibility | Automatic `%pip` installs, environment detection, `.env` management. Gemini review (optional) rewrites problematic cells. |
| Metrics | `alain-metrics-*.json` includes quality score, readability, markdown ratio, section timings, and phase latencies. |

## Programmatic Usage

Import `ALAINKit` from the SDK (`packages/alain-kit-sdk`). Example:

```ts
import { ALAINKit } from 'alain-kit-sdk';

const kit = new ALAINKit({ baseUrl: process.env.OPENAI_BASE_URL });
const res = await kit.generateNotebook({
  modelReference: 'gpt-oss-20b',
  apiKey: process.env.POE_API_KEY,
  difficulty: 'beginner',
  maxSections: 6,
  customPrompt: {
    title: 'Intro to gpt-oss-20b',
    description: 'Beginner notebook',
    topics: ['environment setup', 'text generation']
  }
});

if (!res.success) throw new Error(res.validationReport);

console.log(res.notebook);           // ipynb JSON
console.log(res.validationReport);   // Markdown summary
console.log(res.phaseTimings);       // Outline/section/build/quality/colab timings
```

### Result Object

* `notebook` – fully assembled `.ipynb` JSON (ready to write to disk).
* `qualityScore` – numeric score from `quality-validator.ts`.
* `colabCompatible` – boolean after fixes.
* `validationReport` – markdown summary (same text written to `alain-validation-*.md`).
* `phaseTimings` – optional timings (ms) for outline, sections, build, quality, colab, total.

## CLI Usage

The CLI lives in `packages/alain-kit-sdk`. Common commands:

```bash
# Install dependencies
npm install

# Run a generation (outputs to ./output)
POE_API_KEY=... \
ALAIN_COLAB_MODEL=gemini-2.5-pro \
npm --workspace packages/alain-kit-sdk run cli -- \
  --model gpt-oss-20b \
  --baseUrl https://api.poe.com \
  --maxSections 6 \
  --outDir ./output
```

CLI options (subset):

| Flag | Description | Default |
| --- | --- | --- |
| `--model` | Model reference (`gpt-oss-20b`, `gpt-oss-120b`, etc.) | `gpt-oss-20b` |
| `--apiKey` | Provider API key | falls back to `POE_API_KEY` env |
| `--baseUrl` | Provider base URL (no `/v1`) | env `OPENAI_BASE_URL` |
| `--difficulty` | `beginner` / `intermediate` / `advanced` | `beginner` |
| `--maxSections` | Sections to generate | `6` |
| `--sectionTokens` | Hint for max tokens per section | internal default (~1100) |
| `--remix` | Path to existing `.ipynb` for remix flow | off |

CLI outputs (per run):

* `*-ALAIN.ipynb` – notebook.
* `alain-validation-*.md` – quality+Colab summary.
* `alain-metrics-*.json` – numeric metrics (quality, readability, timings).

### Gemini Review (Optional)

Set `ALAIN_COLAB_MODEL=<model>` (e.g., `gemini-2.5-pro`) to let `ColabValidator` call Gemini via Poe:

* For every auto-fixable issue, Gemini receives the code cell and returns a JSON `{ "fixed": "..." }` snippet.
* After applying patches, the validator re-runs detection. If issues remain, they’re included in the report.
* Disable by unsetting `ALAIN_COLAB_MODEL`; the validator will rely solely on regex-based fixes.

## Environment & Configuration

| Variable | Purpose |
| --- | --- |
| `POE_API_KEY` | Poe token (also used as fallback for `OPENAI_API_KEY`). |
| `OPENAI_API_KEY` | OpenAI-compatible key (local/self-hosted). |
| `OPENAI_BASE_URL` | Base URL (no `/v1`; e.g., `https://api.poe.com`). |
| `ALAIN_COLAB_MODEL` | Enable Gemini review (`gemini-2.5-pro`, etc.). |
| `ALAIN_COLAB_BASE` | Override base URL for Gemini (defaults to `OPENAI_BASE_URL` or Poe). |
| `ALAIN_COLAB_MAX_ISSUES` | Allow up to N critical issues before failing (default `0`). |
| `ALAIN_CONCURRENCY` | Section fill concurrency (default 1 remote / 2 local). |
| `ALAIN_CHECKPOINT_DIR` | Persistent checkpoints for section JSON (default `/tmp/alain-kit-<timestamp>`). |

## Notebook Builder Highlights

* Environment Detection cell (`IN_COLAB` flag, widget enablement).
* `.env` helper cell – loads `.env.local` / `.env`, prompts for missing keys, writes `.env.local` (chmod 600) with escaped values.
* Provider setup cell – maps `POE_API_KEY` → `OPENAI_API_KEY`, installs `openai>=1.34.0` using `%pip` in Colab.
* Setup utilities – pinned installs, reproducibility seeds, troubleshooting tips.
* Assessments – `ipywidgets`-based MCQs plus summary and next steps.

## Validators

### QA Gate

`validation/qa-gate.ts` performs a deterministic, <1ms sanity pass before launching the heavier validators. It checks that:

- the outline has a title, steps, setup details, and at least one exercise;
- every outline step has a generated section with meaningful markdown (≥800 chars) and at least one code cell; and
- no TODO/TBD/FIXME placeholders are left in the generated content.

If a requirement is missing the pipeline fails fast; structural warnings (e.g., short markdown) are bubbled back so the caller can regenerate sections before invoking the more expensive quality tooling.

* **Quality** – ensures objectives, prerequisites, setup, 6–12 steps, exercises, summary, references; enforces markdown ratio, readability (Flesch-Kincaid target 14–20), step token limits.
* **Colab** – pattern-based fixes for `%pip`, `.env` guidance, device mapping; optional Gemini rewrites; reports fix counts and compatibility.
* Both validators write to `alain-validation-*.md` and augment metrics JSON.

## Customization Tips

* Adjust prompt tone / section targets via `customPrompt` when calling `generateNotebook`.
* Override `notebook-builder.ts` templates to add organization-specific onboarding or analytics.
* Use `ALAIN_CONCURRENCY` for faster local runs (only recommended when hitting self-hosted models).
* Add additional Colab patterns by extending `ERROR_PATTERNS` in `validation/colab-validator.ts`.

## Development Notes

* TypeScript/ESM project (Node 18+). Install dependencies from repo root with `npm install`.
* Unit-like checks live under `packages/alain-kit/examples/` (see `tinyllama-example.ts`).
* Tests for the SDK/CLI are in `packages/alain-kit-sdk`; run `npm --workspace packages/alain-kit-sdk test`.
* When modifying validators or builder templates, rerun the CLI and open the notebook in Colab to confirm “Colab ✅”.

---

Questions or bug reports? Open an issue in the main repository and mention `alain-kit`.
