# Notebook Testing Patterns

- Smoke tests: small notebooks that no‑op without API keys; fast to run.
- Golden sets: 10–20 item fixtures for accuracy or exact‑match checks.
- Deterministic runs: temperature near 0 and seeds set for eval cells.
- nbmake: execute notebooks in CI; fail on exceptions; set timeouts.
- Parameterization: use papermill for data‑driven runs; keep parameters at top.
- Regression: keep a handful of cases to catch prompt or API changes.

