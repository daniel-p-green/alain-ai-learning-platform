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

Option B — Strict Offline (Ollama)
1) `ollama pull gpt-oss:20b`
2) One command: from repo root run `npm run dev:offline`
   - Starts backend + web with `OFFLINE_MODE=1`, `TEACHER_PROVIDER=openai-compatible`, and sensible defaults for Ollama.
3) Open http://localhost:3000
4) Paste `openai/gpt-oss-20b` → Provider: Local (OpenAI‑compatible) → Generate.

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
  - Local: OpenAI‑compatible endpoints (Ollama, vLLM) using identical request shape

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
- Best Practices: `docs/notebooks/notebook-best-practices.md`
- Author Checklist: `docs/notebooks/notebook-quality-checklist.md`
- Teaching Template: `docs/templates/teaching_template.ipynb`
- More: `docs/notebooks/*`, `docs/gpt-oss/*`

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
