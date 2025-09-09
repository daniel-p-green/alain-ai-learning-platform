# ALAIN — Applied Learning AI Notebooks

Leap Open Source Hackathon 2025 Submission

Tagline: Learn models by doing.

—

## Why ALAIN (Our Why)
- Problem: Model releases outpace learning. Docs, blogs, and videos are passive; first-run friction (keys, setup, APIs) slows adoption.
- Mission: Turn model launches into hands-on, classroom-ready labs—fast, safe, reproducible.
- Outcome: ALAIN converts a model link into a guided, interactive notebook with objectives, assessments, and live executions.

—

## What We Built
- Open-source learning platform that generates interactive lessons directly from model sources (e.g., Hugging Face) and runs them live.
- ALAIN‑Kit methodology bakes instructional design into the workflow (research → design → develop → validate), ensuring quality beyond “just a demo.”
- Pluggable execution providers (Poe, OpenAI‑compatible) plus a clean web UX for step-by-step learning.

—

## Why gpt‑oss (20B/120B)
- Philosophical: Open models teaching other open models. Transparency and local control align with our mission to democratize advanced model usage and education.
- Practical: `gpt‑oss‑20b` hits a sweet spot — strong code/explanation quality while remaining runnable locally on a single workstation (Ollama/vLLM). `gpt‑oss‑120b` provides a higher‑ceiling path when available.
- Local capability: Fully offline generation is possible with an OpenAI‑compatible endpoint. This reduces cost, preserves privacy, and improves reliability during demos.
- Road to fine‑tuning: The open weights + OpenAI‑compatible semantics make targeted fine‑tuning on educational formats straightforward later.

—

## TL;DR Demo
- Web UI (Next.js): Browse and play lessons with live model calls.
- React SPA: Lightweight demo of the tutorial player.
- Execution API (Encore.ts): Unified SSE endpoint for streaming completions.

Notebook export (Colab)
- Exported notebooks now include:
  - Provider setup cells (install OpenAI SDK, set OPENAI_BASE_URL/API_KEY; Poe defaults to https://api.poe.com/v1)
  - A quick smoke test cell to verify keys work with the selected model
  - Each lesson step rendered as markdown + a runnable code cell that sends the step prompt to the model
  - MCQ assessment cells with inline graders (choose an option, see correctness and explanation)
- No arbitrary code execution; only parameterized API calls using OpenAI-compatible client

UI improvements (magical MVP)
- Model picker: choose provider (Poe/BYOK) and a default model when generating lessons and when running steps in the player.
- Fix-it actions: on validation errors, click “Auto-fix and Import” to repair missing fields/steps.
- Instant preview: after generation, preview title, description, objectives, and first step with one-click “Open Tutorial” or “Export Notebook”.
- Transparent execution: “Show Request” reveals the JSON payload; copy as curl or OpenAI SDK is one click away.

Quick start
1) Install: `npm install`
2) Configure envs:
   - Web: `cp env.web.example web/.env.local` and fill in Clerk + backend base
   - Backend: set secrets via Encore (`encore secret set ...`) or `cp env.backend.example backend/.env.local` for local
3) Run services: `npm run dev:backend` | `npm run dev:web`
4) Open the web app and load a sample lesson or paste a model link.

How to run details live in `alain-ai-learning-platform/README.md`.

—

## ALAIN‑Kit Methodology (On-Brand Differentiator)
ALAIN‑Kit is our systematic content engine. It codifies how we go from a model link to a great learner experience.

- Research (/research): Parse model sources; extract capabilities, constraints, and educational opportunities.
- Design (/design): Define learning objectives, difficulty, and assessment strategy (MCQs with feedback).
- Develop (/develop): Generate an interactive notebook/lesson with runnable, parameterized cells (no arbitrary code).
- Validate (/validate): Quality checks for execution, clarity, and alignment to objectives.

Integration doc: `leap-hack-2025/ALAIN-KIT-INTEGRATION.md`

—

## Scope (Hackathon MVP)
Anchored to the PRD, with an emphasis on build quality and teaching value.

- HF Link Ingest → Lesson Generator (F1): From a Hugging Face model card to a 3–5 step lesson.
- Structured Learning Package (F2): Objectives, model‑maker info, and MCQs included in lesson JSON.
- Live Execution (F3): Parameterized model calls via Poe or BYOK OpenAI‑compatible endpoints; streamed tokens.
- Export to Colab (F4): Roadmap stub for automatic Colab export with auth cells and assessments.

See: `leap-hack-2025/prd.md`

—

## How It Works (Architecture)
High level
```
User → Frontend (Next.js/React) → Backend (Encore.ts) → Teacher (GPT‑oss‑20b) → Lesson JSON → Player → Execution Service → Provider (Poe/OpenAI‑compatible)
```

Core components
- Frontend (Next.js + SPA): Model input, lesson browser, interactive player.
- Backend (Encore.ts): `/api/parse-model`, `/api/generate-lesson`, `/api/execute` SSE.
- Providers: `poe` and `openai-compatible` with BYOK and baseURL support.
- Data: Minimal persistence for lessons and progress (Postgres/Redis via Encore).

Repo map (selected)
- `alain-ai-learning-platform/backend/execution/*`: Streaming + providers.
- `alain-ai-learning-platform/backend/tutorials/*`: Tutorial CRUD and seeding.
- `alain-ai-learning-platform/web/*`: Next.js app and API routes.
- `alain-ai-learning-platform/frontend/*`: React SPA demo and components.
- System overview: `leap-hack-2025/alain-architecture.md`

—

## Learning Experience
- Guided steps: From “Hello model” to structured output and evaluation.
- Transparent APIs: Copy‑ready examples map directly to provider SDKs.
- Assessments: MCQs with explanations verify understanding and reveal pitfalls.
- Difficulty controls: Beginner → Intermediate → Advanced (package field `difficulty`).

Lesson Package highlights
- `model_maker`: name, org_type, homepage, license, repo
- `learning_objectives`: string[]
- `assessments`: MCQs `{ id, question, options[], correct_index, explanation }`

—

## Run Locally (Condensed)
Prereqs: Node 18+, Go (Encore), optional Python 3.8+.

1) Install workspace deps: `npm install`
2) Env: `cp env-config-example.txt .env.local` and fill keys
3) Encore secrets: `encore secret set POE_API_KEY` (and optional OpenAI keys)
4) Start dev:
   - Backend: `npm run dev:backend`
   - Frontend (SPA): `npm run dev:frontend`
   - Web (Next.js): `npm run dev:web`

Providers
- Poe (default): Requires `POE_API_KEY`; streams via `/execute`.
- OpenAI‑compatible (BYOK): Set `OPENAI_BASE_URL` and `OPENAI_API_KEY` (e.g., vendor, vLLM, Ollama).

—

## Local/Offline Quick‑Start (Ollama)
Prereqs: Ollama installed

1) Pull the model
```
ollama pull gpt-oss:20b
```
2) Point ALAIN to your local endpoint
```
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_API_KEY=ollama
```
3) Start ALAIN (separate shells)
```
npm run dev:backend
npm run dev:web
```
4) In the web app:
- Teacher Provider: Local (OpenAI‑compatible)
- Generate a lesson from a HF URL (e.g., meta-llama/Meta-Llama-3.1-8B-Instruct)

Minimal local sanity check (optional)
```
curl -s -X POST "$OPENAI_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"gpt-oss:20b","messages":[{"role":"user","content":"Say hello from gpt-oss local"}]}'
```

—

## Known Limitations
- Streaming: Token streaming is handled in the Next.js layer only; Encore streaming is disabled in this MVP. This does not block the core Paste‑URL → Lesson → Preview/Export flow.
- Reasoning visibility: Harmony‑style prompting is used for teacher tasks, but internal reasoning is not surfaced in the UI yet. Planned: optional “show reasoning” panel.
- Tool/function calling: The repair loop is model‑driven without explicit `tools` parameters in requests. Planned: minimal `tools` scaffolding for structured outputs.
 - Model routing: `GPT-OSS-120B` is not run locally. If selected, the teacher auto‑routes to Poe (requires `POE_API_KEY`). Use `GPT-OSS-20B` for local/Ollama.

—

## Judging Criteria Mapping
- Impact: Converts model launches into shareable, runnable lessons; helps devs, teams, and students adopt faster.
- Execution: Real streaming, provider abstraction, Encore‑based API, and a polished UI flow.
- Innovation: ALAIN‑Kit methodology turns “prompting” into a repeatable instructional system.
- Completeness: Clear setup, demo paths, lesson JSON schema, and PRD‑anchored scope.

—

## Branding Notes (ALAIN‑Brand)
- Voice: Practical, encouraging, trustworthy, curious. Short sentences, action verbs.
- Visual: Indigo accents, clean neutrals; legible at small sizes.
- Assets: Readme banner/social preview (roadmap). Tokens and guidance in `leap-hack-2025/ALAIN-branding.md`.

—

## Roadmap (Post‑Hackathon)
- Offline mode: Local OpenAI‑compatible endpoints (Ollama/vLLM) and caching.
- Adaptive learning: Level detection and personalized paths.
- Colab export: One‑click, with auth cells and assessments.
- Community features: Remixing, voting, progress tracking.

—

## Open Source
- License: MIT
- Contributions welcome: Providers, templates, assessments, UX.
- Related docs: `leap-hack-2025/README.md`, `leap-hack-2025/open source hackathon 2025-leap.md`

—

## Submission Details
- Repo: https://gitlab.com/daniel-p-green/alain-ai-learning-platform
- Leap Project ID: <add here>
- How to run: See “Run Locally” above and `alain-ai-learning-platform/README.md`.
- Contact: hackathon@leap.new (per event instructions)

—

## Credits
- Built for Leap Open Source Hackathon 2025.
- Teacher model: GPT‑oss‑20b (strategy varies by provider availability).
- Thanks to the open‑source community for tooling and inspiration.
