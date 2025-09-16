# New UI (P0) — Notes & Flags

This document summarizes the P0 implementation work, feature flags, and how to verify.

## What changed
- New home at `/` — simplified hero + clear CTAs.
- App shell applied to `/generate`, `/notebooks`, `/notebooks/[id]`.
- NavBar links now point to `/generate` directly.
- Generate page:
  - Hides the "Force fallback mode" checkbox unless `NEXT_PUBLIC_ENABLE_FALLBACK_UI=1`.
  - Hides the "Web-only" research option unless enabled via the same flag.
  - Uses a typed API parser for responses (`apps/web/lib/api.ts` + `apps/web/lib/schemas.ts`).
- Testing:
  - Added Vitest config and unit tests for schemas and API response parsing.

## Feature flags (build-time)
- `NEXT_PUBLIC_SITE_URL` — used for absolute Open Graph/Twitter image URLs.
- `NEXT_PUBLIC_ENABLE_FALLBACK_UI=1` — show fallback checkbox and web-only research option on Generate.

## Files
- Pages: `apps/web/app/page.tsx`, `apps/web/app/layout.tsx`, `apps/web/app/generate/page.tsx`
- Nav: `apps/web/components/NavBar.tsx`
- Generate tweaks: `apps/web/app/generate/page.tsx`
- Typed API: `apps/web/lib/schemas.ts`, `apps/web/lib/api.ts`
- Tests: `apps/web/__tests__/schemas.test.ts`, `apps/web/__tests__/api-parse.test.ts`, `apps/web/vitest.config.ts`
- Requirements: `docs/REQUIREMENTS_UI_MVP.md`

## Verify locally
1. `cd web && npm install`
2. `npm run dev` and optionally set flags in `.env.local`:
   - `NEXT_PUBLIC_ENABLE_FALLBACK_UI=1`
3. Visit `/`, then click Generate.
4. Run tests: `npm run test` (all green).

## Cleanup & scope discipline
- No global CSS or token changes; all work is additive.
- No migrations; existing routes and APIs unchanged.
- Fallback UI is opt-in for Vercel demos only.

## Next (P1 suggestion)
- Tutorials gallery + detail inside the new shell.
- Settings environment cards + smoke tests UI polish.
- Playwright smoke tests for generate → export and tutorial view.
