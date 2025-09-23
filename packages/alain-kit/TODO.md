# TODO pkg-alain-kit

- [ ] Replace NotebookOutline any types [tags: component=pkg-alain-kit; feature=feat-lesson-generation; priority=P1; owner=[TBD]; due=2025-10-09]
  Introduce a shared `NotebookOutline` interface and update `core/section-generator.ts` plus downstream consumers.
- [ ] Implement status sync script [tags: component=pkg-alain-kit; feature=feat-provider-config; priority=P2; owner=[TBD]; due=2025-10-23]
  Build a CLI helper that regenerates `status/status.json`, `status/status.md`, and `TASKS.md` from module TODOs.
 - [ ] Enforce notebook artifact contract validators [tags: component=pkg-alain-kit; feature=feat-lesson-generation; priority=P1; owner=[TBD]; due=2025-10-18]
   Strengthen qa-gate to enforce markdown/code ratio, placeholder bans, and metadata cell requirements across web and CLI flows; add tests.
