<div align="center">

  <img src="web/public/brand/ALAIN_logo_primary_blue-bg.svg" alt="ALAIN logo" width="420" />

  <br/>
  <br/>

  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Teacher-GPT--OSS--20B-4b8" alt="Teacher: GPT-OSS-20B">
  <img src="https://img.shields.io/badge/Providers-Poe_%7C_OpenAI--compatible-795" alt="Providers: Poe | OpenAI-compatible">
  <img src="https://img.shields.io/badge/Mode-Offline_Supported-2aa" alt="Offline Supported">

</div>

# Applied Learning AI Notebooks (ALAIN)
The open source IKEA instruction layer for AI models.
Learn AI with AI: paste any model (Hugging Face, Ollama, LM Studio), get an interactive how‑to guide, run locally or in the cloud with gpt‑oss.

---

## What’s Inside

- Gallery: Browse notebooks with titles, tags, thumbnails, and filters.
- Uploads & Drafts: Signed‑in users upload .ipynb, “Request Publish”, and track status in My Notebooks.
- Moderation (admin): Approve/Reject, publish state reflected in gallery.
- Viewer + Runner: Run code cells in‑browser (Python via Pyodide; JS/TS via Web Worker).
- Editor: Monaco (code), rich Markdown, drag‑reorder, metadata editor (title, tags, org, license, source URL, publish).
- Export to ALAIN: One‑click export to ALAIN JSON and open a GitHub PR.
- Storage: Notebooks saved to GitHub; read‑through on cold start. Optional KV cache to reduce GitHub reads.

## Quick Start (Web)

Requirements
- Node.js 18+
- Clerk app (GitHub/Hugging Face providers configured in Clerk)
- GitHub repo to store notebooks

Install & Run
```
cd web
npm install
npm run dev
```

Environment (create `web/.env.local`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
GITHUB_TOKEN=...                  # repo contents:write
GITHUB_REPO=owner/name
GITHUB_BRANCH=main
NOTEBOOKS_DIR=notebooks
# Optional: LESSONS_DIR=alain-lessons
# Optional KV: REDIS_URL=..., REDIS_TOKEN=...
```

Open http://localhost:3000
- Gallery: `/notebooks`
- Upload: `/upload` (signed‑in)
- My drafts: `/my/notebooks` (signed‑in)
- Moderation: `/admin/moderation` (admin)

Admin role: in Clerk Dashboard → your user → publicMetadata, set `{ "role": "admin" }`.

## Key Routes
- Public: `/`, `/generate`, `/notebooks`, `/notebooks/[id]`, `/api/notebooks`
- Signed‑in: `/upload`, `/my/notebooks`, `POST /api/notebooks/[id]/publish-request`
- Admin: `/admin/moderation`, `POST /api/admin/moderation/[id]/approve`, `POST /api/admin/moderation/[id]/reject`

## Execution
- Python (client): Pyodide; no server required; offline‑friendly.
- JS/TS (client): Web Worker sandbox with timeout and console capture.
- Server‑side: `POST /api/exec` stub returns NOT_IMPLEMENTED; integrate a secure sandbox when ready.

## Export to ALAIN (PR)
- On a notebook page, click “Export ALAIN (PR)”:
  - Creates branch `export/alain-{id}-{timestamp}`
  - Writes `LESSONS_DIR/{id}.json` (default `alain-lessons/`)
  - Opens a PR targeting `GITHUB_BRANCH` (default `main`)

## Deployment (Vercel)
- Project → Settings → General → Root Directory = `web`
- Enable “Include files outside the Root Directory in the Build Step”
- Project → Settings → Git → Production Branch = `main`
- `web/vercel.json` uses `ignoreCommand` to skip builds when `web/` unchanged
- Configure env vars (Clerk, GitHub; optional KV)

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind, Monaco, @uiw/react-md-editor
- Auth: Clerk (GitHub/Hugging Face via Clerk)
- Storage: GitHub Contents API
- Optional Cache: Upstash Redis (lazy‑loaded; build does not require `@upstash/redis`)
- DevOps: Vercel (web), GitHub Actions (CI)

---

## About The Project (Devpost version)

Inspiration: New models drop weekly, but adoption lags. Docs are passive, scattered, and inconsistent; "hello world" takes hours. I wanted a system where you paste a model link and get a hands‑on, runnable lesson that teaches best practices, pitfalls, and cost awareness — in minutes, locally or in the cloud.

What It Does: Turns a model reference (Hugging Face, LM Studio, Ollama) into a guided, interactive tutorial with setup, runnable steps, and quick assessments. Lessons export to Jupyter/Colab and run via hosted or local OpenAI‑compatible endpoints with the same request shape.

### How We Built It
- Backend (Encore.ts):
  - Execution service (provider routing, SSE)
  - Tutorials service (CRUD, validation)
  - Export service (Colab/Jupyter generation)
- Teacher Model: GPT‑OSS‑20B with Harmony prompts, strict JSON schema, and auto‑repair to guarantee well‑formed lessons.
- Frontend (Next.js):
  - Model picker with instant preview
  - Streaming output with real‑time progress
  - "Show Request" + cURL copy functionality
  - Directory with search/filters
- Local/Offline: Identical UX across Poe (hosted) and OpenAI‑compatible endpoints (Ollama/LM Studio/vLLM).
- ALAIN‑Kit: Research → Design → Develop → Validate workflow bakes instructional design into generation.

### Challenges We Overcame
- Unstructured Inputs: Model cards vary widely; solved with schema‑first generation + repair loop
- Provider Differences: Normalized on OpenAI‑compatible requests with intelligent routing/fallbacks
- Safety vs. Interactivity: Kept execution strictly parameterized (no arbitrary code) while preserving hands‑on learning
- Cost Transparency: Added token estimates and preflight checks so users understand tradeoffs before they run

### What We Learned
- AI Teaching AI Works: GPT‑OSS can consistently synthesize high‑quality tutorials from heterogeneous sources
- Schema‑First Wins: JSON schemas with validation/repair deliver reliability under messy real‑world inputs
- Abstraction Matters: A clean provider layer unlocks seamless hosted ↔ local switching
- Offline Is Empowering: True local capability enables classrooms, air‑gapped labs, and low‑connectivity regions
- Community Effects: Standardized, shareable "blueprints" compound learning and reduce onboarding from hours to minutes

### Technology Stack
- Languages & Frameworks: TypeScript, React, Next.js, Tailwind CSS
- Backend & Runtime: Encore.ts (Go/TypeScript), Node.js
- AI & Providers: GPT‑OSS‑20B (teacher), Poe API (hosted), OpenAI‑compatible endpoints (Ollama, LM Studio)
- Data & Auth: PostgreSQL, Clerk
- Notebooks & Tools: nbformat/Jupyter, ipywidgets, Vitest, Docker
- Dev & Ops: Vercel (web), Encore Cloud (backend), GitHub Actions (CI/CD)

### Try It Out
- Live Demo: [Demo URL]
- GitHub: https://github.com/daniel-p-green/alain-ai-learning-platform

Quick Local Start
- Install: `npm install`
- Offline (Ollama): `ollama pull gpt-oss:20b` then `npm run dev:offline`
- Open: http://localhost:3000 → Generate → Run a step → Export to Colab

### Additional Highlights
- Key Features: Adapt Experience (Beginner/Intermediate/Advanced); Public Gallery with filters; "Show Request" + cURL copy; Schema validation with auto‑repair; Secure Colab export with preflight
- Safety: No arbitrary code execution; only parameterized API calls. Secrets handled via Encore/Clerk. Preflight connectivity and smoke tests included
- One‑Liner: Paste model link → get a runnable, graded lesson. Run locally or in the cloud with identical UX.

### Built With (tags)
TypeScript · React · Next.js · Tailwind CSS · Monaco · ipywidgets · nbformat · Clerk · Encore.ts · Node.js · Vercel · GitHub Actions · Docker · GPT‑OSS‑20B · Poe API · OpenAI‑compatible API · Ollama · LM Studio · vLLM · PostgreSQL · SSE · JSON · Vitest
