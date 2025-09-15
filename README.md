<div align="center">

  <img src="web/public/brand/ALAIN_logo_primary_blue-bg.svg" alt="ALAIN logo" width="420" />

  <br/>
  <br/>

  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://openai.devpost.com"><img src="https://img.shields.io/badge/Devpost-OpenAI_Hackathon_Submission-0a0?logo=devpost" alt="Devpost: OpenAI Hackathon Submission"></a>
  <a href="https://huggingface.co/openai/gpt-oss-20b"><img src="https://img.shields.io/badge/Teacher-GPT--OSS--20B-4b8" alt="Teacher: GPT-OSS-20B"></a>
  <a href="https://developer.poe.com/server-bots"><img src="https://img.shields.io/badge/Providers-Poe_%7C_OpenAI--compatible-795" alt="Providers: Poe | OpenAI-compatible"></a>
  <a href="web/docs/OPERATIONS.md#execution"><img src="https://img.shields.io/badge/Mode-Offline_Supported-2aa" alt="Offline Supported"></a>

  <br/>
  <br/>
  <p><strong>AI manuals for AI models.</strong></p>
  <p>Paste any model reference → get a runnable, graded lab.</p>

</div>

# ALAIN — Applied Learning AI Notebooks

Make every model teach itself.

ALAIN turns a model card or reference into a guided, runnable lesson with clear steps, quick checks, and an export to Colab/Jupyter. Use hosted providers or run fully local with the same request shape.

---

## Quick Links

- Live Demo: <https://alain-ruddy.vercel.app>
- Try Now: <https://alain-ruddy.vercel.app/generate>
 - Developer Guide: `web/docs/DEVELOPER_GUIDE.md`
 - ALAIN‑Kit SDK (CLI + examples): `alain-ai-learning-platform/alain-kit-sdk`
 - One‑command example: `npm run alain:example`
 - One‑command CLI: `npm run alain:cli -- --model gpt-oss-20b --apiKey $POE_API_KEY`
   - Tip: when using Poe, pass `--baseUrl https://api.poe.com` (no trailing `/v1`). The SDK appends `/v1/chat/completions` automatically.
- Devpost Write‑Up: `hackathon-notes/DEVPOST-Submission.md`
- Hackathon: <https://openai.devpost.com>

---

## What Is ALAIN?

ALAIN turns a model reference into an interactive tutorial that teaches setup, safe usage, and best practices. It generates a lesson you can run in‑browser and export to a notebook — no heavy backend required.

### Why ALAIN

- Paste a model link → get a guided, runnable lesson.
- Works online or fully local via OpenAI‑compatible endpoints (e.g., Ollama, LM Studio).
- In‑browser execution for Python (Pyodide) and JS/TS (Web Worker).
- One‑click export to Jupyter/Colab for sharing and grading.

### Inspiration

Docs are passive, scattered, and often not runnable. New models drop weekly but “hello world” still takes hours. ALAIN makes models learnable in minutes by turning any reference (Hugging Face, local, hosted) into a step‑by‑step, graded lesson you can actually run.

---

## Try It In 2 Minutes

1) Open the demo and pick “From Text” → <https://alain-ruddy.vercel.app/generate>
2) Paste a model (e.g., <https://huggingface.co/openai/gpt-oss-20b>) and click Generate
3) Open the tutorial, run a step, Export to Colab

Tip: On Vercel or web‑only use, enable “Force fallback mode (no backend)” on the Generate page.

---

## Local Setup (Web)

- Requirements: Node.js 18+
- Steps:
  - `cd web && npm install && npm run dev`
  - Create `web/.env.local` with Clerk + GitHub vars (see `env-config-example.txt`)
  - Open <http://localhost:3000> and head to `/generate`

Optional flags:
- `NEXT_PUBLIC_TEACHER_ALLOW_120B=1` to show the 120B teacher option in the UI (not recommended). Backend must also set `TEACHER_ALLOW_120B=1` to actually use 120B; otherwise requests are downgraded to 20B.

Optional: Configure Upstash (KV) and GitHub export to open PRs for lessons.

---

## Features

- Gallery with search, filters, thumbnails
- Upload drafts, Request Publish, and admin moderation
- Notebook viewer + editor (Monaco + Markdown), drag‑reorder, metadata
- Client‑side runners: Python (Pyodide), JS/TS (Worker)
- Export to ALAIN JSON and open a GitHub PR
- Optional caching with Upstash to reduce GitHub reads

---

## How It Works

- Teacher: GPT‑OSS‑20B synthesizes lessons under a strict JSON schema with auto‑repair.
- Providers: Hosted (Poe) and OpenAI‑compatible (local: Ollama/LM Studio) share the same request shape.
- Execution: Runs client‑side for quick feedback; server execution path stubbed for future sandboxing.

### Streaming Paths
- Web SSE (default): `web/app/api/execute/route.ts` streams tokens directly from providers to the browser. Set `NEXT_PUBLIC_STREAM_VIA=web`.
- Backend proxy SSE: proxy through Encore at `POST /execute/stream` if enabled. Set `NEXT_PUBLIC_STREAM_VIA=backend` and `NEXT_PUBLIC_BACKEND_BASE`.
- Note: Encore TS streaming is currently disabled in `backend/execution/stream.ts`. If backend SSE is unavailable, keep `NEXT_PUBLIC_STREAM_VIA=web`.
  - For MVP, backend SSE is intentionally disabled; use the web SSE path for streaming.

### Content Layout
- Auto‑saves and exports live under `content/` (see `content/README.md`).
- Research writes both structured JSON (`research-data.json`) and human‑readable Markdown summaries (`model-card.md`, `huggingface-info.md`, etc.).
 - Index: `GET /api/content/index` lists provider/model artifacts (add `?flat=1` for a flat array).

### Backfill Teacher Metadata
- Adds `metadata.teacher_model_used` and `metadata.teacher_downgraded` to existing notebooks.
- Run locally:
  - Default (content/notebooks): `node backend/scripts/backfill-teacher-metadata.mjs`
  - Custom root: `node backend/scripts/backfill-teacher-metadata.mjs --root path/to/notebooks`
  - Dry run: append `--dry` to see which files would be updated

### Why GPT‑OSS‑20B (Teacher)

- Open weights and local‑first: runs on Ollama/LM Studio with the same API shape as hosted endpoints.
- Strong instruction following: produces stepwise, teachable content with minimal prompt overhead.
- Reliable JSON: high schema adherence with fewer repair passes.
- Practical fit: fast enough for iterative generation and real‑time previews.

#### Teacher Model Defaults
- Default: GPT‑OSS‑20B for all teacher tasks.
- Optional (not recommended for most setups): enable GPT‑OSS‑120B by setting `TEACHER_ALLOW_120B=1` in the backend environment. When disabled (default), any request for 120B is automatically downgraded to 20B.
- Note: `GPT‑OSS‑120B` is not supported via local OpenAI‑compatible endpoints; use hosted provider (Poe) if you explicitly enable it.

---

## Tech At A Glance

- Frontend: Next.js (App Router), React, Tailwind, Monaco, @uiw/react-md-editor
- Auth: Clerk (GitHub/Hugging Face via Clerk)
- Storage: GitHub Contents API
- Optional Cache: Upstash Redis (lazy‑loaded)
- Backend: Encore.dev TypeScript services (execution, tutorials, export)
- Export: nbformat/Jupyter; in‑browser Colab rendering

---

## Repository Structure

- `web/`: Next.js app (UI, editors, in‑browser runners)
- `backend/`: Encore.dev TypeScript services
- `prompts/`: ALAIN‑Kit prompt templates
- `schemas/`: Lesson JSON schema
- `examples/poe/`: Standalone Poe API examples
- `hackathon-notes/`: Devpost materials and judging notes
- `scripts/`: Smoke tests and conversion utilities
- `test_sandbox/`: Scratch tests and local notes (ignored by git). Put temporary test scripts and outputs here to avoid cluttering the root.

---

## Testing Instructions

- No login required for core flow.
- Web‑only fallback:
  - Open <https://alain-ruddy.vercel.app/generate>
  - Enable “Force fallback mode (no backend)”
  - Paste model: <https://huggingface.co/openai/gpt-oss-20b>
  - Click Generate → open tutorial → run a step → Export to Colab
- Local quick check:
  - `cd web && npm install && npm run dev`
  - Visit <http://localhost:3000/generate>, enable fallback, repeat steps above
- Optional offline (Ollama):
  - `ollama pull gpt-oss:20b`
  - In app, choose Local/OpenAI‑compatible and set model `gpt-oss:20b`

---

## License

MIT License — see `LICENSE` for full text.

---

## Explore & Tutorials (New)

- Explore public content
  - Notebooks: `/explore/notebooks` — lists public/unlisted generated notebooks.
  - Lessons: `/explore/lessons` — lists public/unlisted generated lessons and tutorials.
  - Filter by `model`, `provider`, and `difficulty` via query params.

- Tutorial detail
  - Page: `/tutorials/:id` — renders steps and Model Maker info.
  - Includes a minimal “Try a prompt” panel that calls the backend `/execute`.
  - Tracks step progress per user (requires Clerk auth).

- Download endpoint
  - `GET /api/files/download?path=content/...` — serves files under the repo `content/` directory only.
  - Use to download `.ipynb` and lesson JSON directly from Explore pages.

## Catalog & Publishing

- Flags (backend)
  - `CATALOG_INDEX=1` — index notebooks/lessons on save into catalog tables.
  - `TUTORIALS_INGEST=1` — ingest generated lessons into the tutorials DB (steps + assessments).

- Flags (web)
  - `NEXT_PUBLIC_BACKEND_BASE` — base URL for backend API.
  - `NEXT_PUBLIC_GITHUB_REPO` / `NEXT_PUBLIC_GITHUB_BRANCH` — enables “Open in Colab” links.
  - `NEXT_PUBLIC_ENABLE_LEGACY_STORE=1` — opt‑in legacy `/api/notebooks` (otherwise redirects to catalog).

- Backfill script
  - `bun backend/scripts/backfill-catalog.ts` — indexes existing artifacts in `content/` into the catalog.
  - Safe to re‑run. Explore pages will populate after backfill.
