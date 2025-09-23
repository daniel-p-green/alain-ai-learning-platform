# TODO backend-research

- [ ] Add regression tests for research-runner [tags: component=backend-research; feature=feat-model-research; priority=P1; owner=[TBD]; due=2025-10-08]
  Provide Vitest coverage for `runResearch` happy path and offline cache mode using fixture directories.
- [ ] Throttle research runs per user [tags: component=backend-research; feature=feat-model-research; priority=P2; owner=[TBD]; due=2025-10-22]
  Implement rate limiting for `/research/run` similar to generation endpoints and log when throttled.
