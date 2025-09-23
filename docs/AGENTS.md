# ALAIN Agents Guide (AGENTS.md)

This document defines how AI coding agents (e.g., Codex CLI, Cursor, Continue, Cline) work on this repo. It sets expectations, provides prompts and checklists, and includes a lean test and debugging workflow tailored to ALAIN’s architecture and hackathon goals.

## Project Context
- Purpose: ALAIN converts Hugging Face model cards into high-quality, interactive lessons (3–5 steps) that learners can run through structured model calls.
- Teacher models: GPT-OSS-20B (primary) with optional GPT-OSS-120B when explicitly enabled.
- Providers (current):
  - Poe API router at `https://api.poe.com/v1`.
  - OpenAI-compatible endpoints via `OPENAI_BASE_URL` + `OPENAI_API_KEY` (BYOK, Ollama/vLLM).
- Execution surface: No arbitrary code execution; requests submit `{model, messages, parameters}` and parse JSON regulated by `spec/lesson.schema.json`.

### Agent Summary Table
| agent | purpose | entrypoints | tools | owner | status | last_updated |
| --- | --- | --- | --- | --- | --- | --- |
| teacher-router | Harmonize prompts and route GPT-OSS requests for lesson/assessment flows | `apps/backend/execution/teacher.ts` (`teacherGenerate`) | Harmony prompt loader, provider alias map, Poe/OpenAI-compatible fetch | [TBD] | 70 | 2025-09-21T23:41:18Z |
| lesson-generator | Produce schema-valid lessons from HF URLs or briefs and persist tutorials | `/lessons/generate`, `/lessons/generate-from-text` | `generateLessonContent`, `teacherGenerate`, Encore SQL tutorials DB | [TBD] | 75 | 2025-09-21T23:41:18Z |
| lesson-repair | Repair invalid lessons via targeted teacher prompts | `/lessons/repair` | `teacherGenerate`, `validateLesson`, `applyDefaults` | [TBD] | 60 | 2025-09-21T23:41:18Z |
| content-adaptation | Adapt lesson steps in response to learner performance | `/adapt` | `teacherGenerate`, rate limiter, env guard | [TBD] | 60 | 2025-09-21T23:41:18Z |
| research-runner | Aggregate research artifacts for HF models | `/research/run` | `researchModel`, filesystem writers, optional offline cache | [TBD] | 50 | 2025-09-21T23:41:18Z |

### Agent Details
#### teacher-router
- **Purpose**: Orchestrate GPT-OSS teacher calls, enforce provider downgrades, and compose Harmony prompts for lesson, assessment, and adaptation tasks.
- **Entrypoints**: `apps/backend/execution/teacher.ts:40` (`teacherGenerate` Encore API, internal only).
- **Inputs**: Model id, task kind (`lesson_generation`, `assessment_creation`, `content_adaptation`), message history, optional provider override, temperature/max tokens overrides.
- **Outputs**: JSON or markdown strings; tool-call arguments when Harmony tool schemas are enabled.
- **Tools/Deps**: `apps/backend/execution/prompts/loader.ts`, `apps/backend/execution/providers/aliases.ts`, external Poe/OpenAI-compatible APIs.
- **Config/Env**: Requires `POE_API_KEY` for Poe; `OPENAI_BASE_URL`, `OPENAI_API_KEY` when provider set to openai-compatible; optional `TEACHER_ALLOW_120B`, `TEACHER_PROVIDER`, `TEACHER_PROMPT_PHASE`.
- **Owner**: [TBD]
- **Tests**: `apps/backend/execution/teacher.test.ts`, `apps/backend/execution/teacher.routing.test.ts` (Vitest, mocked providers).
- **Status_0_100**: 70 (Integrated routing with guardrails; live streaming still proxied through Next.js).
- **Last_updated**: 2025-09-21T23:41:18Z

#### lesson-generator
- **Purpose**: Turn Hugging Face URLs or raw briefs into validated lessons, run repair fallback, and persist tutorials with metadata.
- **Entrypoints**: `apps/backend/execution/lesson-generator.ts:54` (`POST /lessons/generate`); `apps/backend/execution/lesson-generator.ts:214` (`POST /lessons/generate-from-text`).
- **Inputs**: HF URL or text brief, difficulty level, teacher model choice, provider override, include assessment/reasoning flags, optional custom prompt context.
- **Outputs**: Lesson JSON aligned with `spec/lesson.schema.json`, plus metadata like repair usage and reasoning summary.
- **Tools/Deps**: `generateLessonContent`, `persistLessonArtifacts`, `teacherGenerate`, schema validator (`apps/backend/execution/spec/lessonSchema.ts`).
- **Config/Env**: Rate limits via `GENERATE_MAX_RPM`, concurrency guard `GENERATE_MAX_CONCURRENCY`, provider defaults via `TEACHER_PROVIDER`, offline mode toggles.
- **Owner**: [TBD]
- **Tests**: `apps/backend/execution/lesson-generator.test.ts`, `apps/backend/execution/generate_import.integration.test.ts`.
- **Status_0_100**: 75 (End-to-end path wired with validation and persistence; relies on manual QA for repair edge cases).
- **Last_updated**: 2025-09-21T23:41:18Z

#### lesson-repair
- **Purpose**: Apply targeted fixes to previously generated lessons using the teacher agent, ensuring outputs meet schema requirements.
- **Entrypoints**: `apps/backend/execution/repair.ts:21` (`POST /lessons/repair`).
- **Inputs**: HF URL, difficulty, optional teacher model, list of repair flags (`add_description`, `add_intro_step`, `compact_steps`).
- **Outputs**: Corrected lesson JSON or structured error payloads describing failure type.
- **Tools/Deps**: `teacherGenerate`, `applyDefaults`, `validateLesson`, `parseHfUrl`.
- **Config/Env**: Shares provider secrets with teacher; respects `TEACHER_PROVIDER` and `TEACHER_ALLOW_120B`.
- **Owner**: [TBD]
- **Tests**: `apps/backend/execution/repair.test.ts` (mocked teacher responses).
- **Status_0_100**: 60 (Feature complete with unit coverage; lacks telemetry on repair success rates).
- **Last_updated**: 2025-09-21T23:41:18Z

#### content-adaptation
- **Purpose**: Generate adapted lesson copy conditioned on learner performance to keep tutorials aligned with ability level.
- **Entrypoints**: `apps/backend/execution/adapt.ts:24` (`POST /adapt`).
- **Inputs**: Current markdown content, user performance score (0–100), target difficulty, optional provider override and metadata.
- **Outputs**: Adapted markdown string or structured error object (rate limits, validation, auth).
- **Tools/Deps**: `teacherGenerate`, rate limiter `apps/backend/utils/ratelimit.ts`, auth guard `apps/backend/auth.ts`.
- **Config/Env**: `ADAPT_MAX_RPM` for throttling, same provider secrets as teacher.
- **Owner**: [TBD]
- **Tests**: `apps/backend/execution/adapt.test.ts` (Vitest, mocked teacher agent).
- **Status_0_100**: 60 (Core path covered with validation; integration with tutorial UI still manual).
- **Last_updated**: 2025-09-21T23:41:18Z

#### research-runner
- **Purpose**: Gather research artifacts (benchmarks, quantization, recommended parameters) for specified Hugging Face models.
- **Entrypoints**: `apps/backend/research/api.ts:23` (`POST /research/run`).
- **Inputs**: Model repo (`provider/model`), optional offline cache flag, tokens (GitHub, Kaggle) for deeper scraping.
- **Outputs**: Directory path to artifacts and parsed summary JSON.
- **Tools/Deps**: `apps/backend/utils/research.ts` (`researchModel`), filesystem IO, optional external APIs.
- **Config/Env**: Uses process env for tokens when provided; no dedicated rate limits yet.
- **Owner**: [TBD]
- **Tests**: None (relies on manual QA and downstream consumers).
- **Status_0_100**: 50 (Core flow works but lacks automated validation and throttling).
- **Last_updated**: 2025-09-21T23:41:18Z

## Key Files & Contracts
- `spec/lesson.schema.json`: Canonical lesson schema (v1.0.0) enforced by generation and repair agents.
- `apps/backend/execution/teacher.ts`: Teacher router contract; updates require prompt alignment and provider compatibility notes.
- `apps/backend/execution/lesson-service.ts`: Shared prompt builders, repair helpers, and artifact persistence logic.
- `apps/backend/research/api.ts`: Research agent entrypoint writing under `resources/content/research`.
- `apps/backend/tutorials/validation.ts`: Tutorial schema guard; keep in sync with lesson schema when extending fields.
- `packages/alain-kit/core/orchestrator.ts`: Shared orchestration primitives used by backend agents and CLI flows.

## Agent Ground Rules
- Plan first: propose a concise plan before editing orchestrator or provider logic; minimize diff surface.
- Honor schemas: any change to lesson JSON structure must update `spec/lesson.schema.json` plus validation tests.
- Contain secrets: never log provider keys; use Encore secrets or local overrides documented in Settings.
- Preserve safety rails: keep rate limits, provider downgrades, and schema validation active even in demos.

## Environment & Settings
- Required env: `POE_API_KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `CLERK_JWT_ISSUER`; optional `TEACHER_ALLOW_120B`, `OFFLINE_MODE`.
- Provider defaults configured via Settings UI (`apps/web/features/onboarding-settings`) and `validateBackendEnv` enforces server prerequisites.
- Streaming: use Next.js endpoint `/api/execute` for SSE; Encore `executeStream` intentionally returns not_supported.

## Recommended Agent Workflow
1. Understand the task
   - Inspect relevant agents (`docs/AGENTS.md`), schema files, and Settings defaults before coding.
2. Outline a micro-plan
   - Example: “Tighten lesson validation → update repair prompts → add regression test → refresh docs.”
3. Implement surgically
   - Touch the smallest module set; keep orchestrator helpers in `apps/backend/execution` or `packages/alain-kit`.
4. Validate locally
   - Run Vitest suites (module-scoped) and manual provider smoke tests through Settings.
5. Update docs
   - Amend this file, `docs/SPEC.md`, and related TODO/status entries if capabilities or dependencies change.
6. Summarize for review
   - Call out provider/config changes, schema bumps, and new env requirements.

## Tests (Lightweight, High-Signal)
- Vitest unit suites under `apps/backend/execution` (`lesson-generator.test.ts`, `teacher.test.ts`, `adapt.test.ts`, `repair.test.ts`).
- Integration smoke: `apps/backend/execution/generate_import.integration.test.ts` (requires Encore runtime and mocked teacher).
- Tutorial validation: `apps/backend/tutorials/validation.test.ts` ensures CRUD payloads remain schema compliant.
- Frontend checks: `apps/web` Vitest stories plus Playwright e2e (`apps/web/e2e`) for generate/research flows (manual run recommended).

## Debugging Playbook
- 401/403: verify Clerk auth context and provider keys; check Encore logs for `requireUserId` failures.
- Empty lesson output: inspect `teacherGenerate` logs for downgraded providers; validate prompt phase existence.
- Schema violations: run `npm test -- lesson-generator` and `spec/lesson-validate-repair.ts` to locate failing fields.
- Rate limits: check Encore metrics (`execution_requests_total`, `teacher_execute_failures_total`) and adjust RPM env vars for load tests.
- Research failures: confirm HF URL formatting and offline cache state; review `researchModel` fetch exceptions.

## Iterative Improvements
- Reliability: add replayable fixtures for research runs; log repair success/fail counts for lesson generator.
- UX: surface adaptation results inline in tutorials and add copy-to-clipboard for JSON previews.
- Observability: publish structured metrics for repair attempts, adaptation latency, and research duration.
- Provider matrix: automate provider smoke tests via CI and extend alias maps for new GPT-OSS releases.

## Prompts (Templates)
- Teacher Harmony: update `apps/backend/execution/prompts` when adjusting phases; keep system/developer/user roles deterministic.
- Repair: use `spec/lesson-validate-repair.ts` contract; ensure prompts forbid markdown wrappers around JSON.
- Adaptation: keep responses markdown-only with explicit instructions in the user prompt; avoid tool mode.

## Definition of Done (Agent Checklist)
- Lesson outputs validate against schema and persist to tutorials without manual fixes.
- Provider routing handles Poe + OpenAI-compatible paths with clear downgrade messaging.
- Tests updated/added for new scenarios; Vitest suites pass locally.
- Docs/Spec/Status/TODO entries refreshed to reflect capability changes.

## Contributing Notes (for Agents & Humans)
- Keep diffs focused; do not refactor shared orchestration unless necessary for the task.
- Isolate environment tweaks (env defaults, provider settings) and document in Settings + MAINTENANCE.md.
- When adding agents, extend the summary table, add a detailed subsection, and update `specs/spec.json` + `status/status.json`.

---

Appendix: Quick Commands
- Validate lesson JSON: `ts-node spec/lesson-validate-repair.ts path/to/lesson.json`
- Run execution tests: `cd apps/backend && npm test -- lesson-generator`
- Research smoke (manual): `curl -X POST localhost:4000/research/run -d '{"model":"gpt-oss-20b","provider":"openai"}'`
