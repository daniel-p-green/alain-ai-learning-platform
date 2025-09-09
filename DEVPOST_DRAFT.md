# ALAIN — Applied Learning AI Notebooks (Devpost Draft)

## What it does
Paste a Hugging Face model link and get a runnable, hands‑on lesson: learning objectives, progressive steps with parameterized model calls, and MCQ assessments. Export to Colab or learn in the in‑app player.

New:
- Adapt Experience (beta): tailor content for Beginner/Intermediate/Advanced on tutorial pages.
- Public Tutorials directory: searchable, filterable list accessible from the header.

## Why gpt‑oss (20B/120B)
- Open models teach open models: transparency and local control align with democratizing model education.
- Practical: `gpt‑oss‑20b` balances quality and efficiency; it runs locally on a single workstation (Ollama/vLLM). `120B` is a high‑capacity path when available.
- Local capability: Offline lesson generation reduces cost and protects privacy during demos and in classrooms.
- Fine‑tune path: Open weights + OpenAI‑compatible semantics make it straightforward to specialize for education.

## How we built it
- Frontend: Next.js (Clerk auth) for generation, preview, and a tutorial player with streaming.
- Backend: Encore.ts services for parsing model info, lesson generation (Teacher = GPT‑OSS), execution, and export.
- Providers: Hosted (Poe) and Local (OpenAI‑compatible endpoints like Ollama/vLLM). A shared alias map keeps model IDs consistent across layers.
- QA: Schema validation + single repair pass for malformed outputs; exportable notebooks include setup and a smoke test cell.

## Local/Offline Quick‑Start (Ollama)
1) Pull the model
```
ollama pull gpt-oss:20b
```
2) Point ALAIN to your local endpoint
```
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_API_KEY=ollama
```
3) Run
```
# Backend and Web terminals
npm run dev:backend
npm run dev:web
```
4) In the app: Teacher Provider → Local (OpenAI‑compatible); paste a HF model URL; generate.

## Known Limitations
- Streaming: Implemented in the Next.js layer only; Encore streaming disabled in MVP.
- Reasoning visibility: Harmony‑style prompting used for the teacher, but internal reasoning is surfaced only as an optional summary in the Generate view (beta).
- Tools/function calling: Minimal scaffold behind `TEACHER_ENABLE_TOOLS`; disabled by default to avoid provider incompatibilities.
- Backend auth & rate limits: generation/execution require auth with per-user limits; Colab export lightly throttled.

## Challenges
- Provider divergence and alias drift (solved with a shared alias map and tests).
- Strict validation vs. demo speed (balanced via a single repair pass and clear error surfacing).

## What’s next
- Stronger local mode (vLLM throughput), per‑step sandboxes for code validation, community gallery, and targeted fine‑tunes for “teacher quality”.

## Repo & Run
- Repo: add link
- Quick start: see `README.md` and `HACKATHON_README.md`
