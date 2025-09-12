# ALAIN Web — Features and Operations

## Overview
- Upload + moderation + publish
- Gallery with metadata and thumbnails
- Notebook viewer + editor (Monaco/Markdown, reorder, metadata)
- Execution (client): Python via Pyodide; JS/TS via Worker
- Export to ALAIN JSON + GitHub PR
- Optional KV cache (Upstash)

## Routes
- Public: /, /generate, /notebooks, /notebooks/[id], /api/notebooks
- Auth: /notebooks/[id]/remix, /upload, /my/notebooks
- Admin: /admin, /admin/moderation, /api/admin/**

## Env Vars (Web)
- Clerk: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- GitHub: GITHUB_TOKEN, GITHUB_REPO=owner/name, GITHUB_BRANCH=main, NOTEBOOKS_DIR=notebooks, LESSONS_DIR=alain-lessons
- KV (optional): REDIS_URL, REDIS_TOKEN

## Execution
- Python: in-browser via Pyodide (web/components/PyRunner.tsx)
- JS/TS: Web Worker sandbox (web/components/JSRunner.ts)
- Server: stub at /api/exec returns 501 (replace with sandbox runner later)

## Export to ALAIN
- POST /api/notebooks/[id]/export/alain → creates branch export/alain-<id>-<ts>, commits JSON to LESSONS_DIR, opens PR

## Moderation Flow
- User uploads → metadata.moderation='pending'
- Admin approves/rejects → updates nb.metadata, sets published boolean

## Caching
- Optional Upstash KV caches listing and notebook JSON to reduce GitHub reads on cold starts.
- KV is lazy-loaded and fully optional: if REDIS_URL/REDIS_TOKEN are not set, caching no-ops and the app builds without @upstash/redis installed.

## Fallback Mode (no backend)
- From Text generation supports a web-only fallback that does not require the Encore backend.
- Enable on the Generate page by ticking “Force fallback mode (no backend)” or by calling `/api/generate-from-text?fallback=1`.
- Fallback creates an in-memory tutorial (`id` starts with `local-`). You can open it, run steps (client-side), and use “Render to Colab (web)” on the tutorial page to download a simple `.ipynb`.

## Smoke script
- A quick end-to-end smoke for the web fallback is available at `scripts/web_smoke_from_text.sh`.
- Usage:
  - `bash scripts/web_smoke_from_text.sh` (BASE defaults to `http://localhost:3000`)
