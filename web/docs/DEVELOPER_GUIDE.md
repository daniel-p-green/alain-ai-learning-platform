# ALAIN Web — Developer Guide

## Code Areas
- web/components: BrandLogo, NavBar, NotebookViewer, editors, runners
- web/app/**: App Router routes and API endpoints
- web/lib: GitHub, KV, admin helpers, store

## Key Files
- web/middleware.ts: route protection (public/admin)
- web/app/(app)/tutorials/[id]/page.tsx: viewer with Export/Publish actions
- web/app/(app)/tutorials/[id]/edit/page.tsx: editor (Monaco/MD) + metadata
- web/app/api/notebooks/**: listing, read-through, upload, remix, export, publish-request
- web/app/api/admin/**: moderation endpoints

## Optional Features
- Upstash KV: used only if REDIS_URL/REDIS_TOKEN present
- Server execution: not enabled yet; /api/exec returns NOT_IMPLEMENTED

## Adding a Server Sandbox
1. Implement provider in web/app/api/exec/route.ts
2. Enforce per-request limits and network policy
3. Return streamed output (SSE) for long-running cells

## Export JSON Schema (minimal)
- id: string
- title: string
- tags: string[]
- steps: { type: 'markdown'|'code'; text?; source?; lang? }[]

## Development
- npm install (in web/)
- npm run dev

## Vercel
- Root Directory: web
- Builds rely on default settings; `vercel.json` kept minimal
