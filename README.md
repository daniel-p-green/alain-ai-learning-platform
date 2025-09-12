<div align="center">

  <img src="web/public/brand/ALAIN_logo_primary_blue-bg.svg" alt="ALAIN logo" width="420" />

  <br/>
  <br/>

  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://openai.devpost.com"><img src="https://img.shields.io/badge/Devpost-OpenAI_Hackathon_Submission-0a0?logo=devpost" alt="Devpost: OpenAI Hackathon Submission"></a>
  <a href="https://huggingface.co/openai/gpt-oss-20b"><img src="https://img.shields.io/badge/Teacher-GPT--OSS--20B-4b8" alt="Teacher: GPT-OSS-20B"></a>
  <a href="https://developer.poe.com/server-bots"><img src="https://img.shields.io/badge/Providers-Poe_%7C_OpenAI--compatible-795" alt="Providers: Poe | OpenAI-compatible"></a>
  <a href="web/docs/OPERATIONS.md#execution"><img src="https://img.shields.io/badge/Mode-Offline_Supported-2aa" alt="Offline Supported"></a>

</div>

# Applied Learning AI Notebooks (ALAIN)
The open source IKEA instruction layer for AI models.
Learn AI with AI: paste any model (Hugging Face, Ollama, LM Studio), get an interactive how‑to guide, run locally or in the cloud with gpt‑oss.

---

## Quick Links
- Live Demo: https://alain-ruddy.vercel.app
- Docs: `web/docs/DEVELOPER_GUIDE.md`
- Devpost Write‑Up: `hackathon-notes/DEVPOST-Submission.md`
 - Hackathon: https://openai.devpost.com

---

## What’s Inside

- Gallery: Browse notebooks with titles, tags, thumbnails, and filters.
- Uploads & Drafts: Signed‑in users upload .ipynb, “Request Publish”, and track status in My Notebooks.
- Moderation (admin): Approve/Reject, publish state reflected in gallery.
- Viewer + Runner: Run code cells in‑browser (Python via Pyodide; JS/TS via Web Worker).
- Editor: Monaco (code), rich Markdown, drag‑reorder, metadata editor (title, tags, org, license, source URL, publish).
- Export to ALAIN: One‑click export to ALAIN JSON and open a GitHub PR.
- Storage: Notebooks saved to GitHub; read‑through on cold start. Optional KV cache to reduce GitHub reads.
- Examples: `examples/poe` contains standalone Poe integration scripts for quick testing.

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
# Optional: NOTEBOOK_MAX_TOKENS=400
```

Open http://localhost:3000
- Gallery: `/notebooks`
- Upload: `/upload` (signed‑in)
- My drafts: `/my/notebooks` (signed‑in)
- Moderation: `/admin/moderation` (admin)

Tip: For From Text demos without the backend (e.g., Vercel), tick “Force fallback mode (no backend)” on the Generate page. This creates a local in‑memory tutorial you can open and “Render to Colab (web)”.

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

## Housekeeping (Cleanup)
- Removed unused experimental landing routes (Concepts, Brand Demo variants) from `web/app/` and middleware.
- Deleted `alain-landing/` static prototype.
- Moved root-level Poe example scripts to `examples/poe/`.
- Standardized package manager on npm; removed `bun.lock`.
- Stricter lesson schema: top-level now disallows unknown fields; `id` is allowed; `model_maker.homepage`/`repo` require valid URIs.
- API error semantics: logical generation/repair failures return 422; invalid upstream responses return 502; backend non-2xx statuses are propagated.
- Notebook export: `NOTEBOOK_MAX_TOKENS` env can adjust token limit in generated Colab cells (default 400).

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind, Monaco, @uiw/react-md-editor
- Auth: Clerk (GitHub/Hugging Face via Clerk)
- Storage: GitHub Contents API
- Optional Cache: Upstash Redis (lazy‑loaded; build does not require `@upstash/redis`)
- DevOps: Vercel (web)

## Repository Structure
- `web/`: Next.js app (App Router), UI, editors, in‑browser runners
- `backend/`: Encore.dev TypeScript services (execution, tutorials, export)
- `prompts/`: ALAIN‑Kit prompt templates used by the teacher model
- `schemas/`: Lesson JSON schema
- `examples/poe/`: Standalone scripts for Poe API integration
- `hackathon-notes/`: Devpost materials and judging notes
- `scripts/`: Utilities for smoke tests and notebook conversion

---

## Devpost Write‑Up

For the full hackathon narrative, judging guidance, and screenshots, see `hackathon-notes/DEVPOST-Submission.md`.

## License

MIT License — see `LICENSE` for full text.
