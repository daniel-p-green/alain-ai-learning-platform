# ALAIN‑Kit v0.4 — Research Capsule (Spec → Bundle → Provenance)

v0.4 hardens the research phase so the output directory is a self‑contained, offline knowledge capsule for future notebook generation.

Highlights
- Spec (strict JSON) extended with versioning, tokenizer_details, license_details, gaps_unknowns.
- Bundle (MCP) downloads raw sources (HF/GitHub/papers/leaderboards/datasets), writes Markdown + code + env, and emits a rich manifest with checksums and provenance.
- Execution protocol pushes real MCP tool calls (no Harmony tokens, no invented tools).

Core prompts
- core/01-spec.strict.json.v0.4.txt — Stage 1 (structured JSON)
- core/02-bundle.offline.v0.4.txt — Stage 2 (MCP, files written under OUT_DIR/[SAFE_SLUG])

Run pattern
1) Run 01-spec with structured output (json_schema) to force a single valid JSON object.
2) Run 02-bundle with SPEC_JSON; it fetches raw artifacts, writes bundle files, and builds a provenance‑rich manifest.

Notes
- If tools are unavailable, bundle completes with Unknowns and [S#] placeholders but still writes directory structure.
- Required MCP tools: hf-mcp-server, hf-local, github-local, arxiv-local, web-local, fs-local (Allow).
