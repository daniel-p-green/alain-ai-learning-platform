# ALAIN‑Kit v0.2c — Research Offline Bundler (Fallback‑Ready)

Purpose
- Iteration on v0.2a focused on always completing an offline, source‑ready research bundle.
- Adds a robust No‑Tools Fallback and accepts optional spec JSON from a prior v0.2b/v0.2d run.

Key Behaviors
- Always emits final bundle content only (no tool logs, no “Thinking…”, no channel tokens).
- If MCP tools are available: fetch, normalize, and package sources.
- If tools are unavailable/fail: produce the same bundle with Unknowns and [S#] placeholders and a manifest stub.
- Optionally consumes `SPEC_JSON` from a prior spec extractor to pre‑fill fields.

Files
- core/01-research.offline-bundle.v2c.txt — main prompt
