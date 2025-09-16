# ALAIN Web UI — MVP Requirements (P0)

Status: Draft (2025‑09‑13)
Scope: Web app P0 only. Objective: ship a polished demo path without regressions.

## User Stories (P0)
- As a visitor, I can open the Home at `/` and navigate to Generate/Tutorials clearly.
- As a user, I can paste a Hugging Face model link on Generate and see a preview within ~12s, then export a `.ipynb` to Colab.
- If local models are detected, Generate defaults to Local; otherwise defaults to Hugging Face.
- I am never forced to choose advanced toggles (no fallback checkbox); research mode is Standard/Thorough only.
- I can browse Tutorials and open a detail view; I can copy a sample cURL/request.
- In Settings, I can see environment status (hosted/local) and run smoke tests.

## Acceptance Criteria

### New Shell & Navigation
- App shell exists under `apps/web/app/layout.tsx`.
- No feature flags for Home; `/` is the canonical landing page.

### Generate (HF/Local/Text)
- Tabs: Hugging Face | Local | Text.
- Research selector: Standard | Thorough. No fallback checkbox anywhere on the page.
- “Use Example (Hosted)” and “Use Example (Local)” buttons exist and work.
- On success: a preview panel appears; “Open tutorial” and “Export to Colab” function.
- Error handling: JSON and non‑JSON errors normalize to `{message, details?}`; visible inline as an alert; no stack traces leaked.

### Tutorials
- List page renders at least 6 seed cards with provider/model badges.
- Detail page displays Steps | Requests | Assessments tabs; “Copy cURL” works.

### Settings
- Environment status card shows Hosted vs Local with basic details.
- Smoke tests section has at least one working test (e.g., providers listing) with clear pass/fail UI.

### Accessibility & Performance
- Focus outlines visible on interactive elements, skip link present.
- Lighthouse: no critical a11y violations; TTI reasonable on demo.

## Non‑Goals (P0)
- Notebook Grader, Remix pipeline, Model Packs UI (may be stubbed but not required).
- Community submissions, analytics, SEO tuning.

## Test Plan (P0)

### Unit / Module (Vitest)
- Zod schema validation for API responses (providers, generate, export) — valid/invalid cases.
- Error normalization helper converts Response (JSON/text) into `{message, details?}`.

### Integration (Playwright — later in P1)
- HF generate happy path → preview → export file appears.
- Tutorials open detail; copy cURL works.

## Rollout
- Land behind feature flags. No change to existing pages until P0 complete.
