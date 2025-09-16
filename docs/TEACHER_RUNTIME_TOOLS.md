# Teacher Runtime Tooling

This document explains how the teacher service selects and exposes tool/function schemas to models at runtime based on the active Harmony prompt phase and requested task.

## Environment Variables

- `TEACHER_PROMPT_PHASE`: Controls which Harmony prompt file is loaded.
  - Examples: `research`, `research.offline`, `design`, `develop`, `validate`, `orchestrator`, `orchestrator.offline`.
  - The service attempts to load `resources/prompts/alain-kit/<phase>.harmony.txt` (or from `ALAIN_PROMPT_ROOT` / `PROMPT_ROOT` if set).
  - Suffix flexibility: `research`, `research.harmony`, and `research.harmony.txt` all resolve to the same file.
- `TEACHER_ENABLE_TOOLS` (default: enabled): Set to `0` to disable tool exposure regardless of phase/task.
- `TEACHER_PROVIDER`: `poe` (default) or `openai-compatible`.
- `TEACHER_ALLOW_120B`: `1` to permit `GPT-OSS-120B`, otherwise auto-downgrades to `GPT-OSS-20B`.

## Tool Exposure Logic

Tools are exposed only when relevant to the active task/phase and are kept intentionally minimal to avoid maintenance bloat. The model still receives full instructions from the Harmony prompt files.

- Lesson generation (`task = lesson_generation`)
  - Tool: `emit_lesson` with a concise but structured schema for lesson outputs.
- Research prompts (when `TEACHER_PROMPT_PHASE` contains `research`)
  - Online research: `emit_research_findings`, `validate_research`
  - Offline research (when phase contains `research.offline`): `emit_offline_research`, `report_cache_issues`, `validate_offline_completeness`
- Other tasks (`assessment_creation`, `content_adaptation`)
  - No tools are auto-exposed unless you add them later.

See implementation: `alain-ai-learning-platform/apps/backend/execution/teacher.ts` in `buildToolsForPhaseTask()`.

## Notes

- Provider behavior: For `poe`, developer instructions are folded into the system message. For `openai-compatible`, developer and system messages are sent separately.
- Output parsing: If a tool call occurs, the service returns the tool call `arguments` JSON string as `content` to the caller, simplifying downstream handling.
- Schemas are minimal (use `additionalProperties: true`) on purpose to keep the surface area small while the Harmony prompts define detailed expectations.
