# Research Output Rubric (v0.3)

This rubric grades the two‑phase research flow: Stage 1 (Spec JSON) and Stage 2 (Offline Bundle). Total 100 points. A run is “ready to ship” when the total ≥ 85 and there are no critical failures.

## Stage 1 — Spec JSON (60 pts)

- Truthfulness & Citations (20)
  - All non‑Unknown facts include ≥ 1 primary source URL (Hugging Face, official org GitHub/docs/blog, or paper). No speculation terms (e.g., “~”, “likely”, “maybe”).
  - Disputed claims recorded with competing evidence and dates.
- Completeness of Core Fields (15)
  - Required keys present: identity.aliases, technical_specs.{architecture,parameters,context_window,tokenizer,license}, inference.{servers,min_hardware,quantization}, evals[], sources[], disputed[], notes. Unknown allowed but must be explicit: "Not specified" with `notes: "unverified"`.
- Structured Output Compliance (10)
  - Valid against v0.3 spec schema. JSON‑only, no preface.
- Versioning & Dates (10)
  - Each source has accessed_date; where applicable include revision/tag/commit SHA or arXiv vN in notes.
- Licensing Accuracy (5)
  - SPDX ID or explicit "Not specified"; redistribution/finetune notes align with the source text.

## Stage 2 — Offline Bundle (40 pts)

- MCP Tool Use & Artifacts (15)
  - HF README/config/tokenizer/license fetched; GitHub releases or README fetched; arXiv paper located (PDF saved if available) using whitelisted MCP tools. Files saved under OUT_DIR via fs‑local. Manifest includes sha256 and revision when applicable.
- Packaging Structure (10)
  - Required files exist: README.md, TECH_SPECS.md, EVALS.md, COOKBOOK.md, LICENSE_NOTES.md, TROUBLESHOOTING.md, requirements.txt, .env.example, code/{inference.py, finetune.py, run.sh}, sources/{manifest.jsonl,...}, CHANGELOG.md.
- Consistency with Spec (10)
  - Markdown facts match Spec JSON or are marked Unknown; [S#] tags map to manifest entries.
- Evals & Reproducibility (5)
  - EVALS.md tables include dataset/version/metric/harness. requirements.txt has pinned versions (or TBD noted with rationale).

## Pass thresholds
- Ready to ship: ≥ 85 AND no critical failures (invalid JSON, missing license, zero primary sources, or no tool artifacts when tools available).
- Needs fixes: 70–84 or any critical failure present.
- Redo: < 70.

## Grader outputs
- research_grade.json: machine‑readable scorecard
- research_grade.md: brief human‑readable report

## Automation notes
- For primary sources, treat `source_type` in { hf, github, paper } as primary; others are secondary.
- Speculation term regex (case‑insensitive): `\b(likely|maybe|approximately|approx\.?|around|circa)\b|~`.
- URL checks: prefer https; HEAD checks optional.
