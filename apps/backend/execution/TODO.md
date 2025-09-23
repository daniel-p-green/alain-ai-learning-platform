# TODO backend-execution

- [ ] Ship Encore SSE streaming bridge for executeStream [tags: component=backend-execution; feature=feat-lesson-generation; priority=P1; owner=[TBD]; due=2025-10-10]
  The Encore API currently returns `not_supported` for `/execute/stream`. Acceptance criteria: wire provider streaming responses through Encore, add regression coverage, and document fallback expectations in docs/AGENTS.md.
- [ ] Instrument adaptation + repair latency metrics [tags: component=backend-execution; feature=feat-content-adaptation; priority=P2; owner=[TBD]; due=2025-10-17]
  Add structured metrics/timing around `adaptContent` and repair flows, publish to Encore metrics, and expose dashboards or logs for ops review.
 - [ ] Align API surface with PRD endpoints [tags: component=backend-execution; feature=feat-lesson-generation; priority=P1; owner=[TBD]; due=2025-10-14]
   Provide route parity or documented aliases for `/generate/outline`, `/generate/section`, `/generate/notebook`, `/validate`, `/export`, `/providers` as specified in PRD §7.3. If renaming is breaking, add non-breaking aliases and update web/SDK callers.
- [ ] Enforce retry/backoff budgets per PRD NFRs [tags: component=backend-execution; feature=feat-lesson-generation; priority=P2; owner=[TBD]; due=2025-10-21]
  Implement ≥3 retries with jitter for outline/section/repair phases and log final success with attempt counts.
 - [ ] Scale concurrency to 30 parallel generations [tags: component=backend-execution; feature=feat-lesson-generation; priority=P2; owner=[TBD]; due=2025-10-25]
   Implement queue/backoff to target PRD scalability (≈30 concurrent); add configuration knobs and load-test plan.
