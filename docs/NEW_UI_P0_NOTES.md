# New UI (P0) — Notes & Flags

This document summarizes the P0 implementation work, feature flags, and how to verify.

## What changed
- New page: `/home` — simplified hero + clear CTAs.
- New shell applied to default `/generate`, `/tutorials`, `/tutorial/[id]`, and `/settings` via a route group layout `(app)`; legacy Generate kept at `/v1/generate`.
- NavBar links now point to `/generate` (new shell) directly. Optional `New Home` link is still flag‑gated.
- Generate page:
  - Hides the "Force fallback mode" checkbox unless `NEXT_PUBLIC_ENABLE_FALLBACK_UI=1`.
  - Hides the "Web-only" research option unless enabled via the same flag.
  - Uses a typed API parser for responses (`web/lib/api.ts` + `web/lib/schemas.ts`).
- Testing:
  - Added Vitest config and unit tests for schemas and API response parsing.

## Feature flags (build-time)
- `NEXT_PUBLIC_NEW_HOME=1` — add a "New Home" link and enable `/home` trial.
- `NEXT_PUBLIC_ENABLE_FALLBACK_UI=1` — show fallback checkbox and web-only research option on Generate.

## Files
- Pages: `web/app/home/page.tsx`, `web/app/(app)/layout.tsx`, `web/app/(app)/generate/page.tsx`, `web/app/v1/generate/page.tsx`
- Nav: `web/components/NavBar.tsx` (flagged links)
- Generate tweaks: `web/app/generate/page.tsx`
- Typed API: `web/lib/schemas.ts`, `web/lib/api.ts`
- Tests: `web/__tests__/schemas.test.ts`, `web/__tests__/api-parse.test.ts`, `web/vitest.config.ts`
- Requirements: `docs/REQUIREMENTS_UI_MVP.md`

## Verify locally
1. `cd web && npm install`
2. `npm run dev` and set flags in `.env.local`:
   - `NEXT_PUBLIC_NEW_HOME=1`
   - `NEXT_PUBLIC_NEW_SHELL=1`
3. Visit `/home`, then click Generate (should go to `/new/generate`).
4. Go to `/generate` (legacy) to confirm no regressions.
5. Run unit tests: `npm run test` (all green).
6. Run e2e smokes: `npm run test:e2e` (home and generate load with expected CTAs).

## Aggregator (seed)
- JSON API: `GET /api/aggregator/index` returns curated items.
- Seed sources tracked in `hackathon-notes/notebooks-index.yml` and `web/data/notebooks-index.json`.
- See `docs/NOTEBOOKS_AGGREGATOR.md` for details. No UI claims added; viewer remains read‑only.

## Cleanup & scope discipline
- No global CSS or token changes; all work is additive and behind flags.
- No migrations; existing routes and APIs unchanged.
- Fallback UI is opt-in for Vercel demos only.

## Next (P1 suggestion)
- Tutorials gallery + detail inside the new shell.
- Settings environment cards + smoke tests UI polish.
- Playwright smoke tests for generate → export and tutorial view.
