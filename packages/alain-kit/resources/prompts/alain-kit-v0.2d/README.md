# ALAIN‑Kit v0.2d — Research Spec Extractor (Strict JSON)

Purpose
- Iteration on v0.2b to eliminate speculation and enforce citations.
- Returns a single JSON object with verified fields and source lists.

Key Behaviors
- JSON‑only output; no preface/preamble; begins with `{` and ends with `}`.
- If a field is not verified from primary sources, set to "Not specified" and include notes: "unverified".
- Every non‑Unknown fact must include at least one source URL.
- Add a Disputed array for conflicting claims with evidence.

Files
- core/01-research.spec-json.v2d.txt — main prompt
