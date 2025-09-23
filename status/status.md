# ALAIN Status

- **Last updated**: 2025-09-21T23:41:18Z

| Component | Kind | Status (0-100) | Rubric Notes | Evidence | Owner | Open TODOs |
| --- | --- | --- | --- | --- | --- | --- |
| backend-execution | service | 75 | Core lesson generation/adaptation flows ship with validation and tests; SSE streaming still unmet so not beyond integrated stage. | `apps/backend/execution/lesson-generator.ts`, `apps/backend/execution/lesson-generator.test.ts`, `apps/backend/execution/teacher.ts` | [TBD] | 3 |
| backend-research | service | 50 | Happy path implemented but lacks automated tests and throttling; relies on manual QA. | `apps/backend/research/api.ts`, `resources/content/research/openai`, `apps/backend/research/TODO.md` | [TBD] | 2 |
| backend-tutorials | service | 60 | Tutorial CRUD, validation, and publication flows in place with unit tests; lacking full end-to-end coverage. | `apps/backend/tutorials/create.ts`, `apps/backend/tutorials/validation.test.ts`, `apps/backend/tutorials/TODO.md` | [TBD] | 3 |
| backend-assessments | service | 55 | Assessment APIs validated but explanations/analytics incomplete and tests focus on logic layer only. | `apps/backend/assessments/api.ts`, `apps/backend/assessments/logic.test.ts`, `apps/backend/assessments/TODO.md` | [TBD] | 2 |
| web-app | service | 60 | Generate and research flows wired with client hooks; automation coverage missing for critical journeys. | `apps/web/features/generate/GeneratePage.tsx`, `apps/web/features/research/ResearchPage.tsx`, `apps/web/TODO.md` | [TBD] | 5 |
| pkg-alain-kit | package | 50 | Provides orchestration primitives but still uses loose types and lacks automation for docs/status sync. | `packages/alain-kit/core/section-generator.ts`, `packages/alain-kit/README.md`, `packages/alain-kit/TODO.md` | [TBD] | 2 |
| alain-kit-sdk | package | 50 | CLI exists but flags and structured logs need expansion per PRD; add examples and tests. | `packages/alain-kit-sdk/index.ts`, `packages/alain-kit-sdk/README.md`, `packages/alain-kit-sdk/TODO.md` | [TBD] | 3 |
| backend-export | service | 30 | Scaffolding for export present; streaming /export endpoint not implemented. | `apps/backend/convert-to-notebook.ts`, `apps/backend/export/TODO.md` | [TBD] | 2 |
| repo-ci | infra | 30 | Initial workflow added to validate docs/tasks consistency; coverage and test matrix not configured. | `.github/workflows/consistency.yml`, `alain-ai-learning-platform/TODO.md` | [TBD] | 2 |

### CI Snapshot
- passing: false
- tests_total: 0
- coverage: 0
