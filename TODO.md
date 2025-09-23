# TODO repo-ci

- [ ] Establish CI with test + coverage reporting [tags: component=repo-ci; feature=feat-provider-config; priority=P1; owner=[TBD]; due=2025-10-12]
  Configure GitHub Actions (or equivalent) to run workspace tests, report coverage, and update `status/status.json` snapshots.
- [ ] Provider smoke tests in CI [tags: component=repo-ci; feature=feat-provider-config; priority=P2; owner=[TBD]; due=2025-10-26]
  Add mocked/provider-agnostic smoke tests to detect routing regressions (Poe/OpenAI-compatible) without real keys.
