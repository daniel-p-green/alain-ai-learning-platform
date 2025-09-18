# ALAIN Product Requirements Document

## Document Metadata
- **Owner:** Daniel Green
- **Executive Sponsor:** TBD (Applied ML / Model Ops)
- **Last Updated:** 2025-09-17
- **Status:** Executive draft — ready for leadership review

## 0. Executive Summary
- **Problem:** New model releases (OSS + partner) ship faster than actionable walkthroughs. Teams lose 2–3 engineer-days per model reproducing safe setup, experimentation scaffolds, and validation.
- **Solution:** ALAIN converts any model card or spec into a validated, runnable notebook in minutes using an outline-first pipeline hardened across web and CLI touchpoints.
- **Proof:** 60+ notebooks generated during OpenAI Open Model Hackathon, 🥉 at leap.new 2025, end-to-end runs complete in <7 minutes with 94% JSON compliance after auto-repair.
- **Strategic fit:** Accelerates OpenAI’s open model ecosystem, reduces friction for enterprise adoption, and demonstrates best practices for responsible experimentation.
- **Diversity gap:** Hugging Face’s hub now hosts ≈1.86 million models while developer usage remains concentrated—82.1% of Stack Overflow respondents rely on ChatGPT vs. 41.2% on GitHub Copilot—leaving long-tail providers underexposed.[^hf-diversity]
- **Asks:** Resource a six-week rebuild to productionize the pipeline, instrument telemetry, and ship shared SDK/web experiences aligned with OpenAI quality bars.

## 1. Product Overview
ALAIN (Applied Learning AI Notebooks) turns raw model documentation, specs, and community notes into instruction-first manuals. The system orchestrates research ingestion, outline templating, section drafting, notebook assembly, and validation so learners get reproducible labs that work with hosted (Poe), OpenAI-compatible, or fully offline teachers. This PRD captures current behaviour from the codebase and lays out the requirements to rebuild ALAIN for durability, scale, and cross-team reuse.

## 2. Problem, Opportunity & Business Case
### 2.1 Pain Today
- Launch teams lack repeatable “model to manual” workflows, forcing ad-hoc Googled setups and risky copy/paste code.
- Platform teams invest in redundant onboarding docs when swapping inference providers.
- Enterprise customers demand validated, policy-aligned notebooks before green-lighting pilots.
 - Documentation quality is inconsistent across the open ecosystem: model cards often “thin” over generations (≈5,000 characters shorter on average for children vs. parents) and ~30% of derivative models include phrases suggesting auto-generated cards.[^hf-docs]
 - Language and audience bias limits adoption: English dominates (≈75% of models that document any language support) and traits drift toward English support over time, reducing accessibility for global teams.[^hf-languages]
 - Discovery is skewed toward a few incumbents: despite millions of models on Hugging Face, developer usage concentrates around a short list of assistants and IDE copilots, leaving long‑tail providers underexposed and under‑documented.[^hf-diversity]
 - Reproducibility and safety gaps: many guides lack pinned installs, environment checks, or cost/latency visibility; this slows evaluation and increases risk, especially for regulated environments.

### 2.2 Opportunity
- Outline-first prompting + automatic validators already cut manual authoring time by ~80%.
- ALAIN can become the canonical way to showcase OpenAI’s open models, enabling a high-touch DX story without bespoke content.
- Reusable pipeline unlocks partner co-marketing (ship manuals alongside releases) and internal QA (CI runs of notebooks nightly).
- Hugging Face is tracking roughly 1.86 million hosted models with rapidly mutating lineages, yet the Stack Overflow Developer Survey shows generative AI usage clustered around a few incumbents (ChatGPT 82.1%, GitHub Copilot 41.2%, Google Gemini 23.9%). ALAIN can surface high-quality, lower-profile model teams that lack Anthropic- or OpenAI-scale DevRel budgets.[^hf-diversity]
 - Long‑tail uplift: by enforcing a consistent outline → sections → validation contract, ALAIN makes lesser‑known but capable models “legible” and comparable to incumbents, improving their odds of adoption in bake‑offs.
 - Provider‑agnostic by design: the same lesson contract runs across Poe, OpenAI‑compatible endpoints, and local vLLM/Ollama—reducing rewrite costs when platforms change.
 - Safety and compliance built in: validators catch placeholder content, enforce markdown/code balance, and surface Colab readiness—lowering legal and operational risk when publishing tutorials.
 - Education + DevRel leverage: reusable prompts and exports let partner teams ship launch‑day manuals and run workshop content with minimal bespoke effort.
 - By raising documentation quality and exporting portable, provider‑agnostic manuals, ALAIN shifts developer trust and reduces switching costs at the moment developers rely most on API and SDK docs.

### 2.3 Why Now
- Open models strategy needs differentiated tooling that proves safety and reliability.
- Poe, vLLM, and other providers keep API parity; ALAIN demonstrates how to leverage them without retraining teams.
- Hackathon traction + community interest provide momentum; codifying requirements now prevents drift as contributors expand scope.
 - AI tool adoption among developers is mainstream: 62% report currently using AI tools and 76% use or plan to use them this year, with “writing code” the top current use case (≈82%).[^so-usage][^so-tasks] This creates demand for trustworthy, runnable manuals.
 - Documentation pressure is rising while quality thins in the wild; a productized pipeline can raise the floor on clarity and safety for the ecosystem.[^hf-docs]
 - Industry consolidation and acqui‑hire licensing deals concentrate talent and distribution with a few labs. ALAIN focuses on leverage: enablement and portability that help smaller providers compete without training new foundation models.
 - Developers increasingly rely on technical and API/SDK documentation to adopt tools; high‑quality, portable manuals are a timely wedge for long‑tail providers.
 - Trust gap: only ~43% of respondents feel good about AI output accuracy (SO 2024), reinforcing the need for validators and reproducible labs.[^so-accuracy]

### 2.4 Business Impact & KPIs
- **Time-to-first-successful-run:** <10 minutes from model card paste to validated manual (baseline ~45 manual minutes).
- **Generation success rate:** ≥97% notebooks ship without manual fixes (currently 94% with auto-repair; goal +3%).
- **Manual reuse:** ≥50% of generated notebooks exported to Colab/Jupyter within first week of launch.
- **Adoption:** 5 internal partner teams using CLI/SDK by end of rebuild; 10 external partner manuals published per quarter.
- **Support load:** Reduce support escalations around setup by 40% in tracked partner channels.

Additional business framing
 - Cost-savings model: If a team publishes M manuals/quarter and ALAIN saves S engineer‑days per manual versus hand‑authored guides, at a blended rate R the quarterly savings is M × S × R; we’ll track realized S via time‑to‑ship metrics (plan vs. actual) per manual.
 - Long‑tail impact: Track the share of manuals generated for non‑top‑5 assistants/providers and the downstream export/open rates; goal is to increase “diversity share” over time while maintaining validation pass‑rates.
 - Partner leverage: Measure co‑launched manuals per release window and average time‑to‑manual after partner model announcement.

### 2.5 Validation & Experiment Plan (Business Case)
 - Instrument funnel: card‑paste → outline success → section success → validation pass → export. Tie each stage to duration and failure reason.
 - A/B manual publishing: where possible, compare model adoption (exports, repo stars, demo traffic) for releases with ALAIN manuals vs. similar releases without.
 - Diversity scorecard: monthly report of top providers vs. long‑tail manuals generated and exported; annotate outliers with validator outcomes.

### 2.6 Ecosystem Context: Open vs. Closed & Interoperability
- Closed‑source leaders (e.g., OpenAI, Google, Anthropic) offer managed APIs with rapid feature velocity; open‑source communities (e.g., Llama families and thousands of HF Hub models) provide self‑hosting and customization options. ALAIN’s provider‑agnostic contract bridges both paths by keeping manuals portable across endpoints.
- Interoperability is improving: Anthropic open‑sourced the Model Context Protocol (MCP), a standard for connecting assistants to business systems and developer tools, signaling a shift toward portable integrations across vendors.[^mcp]
- Implication for ALAIN: as standards like MCP mature and model diversity grows, the value of outline‑first, validated, provider‑agnostic manuals increases—reducing switching costs and preventing vendor lock‑in while preserving safety checks.

## 3. Goals, Principles & Non-Goals
### 3.1 Goals
1. Ship a deterministic outline → sections → notebook → validator pipeline with recoverable artifacts for every stage.
2. Offer a unified configuration surface across hosted, OpenAI-compatible, and offline/local teachers.
3. Deliver three artifact types per run: `.ipynb`, validation markdown, metrics JSON; expose them in web + CLI.
4. Provide an accessible, trust-building web experience with live preview, light editing, and fallback demos.
5. Expose the pipeline as an SDK/CLI (ALAIN-Kit) with CI-friendly logging, retries, and artifact storage.
6. Instrument first-class observability (metrics, tracing, event logs) tied to tutorial IDs.

### 3.2 Product Principles
- **Instruction-first:** Markdown and pedagogy guide the learner; code serves the instruction.
- **Observable by default:** Every step emits structured logs, metrics, and artifacts.
- **Provider-agnostic:** Swapping inference endpoints never requires reauthoring notebooks.
- **Safe experimentation:** Cells run with explicit guardrails, environment setup, and cost/safety notes.

### 3.3 Non-Goals
- Rich multi-user notebook editing, commenting, or version history.
- Hosting or fine-tuning teacher models; we integrate with external APIs.
- Monetization, billing, or marketplace features.
- Production-grade autoscaling of Encore services beyond pilot loads.

## 4. Target Users & Personas
- **Applied ML Engineers:** Need reproducible manuals to evaluate models quickly; value Colab-ready exports and token budgeting.
- **Developer Relations & Education:** Produce launch content, workshops, and tutorials with consistent quality.
- **Platform & Enablement Teams:** Standardize internal labs across providers; integrate into onboarding portals.
- **Students & Hackathon Builders:** Seek safe, remixable notebooks that work offline.
- **Quality & Safety Reviewers:** Require visibility into generated content, validators, and audit logs.

## 5. Key User Scenarios
1. **Launch Ready Manual:** Paste a Hugging Face model URL, pick difficulty, generate validated notebook, inspect preview, export to Colab.
2. **CI Notebook Refresh:** Nightly CLI run regenerates manuals, writes metrics JSON, flags diffs for reviewer approval.
3. **Provider Swap:** Switch from Poe to local vLLM by updating env vars; regenerated manual highlights runtime-specific hints automatically.
4. **Demo Mode:** During conferences, run fallback web mode with deterministic sample outputs when backend unavailable.
5. **Editorial Review:** Instructional designer edits Markdown/code inline, revalidates, and exports updated notebook + validation report.
6. **Safety Audit:** Reviewer inspects metrics JSON, validator output, and placeholder logs before approving public release.

## 6. Product Scope & Capabilities
### 6.1 Outline-First Creation Pipeline
- Strict JSON prompts with retry/repair loops (`packages/alain-kit/core/outline-generator.ts`, `section-generator.ts`).
- Outline template enforces token budgets, objective counts, ipywidgets requirement (`resources/prompts/.../research.outline.v1.txt`).
- Section generator enforces 800–2,000 token window, placeholder scrubbing, callouts, prerequisite checks, and metrics instrumentation.
- Notebook builder stitches sections, assessments, setup commands, metadata into deterministic `.ipynb` (“Orchestrator” stage).
- Eight pipeline stages surfaced to users (Research Scout → Orchestrator) mirroring internal orchestration.

### 6.2 Notebook Authoring & Preview Experience
- Home page communicates value props, pipeline steps, and deliverables (`apps/web/app/page.tsx`).
- `NotebookViewer` supports inline Markdown/code edits, Pyodide/JS execution, and sanitation controls.
- Preview cards demonstrate quick-start, checklist, and code snippets to build trust pre-generation.
- Accessibility features: skip-to-content, focus states, sanitized Markdown, high-contrast palette.

### 6.3 Multi-Channel Delivery
- **Web (Next.js):** Generation form, provider toggles, research modes, preview, export, fallback UI; Clerk-aware nav (`apps/web/app/layout.tsx`).
- **CLI/SDK (ALAIN-Kit):** Shared pipeline exposed via `npm run alain:cli`, configurable providers, artifact output directories.
- **Backend (Encore):** REST endpoints for research, generation, validation, export, providers catalog.
- **Exports:** Notebook, validation markdown, metrics JSON, `.env.local.example` when missing.

### 6.4 Validation & Quality Gates
- Quality + Colab validators auto-run before export; issues returned to UI/CLI with optional auto-fix (`useGenerateLesson.onAutoFix`).
- Placeholder detection (regex guardrails) prevents incomplete sections shipping.
- Metrics/logging for durations, retries, difficulty, provider tags.
- Manual override surfaces flagged cells requiring human review.

## 7. Functional Requirements
### 7.1 Web Application
- Accept Hugging Face URL, raw text, or local source; parse via `parseHfRef`.
- Difficulty selector (beginner/intermediate/advanced) tunes prompt context.
- Teacher provider toggle (Poe vs OpenAI-compatible) + optional GPT-OSS-120B (env flag).
- Research mode selector (standard/thorough/fallback) updates copy and backend depth.
- Provider + model dropdowns populated from `/api/providers`; error banners on load failure.
- Progress states (`parsing → asking → importing → done`) with granular error detail and retry guidance.
- Preview includes metadata (title, objectives, first step) and model maker info.
- Export flow streams `.ipynb` blob with status tracking, success toast, error fallback.
- Surface environment reminders/snackbars when env vars missing.
- Respect auth context: Clerk nav when `hasClerk`, otherwise public nav.
- Unit + integration coverage for generation form, fallback display, export logic.

### 7.2 CLI & SDK
- Provide CLI entry via `packages/alain-kit-sdk`; documented in root `README.md`.
- Flags: `--model`, `--baseUrl`, `--apiKey`, `--difficulty`, `--maxSections`, `--outDir`, optional `--researchMode`.
- Detect local endpoints (localhost/127.0.0.1) to bypass API key requirement.
- Output artifacts to structured directories with timestamps; include manifest.
- Emit structured logs with stage timings; non-zero exit codes on failure.
- Offer helper commands/tests (`npm run alain:example`, `npm run lint:prompts`).
- Provide TypeScript SDK for embedding pipeline in other services (basic typing, promise-based API).

### 7.3 Backend & Orchestration
- Encore services provide:
  - `/generate/outline`, `/generate/section`, `/generate/notebook`, `/validate`, `/export`, `/providers`.
  - Research fetcher with Hugging Face API + caching.
  - Artifact persistence (local FS + pluggable storage) enabling retries/resume.
- Handle provider auth (Poe headers, OpenAI-compatible keys) uniformly.
- Expose health + metrics endpoints for runtime dashboards.
- Guard against overuse: rate limiting, concurrency caps per provider.

### 7.4 Notebook Artifact Contract
- Required cells: setup (pip installs, ipywidgets), provider config (env var instructions), step-by-step sections with `Step N:` titles, callouts, prerequisites, “Next section” hints.
- Exercises (2–3) with estimated tokens + difficulty; assessments ≥4 MCQs with explanations.
- Summary, next steps, references, target reading time, metrics block.
- Markdown/code ratio within 40–70%; deterministic seeds; no placeholders/ellipsis.
- Embeddable metadata cell (JSON) for downstream analytics.

## 8. Non-Functional Requirements
- **Reliability:** Automatic retries (≥3) for outline/section calls; deterministic repair path for schema fixes.
- **Performance:** Standard mode <6s API roundtrip; thorough mode <12s; full notebook generation <7 minutes end-to-end.
- **Scalability:** Handle concurrent requests from hackathon traffic (target 30 parallel generations); queue/backoff when provider saturated.
- **Observability:** Metrics exported (Prometheus-friendly), structured logs, tutorial IDs correlated across layers.
- **Security & Privacy:** Environment keys client-hidden; notebooks avoid storing secrets; preview execution sandboxed.
- **Accessibility:** WCAG 2.1 AA compliance for web UI; keyboard flows tested.
- **Offline Support:** CLI + web fallback operate with local providers/no API key; prompts warn about reduced validation.

## 9. Architecture & System Design
| Layer | Responsibilities | Representative Assets |
| ----- | ---------------- | --------------------- |
| Web (Next.js) | Marketing, generation workflow, preview, export, auth routing | `apps/web/app/page.tsx`, `features/generate` |
| UI Components | Notebook viewer/editor, cards, layout primitives | `apps/web/components/NotebookViewer.tsx`, `HomeNotebookPreview.tsx` |
| Backend (Encore) | Research ingestion, orchestration, validation, export | `apps/backend/*` |
| ALAIN-Kit Core | Outline/section generators, notebook builder, JSON utils, obs | `packages/alain-kit/core/*.ts` |
| Prompts & Schemas | Outline + section templates, token budgets, schema contracts | `packages/alain-kit/resources/prompts/...` |
| SDK/CLI | CLI entrypoints, artifact writers, validation harness | `packages/alain-kit-sdk`, root scripts |
| Observability | Logging + metrics plumbing | `packages/alain-kit/core/obs.ts`, metrics usage |

**Flow:**
1. User/CLI submits generation request (model, difficulty, provider, research mode).
2. Research fetcher gathers model card/context; outline generator prompts teacher via configured base URL.
3. Section generator iterates outline steps, applying token/quality constraints, logging metrics per section.
4. Notebook builder assembles `.ipynb`, merges metadata, ensures structure requirements.
5. Validators (quality + Colab) execute; auto-fix or flag issues.
6. Artifacts stored, metrics emitted, response returned to web/CLI.

## 10. Data, Telemetry & Tooling
- **Artifacts:** Research cache, outline JSON, per-section JSON, notebook JSON, validation markdown, metrics JSON, generation manifest.
- **Metrics:** `alain_outline_duration_ms`, `alain_section_duration_ms`, `alain_section_generated_total`, `alain_validation_failures_total`, success ratios, provider/difficulty tags.
- **Events:** `trackEvent('alain_section_generated', ...)`, placeholder warnings, export completions, fallback activations.
- **Dashboards:** Grafana/Datadog board for latency, success, fallback usage; alert on failure rate >5% or latency spikes.
- **Developer Tooling:** Prompt lint (`npm run lint:prompts`), notebook validators, regression suites (`tests`, `vitest`, `run_improved_tests.py`), smoke scripts for CLI and web.
- **Data Governance:** Redact API keys from logs; optional artifact retention policy (default 30 days).

## 11. Success Metrics & Measurement Plan
- Instrument web + CLI to report generation start/end, success, retries.
- Store metrics JSON in analytics bucket; nightly job aggregates reading time, markdown ratio, validator outcomes.
- Track export events to infer manual reuse; correlate with support tickets to measure issue reduction.
- Add Qualtrics-style NPS prompt post-export for qualitative feedback.

## 12. Release Plan & Milestones
1. **Week 1 – Discovery & Stabilization:** Audit prompts, schemas, provider caps; document baseline telemetry; stand up observability dashboard.
2. **Weeks 2–3 – Pipeline Hardening:** Implement deterministic retry/repair, artifact persistence, provider health checks, placeholder enforcement.
3. **Weeks 3–4 – Web & UX Refresh:** Ship new generation form, provider selection, fallback messaging, accessibility polish, preview enhancements.
4. **Week 4 – CLI/SDK Parity:** Align flags + outputs, add manifest + analytics hooks, publish SDK docs/examples.
5. **Week 5 – Validation & QA:** Expand test matrix (quality + Colab validators), add regression suite, dry-run with internal partner teams.
6. **Week 6 – Launch Prep:** Finalize docs, publish sample notebooks, run communications plan, define post-launch monitoring + support rotation.

## 13. Risks & Mitigations
- **Provider Instability (Poe/local).** Mitigate with retries, circuit breakers, user-facing fallbacks, and cached outlines.
- **JSON Schema Drift.** Enforce schema validation + prompt linting in CI; archive malformed responses for manual repair.
- **Notebook Execution Safety.** Continue sandboxed preview execution, require explicit environment setup, auto-flag long-running cells.
- **Latency/Cost Spikes.** Offer standard vs thorough research modes; expose token budgeting; support offline/local teachers.
- **Observability Gaps.** Block releases if telemetry endpoints regress; include “metrics smoke test” in CI.
- **Contributor Drift.** Provide documented contracts, lint rules, and governance for prompt changes.

## 14. Open Questions
- When should GPT-OSS-120B graduate from feature flag to default option? Criteria: latency, cost, JSON compliance.
- Do we need centralized artifact storage (S3/GCS + metadata) for team sharing, or is local FS sufficient near-term?
- What auth roadmap supports enterprise teams (Clerk + SSO, token-based API, offline editors)?
- How do we distribute community-remixed notebooks (gallery, API, git-backed hub)?
- Should we invest in human-in-the-loop review workflows (diff UI, validator suggestions) during this phase?

## 15. Out of Scope
- Payment integration, marketplace listings, or revenue features.
- Hosting pre-generated notebook catalogs beyond lightweight previews.
- Collaborative editing (multi-user real-time, comments, permissions).
- Automatic dataset/model downloads beyond quickstart commands and provider setup.

[^hf-diversity]: Benjamin Laufer, Hamidah Oderinwale, and Jon Kleinberg, “Anatomy of a Machine Learning Ecosystem: 2 Million Models on Hugging Face,” arXiv:2508.06811 (2025). Stack Overflow, “AI Search and Developer Tools” chart in the 2024 Developer Survey (46,208 responses), https://survey.stackoverflow.co/2024/technology#most-popular-technologies-ai-search-dev.
[^hf-docs]: Laufer et al., arXiv:2508.06811 — documentation “thins” across generations (≈5,000‑character average drop for child model cards vs. parents) and ≈30% of derivatives include “automatically generated” phrasing.
[^hf-languages]: Laufer et al., arXiv:2508.06811 — English is the dominant documented language (≈75% among models that list any language) and language traits drift toward English over generations.
[^so-usage]: Stack Overflow 2024 Developer Survey → AI section, “AI tools in the development process” (62% currently use; 76% use or plan): https://survey.stackoverflow.co/2024/ai#sentiment-and-usage.
[^so-tasks]: Stack Overflow 2024 Developer Survey → Technology section, “AI Search and Developer Tools—Currently Using” (e.g., Writing code ≈82%): https://survey.stackoverflow.co/2024/technology#most-popular-technologies-ai-search-dev.
[^so-accuracy]: Stack Overflow 2024 Developer Survey → AI section, “Accuracy of AI tools” (43% feel good about AI accuracy; 31% skeptical): https://survey.stackoverflow.co/2024/ai#developer-tools.
[^mcp]: Anthropic, “Introducing the Model Context Protocol,” Nov 2024 — MCP is an open standard for connecting AI assistants to data sources and developer tools: https://www.anthropic.com/news/model-context-protocol.
