# ALAIN‑Kit v0.3 — Two‑Phase Research (Spec → Bundle)

v0.3 consolidates lessons from v0.2x:
- A strict, short JSON Spec Extractor that never hallucinates and cites sources
- A compact Offline Bundler that consumes the JSON spec, uses MCP tools, and always completes

Core prompts
- core/01-spec.strict.json.v0.3.txt — Stage 1 (structured JSON)
- core/02-bundle.offline.v0.3.txt — Stage 2 (Markdown/code + sources via MCP)

Run pattern
1) Run 01-spec with structured outputs (json_schema) so the model returns a single valid object.
2) Feed that JSON to 02-bundle as SPEC_JSON; the bundler fetches raw artifacts via MCP and writes files under OUT_DIR.

Notes
- If tools are unavailable, bundler writes Unknowns and [S#] placeholders but still produces the directory.
- Prefer primary sources (HF, official GitHub/docs/blog, papers) and record Disputed where claims conflict.
