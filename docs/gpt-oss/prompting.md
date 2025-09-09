# GPT‑OSS Prompting Patterns

- Structure: role → goal → constraints → output format → examples.
- JSON/Structured: enforce with clear schemas; validate outputs; add repair step.
- Temperature: low (0–0.3) for tests; moderate for ideation; keep max tokens bounded.
- Stop sequences: define to avoid trailing commentary when emitting JSON.
- Few‑shot: align examples to rubric; include counter‑examples for edge behavior.
- Safety: include allowed/forbidden content brief; handle refusals gracefully.

