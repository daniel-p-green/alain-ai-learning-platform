# ALAIN AI Learning Platform — File Structure (current)

This document reflects the simplified structure and public routes in the current product. Legacy pages from earlier iterations have been removed or redirected.

## Monorepo layout

```text
alain-ai-learning-platform/
├── alain-kit/           # Core notebook generation library (TypeScript)
│   └── core/            # notebook-builder.ts, outline-generator.ts, section-generator.ts
├── alain-kit-sdk/       # SDK + small CLI/examples (alain-kit CLI)
├── backend/             # API services, catalog, execution, research
├── content/             # Static content used by the app/catalog
├── scripts/             # Dev/test/utility scripts
└── web/                 # Next.js app (public UI)
```

## Web app (Next.js)

```text
web/
├── app/
│   ├── page.tsx                 # Home (/)
│   ├── generate/page.tsx        # Generate Manual (/generate)
│   ├── notebooks/page.tsx       # Library index (/notebooks)
│   ├── notebooks/[id]/page.tsx  # Detail (/notebooks/[id])
│   ├── notebooks/featured/page.tsx
│   ├── tutorials/[id]/page.tsx  # Internal manual view (/tutorials/[id])
│   ├── lmstudio/page.tsx        # LM Studio helper (/lmstudio)
│   ├── research/page.tsx        # Labs: Research (hidden from nav; reachable)
│   ├── stream/page.tsx          # Labs: streaming demo (hidden from nav)
│   ├── my/notebooks/page.tsx    # Gated: user library (/my/notebooks)
│   ├── admin/...                # Gated admin pages
│   └── lessons/page.tsx         # Catalog list (legacy noun; UI uses “Manuals”)
├── components/                  # UI components (NavBar, Footer, PreviewPanel, etc.)
├── features/
│   └── generate/GeneratePage.tsx  # Generate flow (client component)
├── lib/                         # Client helpers (api.ts, schemas.ts, notebookExport.ts)
├── middleware.ts                # Public vs gated routes (Clerk)
├── next.config.js               # Redirects from legacy routes
└── e2e/                         # Playwright tests (Home/Generate/Footer)
```

### Public routes (demo)
- `/` Home
- `/generate` Generate Manual
- `/notebooks`, `/notebooks/[id]`, `/notebooks/featured`
- `/tutorials/[id]` (internal manual view)
- `/lmstudio`, `/research` (labs; hidden from nav)

Gated: `/admin/*`, `/my/*`, editing, uploads.

### Redirects (next.config.js)
- `/v1/generate` → `/generate`
- `/hackathon-notes/generate` → `/generate`
- `/explore` and `/explore/*` → `/notebooks`
- `/blueprint` → `/`

### Middleware (middleware.ts)
- Core pages are public for demo; admin and user‑specific routes are protected.

## Terminology
- “Manual(s)” — primary user‑facing artifact in the UI.
- “Notebook” — export format (.ipynb) and library term.
- “Lesson/Tutorial” — legacy/internal nouns; UI shows “Manual(s)”.

## Core generation (alain-kit/core)
- `notebook-builder.ts` — assembles the final notebook (title, objectives, setup, sections, assessments, troubleshooting).
- `outline-generator.ts` — produces structured outlines.
- `section-generator.ts` — generates section content.

Sidecar manifest
- Every exported notebook bundle includes a sidecar JSON named `<notebook>.alain.json` with provenance and integrity info (schemaVersion, generatedAt, title, nbSha256, and a copy of the embedded `metadata.alain`).
- Notebooks also embed a minimal `metadata.alain` block for self‑description.

### Provider consistency (Poe vs OpenAI‑compatible)
- Both providers use the same Chat Completions request shape.
- CLI switches provider via `--baseUrl` (e.g., Poe: `https://api.poe.com`).
- Model is passed consistently as `--model`.

### Generation workflow parity (CLI)
- Pipeline: Outline → Sections → Build → Validate (quality + Colab).
- Checkpoint/resume: set `ALAIN_CHECKPOINT_DIR=/path` to resume section fills across runs.
- Concurrency: control with `ALAIN_CONCURRENCY` (default 2 local, 1 remote).

### Streaming note
- CLI/integration uses non‑streaming requests; web path offers SSE streaming.

## Removed/hidden (legacy)
- Removed: `web/app/explore/*` pages (redirected to `/notebooks`).
- Removed from nav: Labs pages (e.g., Research). Routes remain reachable.
- Removed: legacy group segment `web/app/(app)`.
- Removed: `web/app/blueprint` (now redirected to `/`).
- Deprecated (not used by CLI or core): `alain-ai-learning-platform/alain-kit-clean/` (legacy test outputs only).

## CLI quickstart (alain-kit-sdk)
- One‑off example:
  - `npx -y tsx alain-ai-learning-platform/alain-kit-sdk/examples/usage-example.ts`
- CLI with Poe:
  - `alain-ai-learning-platform/.env` should include `POE_API_KEY` and `OPENAI_BASE_URL=https://api.poe.com/v1` (or pass `--baseUrl https://api.poe.com`).
  - `npx -y tsx alain-ai-learning-platform/alain-kit-sdk/bin/alain-kit.ts --model gpt-oss-20b --baseUrl https://api.poe.com --maxSections 6 --outDir ./output`
- Resume & concurrency:
  - `ALAIN_CHECKPOINT_DIR=/tmp/alain-run ALAIN_CONCURRENCY=2 npx -y tsx ...`

## Dev quickstart
- Dev: `cd web && npm run dev`
- Build: `cd web && npm run build`
- E2E: `cd web && npx playwright install && npm run test:e2e`
