#! Final Polish TODOs (ALAIN‑Kit + Runtime)

Purpose: capture post‑hackathon refinements to revisit when time allows.

## Critical
- Prompt file resolution + packaging
  - Add module‑relative resolution in `backend/execution/prompts/loader.ts` (fallback `ALAIN_PROMPT_ROOT` env) so prompts load reliably outside repo CWD.
  - Verify prompts are included in deploy artifacts (Encore/Docker). Add include/copy rule if needed.

## High
- Smoke script authentication
  - Option A: Add local demo bypass in backend when `DEMO_ALLOW_UNAUTH=1` (safe dev‑only code path) and document.
  - Option B: Update smoke scripts to accept a bearer token or hit a web API route that already supports demo bypass.

## Medium
- Loader caching + visibility
  - Add in‑memory cache (phase → {system, developer}).
  - Log info when `TEACHER_PROMPT_PHASE` is active; warn on file load failure and fallback.
- Notebook exporter prompt safety
  - Emit `PROMPT` via JSON‑stringified embedding (server‑side) instead of triple‑quotes to avoid edge cases.
- TypeScript strictness
  - Tighten types in `backend/execution/teacher.ts` (message arrays, helper returns); reduce `any` casts.
- Minimal tests
  - Unit: loader extracts system/developer and ignores examples.
  - Integration: with `TEACHER_PROMPT_PHASE` set, teacher composes messages from file + user.

## Low
- Tool‑use demo expectations
  - Note in exporter that many local endpoints won’t support tool‑calls; show normal content fallback.
- Docs polish
  - In `prompts/alain-kit/README.md` and `USER_GUIDE.md`, add a short note about packaging prompts with backend deploys.

## References
- Loader: `backend/execution/prompts/loader.ts`
- Teacher integration: `backend/execution/teacher.ts`
- Exporter: `backend/export/notebook.ts`
- Prompts: `prompts/alain-kit/*.harmony.txt`, `prompts/alain-kit/util/*`
- Smoke scripts: `scripts/smoke/hosted.sh`, `scripts/smoke/offline.sh`

