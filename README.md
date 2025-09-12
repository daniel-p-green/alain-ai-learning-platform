<div align="center">

  <img src="web/public/brand/ALAIN_logo_primary_blue-bg.svg" alt="ALAIN logo" width="420" />

  <br/>
  <br/>

  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Teacher-GPT--OSS--20B-4b8" alt="Teacher: GPT-OSS-20B">
  <img src="https://img.shields.io/badge/Providers-Poe_%7C_OpenAI--compatible-795" alt="Providers: Poe | OpenAI-compatible">
  <img src="https://img.shields.io/badge/Mode-Offline_Supported-2aa" alt="Offline Supported">

</div>

# ALAIN — The IKEA Instruction Layer for AI Models

## The open source IKEA instruction layer for AI models

Learn AI with AI. Paste any model (Hugging Face, Ollama, LM Studio) and get an interactive, runnable tutorial with setup, best practices, and export to Colab/Jupyter — locally or in the cloud.

---

## 🚀 Elevator Pitch

ALAIN is the open-source IKEA instruction layer for AI models. We transform the way developers and researchers learn and experiment with AI models by providing:

- **Instant, Interactive Learning**: Turn any AI model into an interactive learning environment with guided tutorials and hands-on exercises
- **Universal Compatibility**: Works seamlessly with models from Hugging Face, Ollama, and LM Studio
- **Flexible Deployment**: Run locally for privacy or in the cloud for convenience
- **Open Source & Community-Driven**: Built by and for the AI community

Whether you're a researcher testing the latest models or a developer integrating AI into your applications, ALAIN helps you get from model to mastery faster than ever before.

---

## Quick Links

- Web docs: `web/docs/OPERATIONS.md`, `web/docs/DEVELOPER_GUIDE.md`
- Gallery: `/notebooks` • Upload: `/upload` • Moderation (admin): `/admin/moderation`

## What’s Included (current)

- Gallery with metadata, thumbnails, search/filters (`/notebooks`)
- Upload + author drafts (`/upload`), “Request Publish”, My Notebooks (`/my/notebooks`)
- Admin moderation queue: Approve/Reject, publish state (`/admin/moderation`)
- Viewer with per‑cell execution (client):
  - Python via Pyodide (in‑browser, offline)
  - JavaScript/TypeScript via Web Worker sandbox
- Editor: Monaco for code, rich markdown, drag‑reorder, notebook metadata editor
- Export to ALAIN JSON + open GitHub PR (button on viewer)
- GitHub storage for notebooks; read‑through on cold start
- Optional Upstash KV caching to reduce GitHub reads (lazy/optional)


## Quick Start (Web)

1) From repo root: `cd web && npm install && npm run dev`
2) Create `web/.env.local` with Clerk + GitHub:

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

3) Open http://localhost:3000
   - Gallery: `/notebooks`
   - Upload: `/upload` (signed‑in)
   - My drafts: `/my/notebooks` (signed‑in)
   - Moderation: `/admin/moderation` (admin)

Admin role: in Clerk Dashboard → your user → publicMetadata, set `{ "role": "admin" }`.

## Execution

- Python: client‑side via Pyodide (safe, offline)
- JS/TS: client‑side via Web Worker sandbox
- Server‑side: `/api/exec` stub ready; integrate a secure sandbox when desired

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
clerk · docker · encore-cloud · encore.ts · github-actions · go · google-colab · gpt-oss-20b · ipywidgets · json · jupyter · lm-studio · nbformat · next.js · node.js · ollama · openai-compatible-api · poe-api · postgresql · react · sse · tailwind-css · typescript · vercel · vitest · vllm

## Submission Categories (Hackathon)

- Best Local Agent: Offline, identical, safe. ALAIN generates interactive how‑to guides entirely on device with gpt‑oss via Ollama or LM Studio. Same UX as cloud, parameterized runs only, export to Jupyter. Local‑first without trade‑offs.
- For Humanity: Make AI literacy universal. ALAIN lowers barriers with open source, local‑first guides that work offline in low‑connectivity classrooms, clinics, and libraries. No data leaves the device; students learn by doing, not watching.
- Wildcard: Infrastructure for adoption. The missing instruction layer that gets models used, not just released. ALAIN isn’t another app—it’s the instruction layer that turns model cards into runnable, hands‑on lessons across providers.

---

## Judge Fast Path (60–120s)

Option A — Hosted (Poe)
1) Run backend and web (see Quick Start).
2) In the web UI: paste `openai/gpt-oss-20b` → Provider: Poe → Generate → Open Tutorial.
3) From the tutorial page, click "Download Colab Notebook" to export a ready-to-run `.ipynb` (uses backend `/export/colab/:id`).
Note: Streaming is handled via the Next.js API route using SSE. Encore backend streaming is disabled in this MVP.

Option B — Strict Offline (Ollama)
1) `ollama pull gpt-oss:20b`
2) One command: from repo root run `npm run dev:offline`
   - Starts backend + web with `OFFLINE_MODE=1`, `TEACHER_PROVIDER=openai-compatible`, and sensible defaults for Ollama.
3) Open http://localhost:3000
4) Paste `openai/gpt-oss-20b` → Provider: Local (OpenAI‑compatible) → Generate.
5) Click "Download Colab Notebook" (works offline; no third-party calls in export).
6) Note: Exported notebook includes a Pre‑flight cell that verifies API connectivity before running steps.
Note: For local demos, you may set `DEMO_ALLOW_UNAUTH=1` to bypass auth.

Option C — Local (LM Studio)
1) Open LM Studio and enable the Local Server (default `http://localhost:1234/v1`)
2) One command: from repo root run `npm run dev:offline` (or your usual dev flow)
3) Open http://localhost:3000
4) In Generate: select “From Local Runtime” (auto-selected if detected), pick a model (e.g., `llama-3-8b-instruct`) and click Generate
5) Run a step, then click “Download Colab Notebook”
6) Note: The “Local Setup Helper” appears under the Local model picker with a copyable `ollama pull gpt-oss:20b` command and a Test Connection button.
Notes:
- Streaming is handled via the Next.js API route using SSE; Encore streaming is disabled in this MVP.
- For local demos, you may set `DEMO_ALLOW_UNAUTH=1` to bypass auth.

Option D — From Text (Docs → Lesson)
1) On the Generate page, click “From Text”.
2) Paste a snippet (e.g., a section from OpenAI docs on Harmony‑style prompting).
3) Choose Teacher Provider (Poe or Local), then Generate → Preview → Export.
Notes:
- This bypasses Hugging Face metadata entirely; great for live copy‑paste demos.
- Exported notebooks include the Pre‑flight check cell.

Minimal offline cURL (no web UI)
- Enable local demo bypass in backend env: `DEMO_ALLOW_UNAUTH=1`
```bash
curl -s -X POST http://localhost:4000/lessons/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "hfUrl":"openai/gpt-oss-20b",
    "difficulty":"beginner",
    "teacherModel":"GPT-OSS-20B",
    "includeAssessment":true,
    "provider":"openai-compatible"
  }' | jq '.success, .lesson.title'
```

Note: In offline mode we never fetch external metadata; owner/repo is parsed locally and lesson generation runs against your local endpoint. The web header shows an OFFLINE MODE badge when active.

—

## Why It Matters
- Learners hit walls reading static model cards; they need runnable guidance.
- ALAIN turns model links into hands‑on lessons with assessments, exportable to Colab.
- Local mode removes cost and access barriers (schools, air‑gapped labs, events).

What’s Novel
- “Paste HF → runnable, graded lesson” with schema validation and auto‑repair.
- Cost‑aware exercises and parameterized execution (no arbitrary code injection).
- True offline: strict metadata‑free mode + local teacher via OpenAI‑compatible API.

—

## How It Works
- Backend parses model ref (no network in OFFLINE_MODE) → teacher (gpt‑oss‑20b by default) generates schema‑valid lesson JSON (with one‑shot repair) → UI renders a playable lesson → optional Colab export.
- Providers
  - Hosted: Poe (`POE_API_KEY`) with `GPT-OSS-20B` / `GPT-OSS-120B`
  - Local: OpenAI‑compatible endpoints (Ollama, LM Studio, vLLM) using identical request shape

Concrete references
- Provider aliasing: `poe` vs local
  - alain-ai-learning-platform/backend/execution/providers/aliases.ts:7
  - alain-ai-learning-platform/backend/execution/providers/aliases.ts:20
- Default model and provider
  - alain-ai-learning-platform/backend/execution/spec/lessonSchema.ts:99
  - alain-ai-learning-platform/backend/execution/spec/lessonSchema.ts:100
- Routing guard for 120B → Poe
  - alain-ai-learning-platform/backend/execution/teacher.routing.test.ts:10
- Strict offline (no metadata fetch)
  - alain-ai-learning-platform/backend/execution/lesson-generator.ts:153
  - alain-ai-learning-platform/backend/execution/parse-model.ts:12
- OFFLINE badge (web)
  - alain-ai-learning-platform/web/components/OfflineBadge.tsx:1

—

## Quick Start (5–10 minutes)

Prerequisites
- Node.js 18+
- Go + Encore CLI (backend)
  - macOS: `brew install encoredev/tap/encore`
  - Linux/Windows: see Encore docs; verify with `encore --version`
- Optional Local: [Ollama](https://ollama.ai) and `ollama pull gpt-oss:20b`

1) Install dependencies
```bash
# From repo root
npm install

# Optional (notebooks/tools)
pip install -r requirements.txt
pip install -r requirements-dev.txt && pre-commit install
```

2) Configure environment
- Web (.env.local): `cp env.web.example web/.env.local`
- Backend (Encore secrets preferred; or local env file):
```bash
encore secret set POE_API_KEY
encore secret set OPENAI_BASE_URL
encore secret set OPENAI_API_KEY
# or for local-only dev
cp env.backend.example backend/.env.local
```

Web env (`web/.env.local`)
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Hosted: `POE_API_KEY`
- Local: `NEXT_PUBLIC_BACKEND_BASE` (defaults to http://localhost:4000)

Backend env
- Hosted default: `TEACHER_PROVIDER=poe`
- Local default: `TEACHER_PROVIDER=openai-compatible`, set `OPENAI_BASE_URL`, `OPENAI_API_KEY`
- Strict Offline: `OFFLINE_MODE=1` (skip external metadata fetches)
- Optional demo cURL: `DEMO_ALLOW_UNAUTH=1` (local only)

3) Start services
```bash
# Easiest: one command dev modes
npm run dev:offline   # local/offline via Ollama (auto defaults)
# or
npm run dev:hosted    # hosted via Poe (requires POE_API_KEY)

# Manual (if preferred)
# Terminal A — Backend (Encore.ts)
# cd backend && encore run    # http://localhost:4000
# Terminal B — Web (Next.js)
# cd web && npm run dev       # http://localhost:3000
```

4) Use the app
1) Open http://localhost:3000 and sign in (Clerk)
2) Go to Generate and paste a Hugging Face model (e.g. `meta-llama/Meta-Llama-3.1-8B-Instruct`)
3) Pick Provider: Poe (hosted) or Local (OpenAI‑compatible)
4) Generate → preview → Open Tutorial → run steps with streaming output
5) Optional: visit Settings → Setup Wizard to auto‑switch between Hosted and Offline modes.

Local (Ollama) cheatsheet
```bash
ollama pull gpt-oss:20b
encore secret set OPENAI_BASE_URL http://localhost:11434/v1
encore secret set OPENAI_API_KEY ollama
```

Local (LM Studio) cheatsheet
```bash
# In LM Studio: enable Local Server (default http://localhost:1234/v1)
encore secret set OPENAI_BASE_URL http://localhost:1234/v1
encore secret set OPENAI_API_KEY lmstudio
```

Notes
- Teacher aliasing: `GPT-OSS-20B` → `gpt-oss:20b` for local runs
- 20B needs ≥16GB VRAM or Apple Silicon with enough unified memory; CPU offload works but is slow
- Strict Offline: set `OFFLINE_MODE=1` and `TEACHER_PROVIDER=openai-compatible`. Paste owner/repo or full URL; parsing is local.

—

## Design, Safety, and Cost
- No arbitrary code execution; lessons run parameterized calls only.
- Secrets via Encore; env examples provided.
- Linter: `scripts/notebook_linter.py` checks seeds, pins, secrets, evaluation, cost logs.
- Streaming: implemented at Next.js layer with retry fallback.

—

## Category Fit (Hackathon)
- Best Local Agent: useful agentic generation with no internet access.
- For Humanity: reduces cost/privacy barriers to advanced AI learning.
- Most Useful Fine‑Tune: roadmap includes targeted educational fine‑tunes.

Roadmap
- Reasoning traces UI (opt‑in)
- Stronger assessment bank and rubric validation
- One‑click Colab export with data stubs

—

## Project Structure (high‑level)
```
alain-ai-learning-platform/
├── backend/                 # Encore.ts APIs (execution, lessons, export)
│   ├── execution/           # Provider routing, teacher, streaming
│   ├── tutorials/           # CRUD, import, versioning
│   └── export/              # Colab notebook export
├── web/                     # Next.js app (Clerk auth, UI)
│   └── app/                 # Generate page, tutorial player, settings
├── prompts/                 # ALAIN‑Kit prompts (Harmony format)
├── web/docs                 # Web app docs (operations + developer)
└── env-config-example.txt   # Copy to .env.local for web
```

Docs & Tools
- Notebook Linter: `scripts/notebook_linter.py`

## Vercel (web)

- Project Settings → General → Root Directory = `web`
- Enable “Include files outside the Root Directory in the Build Step”
- Production Branch: `main`
- `web/vercel.json` uses `ignoreCommand` to skip deploys when `web/` unchanged

## Notes

- KV cache is optional and lazy‑loaded; builds do not require `@upstash/redis` unless `REDIS_URL` and `REDIS_TOKEN` are present.
- Export to ALAIN writes JSON to a new branch (`export/alain-…`) and opens a PR targeting `GITHUB_BRANCH`.

—

## Phases Orchestration (Thin Web Stub)
- Endpoint: `POST /api/phases`
  - Body: `{ phase: 'Research'|'Design'|'Develop'|'Validate', provider: 'poe'|'openai-compatible', model: 'GPT-OSS-20B'|..., input?: any }`
  - Behavior: Loads the Harmony prompt for the requested phase from `prompts/alain-kit/<phase>.harmony.txt`, composes a simple user message with your `input`, and calls the configured provider via our existing provider abstraction (Poe or OpenAI‑compatible). Returns `{ ok, content }`.
  - File: `web/app/api/phases/route.ts:1`
- UI: visit `/phases` for a minimal four‑button page that hits the API and shows activity.
  - File: `web/app/phases/page.tsx:1`

Develop/Validate automation
- If `phase` is `Develop` or `Validate`, the API attempts to parse the model output as JSON (strips code fences), then:
  - Writes lesson JSON to `lessons/<provider>/<model>/lesson.json`
  - If `autoRender` (default true): renders notebook to `notebooks/<provider>/<model>/lesson.ipynb`
  - Runs a smoke check and writes `reports/<provider>/<model>/validation.json`
  - The API response includes `artifacts` with file paths and (if available) the parsed smoke report.

Environment for providers (web):
- Poe hosted: set `POE_API_KEY`
- OpenAI‑compatible (local/cloud): set `OPENAI_BASE_URL`, `OPENAI_API_KEY`

—

## Colab Link Builder (Optional)
- Set `NEXT_PUBLIC_GITHUB_REPO` to `org/repo` and optional `NEXT_PUBLIC_GITHUB_BRANCH` (default `main`).
- The tutorial page will show an “Open in Colab” link that assumes notebooks are published under:
  - `notebooks/<provider>/<owner>/<repo>/lesson.ipynb`
- File: `web/app/tutorial/[id]/page.tsx:1`

—

## Troubleshooting
- Backend won’t start: install Encore CLI and run from `backend/` (`encore run`)
- Unauthorized on web: set Clerk keys in `.env.local`, restart web
- Provider errors: set `POE_API_KEY` (hosted) or `OPENAI_BASE_URL`/`OPENAI_API_KEY` (local)
- Local is slow: reduce tokens, or try hosted Poe
- Streaming: SSE via Next.js; retries once; non‑streaming fallback succeeds
- Offline mode: if `OFFLINE_MODE=1`, ensure `TEACHER_PROVIDER=openai-compatible` and local endpoint running

—

## License
MIT

Credits
- GPT‑OSS by OpenAI
- Poe by Quora
- Encore, Clerk, Next.js, Tailwind
