# ALAIN Product Spec

> Generated from specs/spec.json. Do not edit directly.

## Overview
ALAIN turns Hugging Face models into validated lessons, research briefs, and adaptive tutorials powered by GPT-OSS teacher agents.

## Architecture
This section is not tracked in spec.json; see code references in docs/AGENTS.md and repository layout.

## Feature Spec
### feat-lesson-generation — Lesson Generation & Repair
- goal: Generate schema-valid lessons from Hugging Face model references or raw briefs, repairing outputs when validation fails.
- owner: [TBD]
- status_0_100: 75
- acceptance_criteria:
  - POST /lessons/generate returns lesson JSON that passes spec/lesson.schema.json for valid Hugging Face URLs.
  - Failures surface structured validation errors or trigger repair fallback before responding.
  - Successful runs persist lesson artifacts for tutorial import and expose preview metadata in the UI.
- evidence:
  - apps/backend/execution/lesson-generator.ts
  - apps/backend/execution/repair.ts
  - apps/web/features/generate/GeneratePage.tsx
  - apps/backend/execution/lesson-generator.test.ts

### feat-model-research — Model Research Pipeline
- goal: Collect benchmarks, capability summaries, and configuration tips for Hugging Face models and surface them in the research UI.
- owner: [TBD]
- status_0_100: 50
- acceptance_criteria:
  - POST /research/run writes research-summary.v2.json and related artifacts under resources/content/research.
  - Research UI lists completed artifacts, displays summary metrics, and handles error messaging.
  - Offline cache flag reuses downloaded assets without repeated network calls.
- evidence:
  - apps/backend/research/api.ts
  - apps/web/features/research/ResearchPage.tsx
  - resources/content/research/openai

### feat-tutorial-catalog — Tutorial Catalog & Progress
- goal: Manage generated lessons as tutorials with assessments, publication controls, and learner progress tracking.
- owner: [TBD]
- status_0_100: 60
- acceptance_criteria:
  - Tutorial CRUD endpoints validate payloads before persisting to Encore SQL.
  - Assessments API stores responses per user and returns correctness with explanations.
  - Tutorial UI renders persisted steps and syncs progress updates to the backend.
- evidence:
  - apps/backend/tutorials/create.ts
  - apps/backend/assessments/api.ts
  - apps/backend/progress/update.ts
  - apps/web/app/tutorials/page.tsx

### feat-content-adaptation — Adaptive Content
- goal: Adapt lesson copy in response to learner performance scores using GPT-OSS teacher routing.
- owner: [TBD]
- status_0_100: 60
- acceptance_criteria:
  - POST /adapt validates inputs, enforces rate limits, and calls teacherGenerate with task=content_adaptation.
  - Adaptation responses return markdown-only content ready for inline replacement.
  - Errors include actionable messages covering auth, rate limits, and validation issues.
- evidence:
  - apps/backend/execution/adapt.ts
  - apps/backend/execution/adapt.test.ts
  - apps/backend/execution/teacher.ts

### feat-provider-config — Provider Configuration
- goal: Configure GPT-OSS providers, run smoke tests, and enforce environment validation for backend execution.
- owner: [TBD]
- status_0_100: 50
- acceptance_criteria:
  - Settings UI persists provider metadata and prompt preferences to local storage.
  - Smoke test actions hit backend routes and store last status + error per provider.
  - validateBackendEnv logs warnings or throws when provider prerequisites are missing.
- evidence:
  - apps/web/features/onboarding-settings/useSettings.ts
  - apps/backend/config/env.ts
  - apps/backend/execution/setup.ts

## Non-goals
- Execute arbitrary user code beyond structured chat completions.
- Ship first-class integrations for non GPT-OSS providers.
- Automate publication to external LMS platforms.
- Support multi-user real-time collaboration in the authoring UI.

## Risks
- Provider rate limits or outages can halt lesson generation and research flows.
- Missing CI coverage leaves regressions undetected across orchestration endpoints.
- Upstream Hugging Face API changes may break research scraping assumptions.
- Encore streaming limitations push long-lived requests onto the Next.js proxy layer.

## Open Questions
- Who is accountable for updating teacher prompts as GPT-OSS releases evolve?
- When will GPT-OSS-120B be enabled by default and how are costs tracked?
- What persistence layer should store catalog artifacts for production tenants?
- How will provider credentials be rotated or vaulted for shared deployments?

## Glossary
See docs/AGENTS.md for agent terminology.

