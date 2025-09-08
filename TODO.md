# ALAIN MVP – Strategic TODOs (Open Source Hackathon 2025)

This is the prioritized, working checklist to complete the MVP.

## Decisions
- [x] Primary UI on `web/` (Next.js App Router + Clerk)
- [ ] De‑emphasize/retire Vite UI or keep only for marketing
- [x] Single streaming path via Encore SSE (`/execute/stream`)

## Backend (Encore)
- [x] Raw SSE endpoint with heartbeats and [DONE]
  - `backend/execution/stream.ts`
- [x] 120s timeout + AbortController
- [x] Simple per‑user rate limit (30 RPM)
- [x] Clerk JWT verification for SSE and non‑streaming execute
  - `backend/auth.ts`, `backend/execution/{stream.ts,execute.ts}`
- [x] Provider registry (poe, openai‑compatible) with execute/stream
  - `backend/execution/providers/*`
- [ ] Provider capabilities endpoint (names + models, stream flag)
  - New: `backend/execution/capabilities.ts` → `GET /providers`
- [ ] Health endpoints for each service
  - New: `backend/*/health.ts` → `GET /health`
- [ ] Structured logging (redact secrets) and request IDs
- [ ] CORS check/allowlist for `web` → `backend` (dev/local + prod)

## Web App (Next.js + Clerk)
- [x] Clerk App Router setup (middleware + provider)
- [x] Streaming endpoint (App Router) for demo; rate limit (30 RPM)
- [x] Provider registry (web) with execute/stream
- [x] Tailwind setup and basic catalog/player pages
  - `web/app/tutorials/page.tsx`, `web/app/tutorial/[id]/page.tsx`
- [ ] Decide final streaming source for UI:
  - [ ] Proxy Encore SSE from `web/app/api/execute` (forward Clerk token)
  - [ ] Or call Encore SSE directly from the client (send Clerk JWT)
- [ ] Player polish
  - [ ] Cancel (AbortController) while streaming
  - [ ] Token/time budget indicators
  - [ ] Friendly error banners/states
  - [ ] Split components: `PromptCell`, `StreamingOutput`, `StepNav`
- [ ] Monaco editor stub (dynamic import; fallback to textarea)
- [ ] Catalog filters + pagination (use backend `page`, `pageSize`, `tags`, `difficulty`)
- [ ] Style header/landing with Tailwind; link to catalog and stream demo

## Vite Frontend (optional)
- [ ] Either retire it or:
  - [ ] Add Clerk React to Vite and forward JWT
  - [ ] Stream from Encore SSE with cancel/error handling

## Secrets & Config
- [x] Remove tracked `.env` and ignore `.env*`
- [x] `web/.env.local.example` with placeholders (Clerk + providers)
- [ ] Move provider keys into Encore secrets
  - `encore secrets set POE_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`
- [ ] Document `CLERK_JWT_ISSUER` for Encore token verification
- [ ] Update DEVELOPMENT.md with token forwarding and SSE flow

## Diagnostics & Hardening
- [ ] Align error mapping to spec taxonomy across web/backend
  - `invalid_request | auth_error | model_not_found | timeout | rate_limited | provider_unavailable | internal`
- [ ] SSE abort handling on server close (`ctx.res` close event)
- [ ] Add provider capabilities UI consumption if needed

## Content & Seed
- [x] Seed 1 tutorial with 2 steps
  - `backend/tutorials/seed.ts`
- [ ] Validate seed shows in catalog and streams end‑to‑end
- [ ] (Optional) Add a second seed tutorial for variety

## Repo Hygiene
- [ ] Add `.DS_Store` ignores repo‑wide and remove any committed ones
- [x] `.gitignore` excludes `.env*`, `.next`, `dist`, `out`

## Demo Readiness
- [ ] End‑to‑end runbook:
  - Sign in on `web/`, open catalog, open tutorial, run streaming step via Encore SSE, cancel works
  - Filters/pagination usable
  - Health endpoints OK; rate limit errors friendly
- [ ] Optional: record short demo and tag a release

---

Owner notes
- Backend is secured for writes and execute; finalize model capability surface and health endpoints.
- Frontend should consolidate on `web/`, add Monaco stub, and wire streaming to Encore.
- Secrets must live in Encore and `web/.env.local` only (placeholders in repo).

