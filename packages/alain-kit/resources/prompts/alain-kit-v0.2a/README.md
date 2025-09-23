# ALAIN‑Kit v0.2a — Prompts (Versioned)

This directory contains the v0.2a prompt set for ALAIN‑Kit. It introduces the Research Bundle v2 prompt for deep, tool‑assisted model research and offline packaging.

Highlights in v0.2a
- Research Bundle v2: tightly scoped to download/normalize model cards, fetch cookbooks, convert papers to Markdown, cross‑check facts, and package an offline bundle with manifest + checksums.
- Embedded authoritative source links and search hints to guide the web search tool.
- Strict revision pinning (Hub revision, Git SHA, arXiv vN). No floating branches.

Structure
- core/01-research.offline-bundle.v2.txt — Main research/offline bundling prompt.

Notes
- v0.2b includes a broader core set; v0.2a focuses on the improved research flow while remaining compatible with the ALAIN orchestrator.
- Prefer v0.2a for research tasks that must produce an offline‑ready directory with vetted sources and runnable examples.
