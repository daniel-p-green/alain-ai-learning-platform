# Accuracy Checklist (UI + Copy)

Use this checklist before merging UI changes or updating copy. It aligns with DEVPOST_Accuracy_Review.md.

- Schema-first
  - [ ] All API responses are parsed with Zod (no raw JSON in components).
  - [ ] Error surfaces use normalized `{message, details?}` without stack traces.

- Execution safety
  - [ ] No server-side arbitrary code execution paths exposed by the UI.
  - [ ] All executions are parameterized and routed through vetted endpoints.

- Provider parity
  - [ ] Hosted and local flows use the same request shape where applicable.
  - [ ] UI hides or disables options that are not configured or unavailable.

- Claims vs. code
  - [ ] Every capability shown in the UI maps to a present code path.
  - [ ] No implied support for providers/features that are not implemented.

- Cost and reliability
  - [ ] Preflight or environment status appears in Settings (not global nav).
  - [ ] Any token/cost hints are labeled as estimates.

- Licensing and attribution
  - [ ] Attribution appears when showing third-party assets or content.
  - [ ] Non-derivative sources are treated as annotate-only (no remix claim).

- Copy tone (optional)
  - [ ] Active voice, short sentences, no em dashes.
  - [ ] Avoid unverifiable claims; keep statements factual.

- Tests
  - [ ] Unit tests updated or added for new schemas or parsers.
  - [ ] Happy-path smoke verified locally (Generate → Preview → Export).

