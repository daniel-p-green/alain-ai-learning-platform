# Agent Operations

## Purpose
Centralize the upkeep rules ALAIN agents must follow so orchestration docs, TODOs, and status layers stay current while features evolve.

## Standing Instructions
- Keep `docs/AGENTS.md` synchronized: add/edit summary rows, detailed subsections, and environment notes whenever capabilities, entrypoints, or dependencies change.
- Update `specs/spec.json` and `docs/SPEC.md` when agents gain new responsibilities or acceptance criteria shift.
- Maintain `status/status.json` + `status/status.md`: adjust component status scores, rubric notes, and evidence when delivery confidence changes.
- Ensure every source directory touched by an agent has an up-to-date `TODO.md` with checked/unchecked items reflecting reality.
- Record ownership metadata (`owner`, `priority`, `due`) on TODO entries; unresolved owners should be surfaced as `[TBD]` and added to the open questions list in `docs/SPEC.md`.

## Daily Checklist
1. Review provider health dashboards or manual smoke tests; update TODOs if outages or degraded configs are detected.
2. Scan agent logs for schema validation failures or repair retries; capture follow-up tasks in the relevant `TODO.md`.
3. Confirm `status/status.json` timestamp is <48h old; if stale, refresh component scores and push updates.
4. Verify new agents or features introduced in the last 24h made it into `docs/AGENTS.md`, `specs/spec.json`, and `TASKS.md`.

## Per-PR Checklist
1. Identify affected agents; update their detail section and summary row fields (entrypoints, tools, status, last_updated).
2. Modify `docs/SPEC.md` + `specs/spec.json` when acceptance criteria, dependencies, or feature status changes.
3. Adjust `status/status.json` + `status/status.md` with new scores, rubric notes, TODO counts, and evidence paths.
4. Sync module `TODO.md` files: add new tasks with metadata or check off completed ones; rerun `TASKS.md` aggregation.
5. Validate relevant tests (`npm test -- <suite>` or `vitest run`) and note coverage gaps in TODOs if not addressed.
6. Include release notes for prompt or schema changes in the PR description referencing updated docs.

## Escalation & Ownership
- Assign a human owner for each agent in the summary table; until ownership is resolved, keep `[TBD]` and log the gap under "Open Questions" in `docs/SPEC.md`.
- If a destructive change (schema removal, data wipe) is required, pause work and record the blocker under `MAINTENANCE.md#Blocked changes` before proceeding.
- Emergent incidents (provider downtime, data corruption) should update the relevant TODO entry to `priority=P1` and trigger an ownership ping via Slack/Email per team norms.

## Tooling
- `npm test --workspaces` (or targeted Vitest suites) for backend agents.
- `bun run lint` / `npm run lint` where applicable before shipping orchestrator changes.
- Optional script: `node scripts/summarize-status.mjs` (to be implemented) for auto-syncing status JSON ↔ Markdown.

## Record Keeping
- After each ops cycle, update `last_updated` timestamps in docs/AGENTS.md, specs/spec.json, and status/status.json to reflect the review.
- Archive resolved TODO items monthly and maintain closed history for auditability if required by compliance.
