# ALAIN — Applied Learning AI Notebooks

Learn models by doing. Paste a Hugging Face link → get a runnable, cost‑aware lesson with step‑by‑step prompts, code, and assessments. Teacher model: gpt‑oss‑20b (with gpt‑oss‑120b planned). Runs with hosted Poe or locally (Ollama/vLLM) via OpenAI‑compatible API.

Repository
- GitLab (primary): https://gitlab.com/daniel-p-green/alain-ai-learning-platform
- SSH: `git@gitlab.com:daniel-p-green/alain-ai-learning-platform.git`

## Docs & Tools
- Notebook Linter: `scripts/notebook_linter.py` — checks seeds, version pins, secrets handling, evaluation, and cost logging. Run: `python scripts/notebook_linter.py path/to/notebook.ipynb` (add `--json` or `--soft` as needed).
- Best Practices: `docs/notebooks/notebook-best-practices.md`
- Author Checklist: `docs/notebooks/notebook-quality-checklist.md`
- Teaching Template: `docs/templates/teaching_template.ipynb`

## What You Get
- Backend (`backend/`): Encore.ts APIs for parsing, lesson generation, execution, and Colab export
- Web (`web/`): Next.js app (Clerk auth) to generate, preview, and run lessons
- Local/Offline support: Use gpt‑oss‑20b via Ollama with identical request shape

## Quick Start (5–10 minutes)

Pick one path:
- Hosted (Poe): simplest, no local model needed
- Local (Ollama): fully offline teacher using gpt‑oss‑20b

### Prerequisites
- Node.js 18+
- Go + Encore CLI (backend)
  - macOS: `brew install encoredev/tap/encore`
  - Linux/Windows: see Encore docs; verify with `encore --version`
- Optional for Local: [Ollama](https://ollama.ai) and `ollama pull gpt-oss:20b`

### 1) Install dependencies
```bash
# From repo root
npm install

# Optional (for local notebooks/tools)
pip install -r requirements.txt
```

### 2) Configure environment
```bash
cp env-config-example.txt .env.local
```

Set in `.env.local` (web app):
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- For Hosted: `POE_API_KEY`
- For Local: `OPENAI_BASE_URL` (e.g. `http://localhost:11434/v1`) and `OPENAI_API_KEY` (e.g. `ollama`)
- Optional default: `TEACHER_PROVIDER=poe` or `openai-compatible`

Set backend secrets (Encore) — once per machine:
```bash
# Hosted (Poe)
encore secret set POE_API_KEY

# Local (Ollama/vLLM)
encore secret set OPENAI_BASE_URL  # e.g. http://localhost:11434/v1
encore secret set OPENAI_API_KEY   # e.g. ollama
```

### 3) Start services
```bash
# Terminal A — Backend (Encore.ts)
cd backend && encore run    # http://localhost:4000

# Terminal B — Web (Next.js)
cd web && npm install && npm run dev   # http://localhost:3000
```

### 4) Use the app
1) Open http://localhost:3000 and sign in (Clerk)
2) Go to Generate and paste a Hugging Face model (e.g. `meta-llama/Meta-Llama-3.1-8B-Instruct`)
3) Pick Teacher Provider: Poe (hosted) or Local (OpenAI‑compatible)
4) Click Generate Lesson → preview → Open Tutorial → run steps and see streaming output

Smoke tests without the web UI (handy if auth isn’t ready):
```bash
# Hosted (Poe)
curl -s -X POST http://localhost:4000/lessons/generate \
  -H 'Content-Type: application/json' \
  -d '{"hfUrl":"https://huggingface.co/openai/gpt-oss-20b","difficulty":"beginner","teacherModel":"GPT-OSS-20B","includeAssessment":true,"provider":"poe"}' | jq '.success,.lesson.title'

# Local (Ollama)
curl -s -X POST http://localhost:4000/lessons/generate \
  -H 'Content-Type: application/json' \
  -d '{"hfUrl":"https://huggingface.co/openai/gpt-oss-20b","difficulty":"beginner","teacherModel":"GPT-OSS-20B","includeAssessment":true,"provider":"openai-compatible"}' | jq '.success,.lesson.title'
```

## Local (Ollama) Cheatsheet
```bash
# 1) Install & pull model
ollama pull gpt-oss:20b

# 2) Configure backend secrets
encore secret set OPENAI_BASE_URL http://localhost:11434/v1
encore secret set OPENAI_API_KEY ollama

# 3) Start backend & web (see above)
# 4) In the UI: Teacher Provider → Local (OpenAI‑compatible)
```

Notes
- Teacher model aliasing is automatic: `GPT-OSS-20B` → `gpt-oss:20b` for local runs
- 20B runs best on ≥16GB VRAM or Apple Silicon with enough unified memory; CPU offload works but is slow

## How It Works
- Paste HF URL → Backend parses model info → Teacher (gpt‑oss‑20b) generates schema‑valid lesson JSON (with an automatic repair pass) → UI renders a playable lesson with parameterized API calls (no arbitrary code) → optionally export a Colab notebook
- Providers:
  - Hosted: Poe (`POE_API_KEY`) with `GPT-OSS-20B` / `GPT-OSS-120B`
  - Local: OpenAI‑compatible endpoints (Ollama, vLLM) using identical request shape

## Why gpt‑oss (20B/120B)
- Open models teach open models: transparency and local control fit the learning mission.
- Practical sweet spot: `gpt‑oss‑20b` delivers strong code/explanations while remaining runnable locally; `120B` is a higher‑ceiling option.
- Local capability: Fully offline generation via OpenAI‑compatible endpoints reduces cost and preserves privacy.
- Future‑proofing: Open weights + compatible API make targeted fine‑tuning on educational formats feasible.

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

## Troubleshooting
- Backend won’t start: install Encore CLI and run from `backend/` (`encore run`)
- Unauthorized on web: set Clerk keys in `.env.local`, restart `npm run dev` in `web/`, and sign in
- Provider errors: set `POE_API_KEY` for hosted or `OPENAI_BASE_URL`/`OPENAI_API_KEY` for local; set Encore secrets
- Local is slow: reduce tokens, or try hosted Poe for the demo
- Streaming (known limitation): SSE streams through Next.js only (Encore SSE disabled). If the stream drops, it retries once; generation still succeeds with non‑streaming fallback.

## Known Limitations
- Streaming: Token streaming is implemented in the Next.js layer only; Encore streaming disabled in MVP.
- Reasoning visibility: Teacher uses harmony‑style prompting; an optional reasoning summary is available in Generate view (beta), not full CoT.
- Tools/function calling: Minimal scaffold behind `TEACHER_ENABLE_TOOLS`; off by default to avoid provider incompatibilities.
- Model routing: `GPT-OSS-120B` does not run locally; teacher auto‑routes to Poe when selected (requires `POE_API_KEY`). For local runs, use `GPT-OSS-20B`.

## Build & Deploy
- Backend (Encore Cloud): `encore auth login && git push encore`
- Web (Vercel/Netlify/etc.): `cd web && npm run build && npm run start`

## Contributing
Issues, MRs, and PRs are welcome. See `HACKATHON_README.md` for scope and `POE_INTEGRATION_GUIDE.md` for provider details.

## License
MIT
