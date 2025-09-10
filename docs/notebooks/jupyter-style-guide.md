# Jupyter Style Guide

- One idea per cell: keep code and explanations small and focused.
- Clear headings: use H2 for sections, H3 for steps; title case.
- Outputs: keep them tidy; avoid printing large blobs; truncate when needed.
- Naming: readable snake_case for variables and functions; avoid single letters.
- Re‑run safety: make cells idempotent; guard network calls; cache expensive steps.
- Imports: top of the notebook or first code cell; group stdlib/third‑party/local.
- Comments: explain “why” briefly; keep code self‑explanatory for “what”.
- Visuals: small, labeled charts; add captions and alt text.
- Links: point to docs or references near first use of a concept.
- Exercises: end of each section include 1–2 short “Try this” items.

Docs Conventions
- Titles: use title case for H2/H3; keep headings concise and parallel.
- Dashes: prefer en dashes for ranges/contrasts in prose; use ASCII hyphens in code.
- Newlines in prints: avoid embedding literal newlines in strings that can confuse exporters; prefer `print(); print(text)` over `print('\n'+text)` in templates.
- Links: use repository‑relative paths like `alain-ai-learning-platform/docs/...` when cross‑referencing.
- Snippets with network calls: add a note to skip/guard in CI and offline runs.
