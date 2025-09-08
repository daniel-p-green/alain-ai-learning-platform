# Changelog

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
