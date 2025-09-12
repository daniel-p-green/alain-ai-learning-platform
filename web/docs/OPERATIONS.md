# ALAIN Web — Features and Operations

## Overview
- Upload + moderation + publish
- Gallery with metadata and thumbnails
- Notebook viewer + editor (Monaco/Markdown, reorder, metadata)
- Execution (client): Python via Pyodide; JS/TS via Worker
- Export to ALAIN JSON + GitHub PR
- Optional KV cache (Upstash)

## Routes
- Public: /, /generate, /brand-demo, /notebooks, /notebooks/[id], /api/notebooks
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
