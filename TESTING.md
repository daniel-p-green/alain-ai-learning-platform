# Testing Guide (Backend + Dev Flows)

This doc explains our test layout, how to run them, and what each suite covers. There are two kinds of backend tests:
- Pure unit tests (no DB/runtime): run anywhere with Node
- DB/runtime-dependent tests: require the Encore TS runtime library

Use the convenience scripts at the repo root:
- `npm run test:pure` — runs pure unit tests only
- `npm run test:all` — runs the full backend suite (requires Encore runtime)

Or run inside `backend/` directly:
- `cd backend && npm run test:pure`
- `cd backend && npm run test:all`

## Pure Unit Tests (what they verify)

1) `backend/export/notebook.test.ts`
   - Verifies the Colab notebook builder emits:
     - Intro markdown cell (title, description, provider, model)
     - Dependency install cell (`openai`)
     - Environment/config cell (provider base URL, API key)
     - Smoke test cell (minimal completion)
     - Step prompt code cells (parameterized, no arbitrary code)
     - MCQ assessment cells (grading with explanation)

2) `backend/execution/spec/lessonSchema.test.ts`
   - Validates minimal lesson shape and error collection
   - Applies defaults (provider, difficulty, step order) and synthesizes a prompt if missing
   - Accepts unknown fields safely (generator sanitizes before validation)

3) `backend/execution/providers/aliases.test.ts`
   - Ensures canonical model names normalize per provider:
     - Poe: `GPT-OSS-20B` → `GPT-OSS-20B`
     - OpenAI-compatible: `GPT-OSS-20B` → `gpt-oss:20b`

4) `backend/utils/hf.test.ts`
   - `parseHfUrl`: only accepts `huggingface.co/owner/repo`; rejects other hosts
   - `normalizeDifficulty`: maps to `beginner|intermediate|advanced`
   - `toTags`: derives tags from owner/repo

Optional (pure) test also present:
- `backend/export/colab.test.ts` (legacy invocation of builder)

## Runtime-Dependent Tests (DB + Encore)

These suites exercise tutorial persistence, step ordering, and validation with a real SQL DB via Encore’s runtime:
- `backend/tutorials/add_step.test.ts`
- `backend/tutorials/update_step.test.ts`
- `backend/tutorials/delete_step.test.ts`
- `backend/tutorials/reorder_steps.test.ts`
- `backend/tutorials/validation.test.ts`
- `backend/assessments/logic.test.ts`

To run them:
1) Install Encore CLI (macOS: `brew install encoredev/tap/encore`)
2) Start once to fetch the runtime: `cd backend && encore run` (Ctrl+C to stop)
3) Export the runtime path (macOS/Linux):
   ```bash
   export ENCORE_RUNTIME_LIB="$(node -e "
     try { console.log(require.resolve('encore.dev/dist/internal/runtime/napi/napi.cjs').replace('napi.cjs','encore-runtime.node')) }
     catch(e){ process.exit(1) }
   ")"
   ```
   If that fails, locate `encore-runtime.node` under `node_modules/encore.dev/dist/internal/runtime/napi/` and set `ENCORE_RUNTIME_LIB` to its absolute path.
4) Run: `cd backend && npm run test:all`

## Why split tests?
- Keep fast feedback for pure logic (schema, notebook, utilities, provider aliasing)
- Allow deeper coverage (DB + migrations + step operations) when runtime is available

## Quick Troubleshooting
- Error: `ENCORE_RUNTIME_LIB not set` — run steps in Runtime-Dependent section
- Timeout talking to providers — tests never call external providers; verify you’re running pure tests
- Node version — use Node 18+ (we run on Node 20)

## What good looks like
- Pure tests: all green in < 1s
- Full suite: DB tests green once runtime is set; add_step/update_step cover ordering, validation, and progress preservation

## Bonus: Manual smoke checks
- Lesson generation (Poe vs local) — see README for curl examples
- SSE streaming — open a tutorial; verify tokens stream and `[DONE]` terminator is received

