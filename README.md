<div align="center">

  <img src="hackathon-notes/ALAIN-wordmarks/ALAIN_logo_primary_blue-bg.svg" alt="ALAIN logo" width="420" />

  <br/>
  <br/>

  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Teacher-GPT--OSS--20B-4b8" alt="Teacher: GPT-OSS-20B">
  <img src="https://img.shields.io/badge/Providers-Poe_%7C_OpenAI--compatible-795" alt="Providers: Poe | OpenAI-compatible">
  <img src="https://img.shields.io/badge/Mode-Offline_Supported-2aa" alt="Offline Supported">

</div>

# ALAIN — Applied Learning AI Notebooks

Paste a Hugging Face link → get a runnable, cost‑aware lesson with step‑by‑step prompts, code, and assessments. Teacher model: gpt‑oss‑20b (120B planned). Runs hosted via Poe or fully local via an OpenAI‑compatible endpoint (Ollama/vLLM).

Hero links
- Live Demo: <your-demo-url>
- 3‑min Video: <your-youtube-url>
- Devpost: <your-devpost-submission-url>

Badges
- Local/Offline supported (OFFLINE MODE)
- Hosted via Poe (GPT‑OSS‑20B/120B)
- OpenAI‑compatible API (Ollama/vLLM)

—

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

## Project Structure
```
alain-ai-learning-platform/
├── backend/                 # Encore.ts APIs (execution, lessons, export)
│   ├── execution/           # Provider routing, teacher, streaming
│   ├── tutorials/           # CRUD, import, versioning
│   └── export/              # Colab notebook export
├── web/                     # Next.js app (Clerk auth, UI)
│   └── app/                 # Generate page, tutorial player, settings
├── prompts/                 # ALAIN‑Kit prompts (Harmony format)
├── POE_INTEGRATION_GUIDE.md # Provider usage and examples
├── HACKATHON_README.md      # Hackathon context & architecture
└── env-config-example.txt   # Copy to .env.local for web
```

Docs & Tools
- Notebook Linter: `scripts/notebook_linter.py`

### Onboarding + Settings (Web)
- New self-contained module lives at `web/features/onboarding-settings/`.
- Routes:
  - `/onboarding` — 5-step wizard. Keys never leave the device.
  - `/settings` — tabs: Account, Providers, Models, Appearance, Onboarding & Demo, Advanced.
- Reset onboarding: Settings → Onboarding & Demo → Reset onboarding.
- LocalStorage keys: `alain.onboarding.version`, `alain.onboarding.completed`, `alain.providers`, `alain.models`, `alain.ui.theme`.
- Module docs: `web/features/onboarding-settings/README_OnboardingSettings.md`.
- Best Practices: `docs/notebooks/notebook-best-practices.md`
- Author Checklist: `docs/notebooks/notebook-quality-checklist.md`
- Teaching Template: `docs/templates/teaching_template.ipynb`
- More: `docs/notebooks/*`, `docs/gpt-oss/*`

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
