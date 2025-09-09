# Changelog

## v0.2.0 — Provider unification, teacher hardening, UX polish

Highlights
- Providers: Unified model aliasing across backend and web
  - New `backend/execution/providers/aliases.ts` and `web/lib/providers/aliases.ts`
  - Normalizes `GPT-OSS-20B` ↔ `gpt-oss:20b` per provider
- Teacher: Timeouts (30s), two‑try retry, role downgrade
  - Uses shared alias mapper; safer defaults for Harmony roles
- Lesson generation: Safer parsing and validation
  - Strict HF URL parsing with 5s timeout; drop unknown fields before validation
- Web UX: Reliable provider load and local hint
  - `useEffect` fix; loading/error states; Ollama setup hint next to selector
- SSE: One-shot retry on initial failure; clean `[DONE]` termination

Upgrade Notes
- No breaking API changes. For local runs, ensure `OPENAI_BASE_URL` and `OPENAI_API_KEY` are set; `TEACHER_PROVIDER` optional.

## v0.1.0 — Hackathon MVP

Highlights
- Tests: Edge-case coverage for tutorial step operations
  - add_step, update_step, delete_step, reorder_steps
  - Conflicts, cascade deletes, invalid inputs, progress preservation
- Providers: Shared Base utilities for HTTP + SSE
  - Common `httpJson`, `ensureOk`, `streamSSE`, `toAuthHeader`
  - Refactored Poe and OpenAI-compatible providers
- Execution: Rich error handling with specific codes
  - `network_timeout`, `auth_expired`, `quota_exceeded`, `provider_unavailable`, `connection_error`
  - Suggestions and retry recommendations; transient retry for timeouts/provider issues
- Versioning: Tutorial snapshots with rollback
  - `tutorial_versions` table and APIs to create/list/restore versions
  - Restores steps and clamps user progress to preserve integrity
- Analytics: Content insights for creators
  - Tutorial stats (users total/active, completion rate)
  - Step-level analytics (current vs. completed counts)
  - Top user learning paths (completed_steps patterns)

Notable Files
- Backend tests: `backend/tutorials/*.test.ts`
- Provider base: `backend/execution/providers/base.ts`
- Error handling: `backend/execution/execute.ts`
- Versioning: `backend/tutorials/versioning.ts` + migration `3_tutorial_versioning.up.sql`
- Analytics endpoints: `backend/progress/stats.ts`

Upgrade Notes
- Run Encore migrations (`encore run`) to create `tutorial_versions`.
- No breaking changes to existing APIs; new endpoints added.
