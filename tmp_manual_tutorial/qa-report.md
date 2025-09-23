# QA Checklist – Poe Multi-Model Chat Tutorial

## Automated Checks
- `npm run lint` (Next.js + ESLint) – ✅ Passed at 2025-09-19T01:40Z
- `npm run test` (Vitest) – ✅ 3 tests passing

## Manual Verification
- 🔍 Reviewed selector + telemetry wiring in components to ensure narrative matches the code.
- ⚠️ Streaming path not executed end-to-end in this environment because `POE_API_KEY` is not available.
- ✅ Notebook captures follow-up instructions for reviewers to run the dev server with real credentials.

## Outstanding Risks / Follow-ups
- Real Poe API call paths require a live `POE_API_KEY` in `.env.local`; notebook cautions readers but cannot validate without secret.
- Optional telemetry persistence (e.g., analytics export) left as exercise.
- No end-to-end browser automation coverage; manual click-through recommended for release.
