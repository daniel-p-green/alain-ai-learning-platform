# ALAIN-Kit Versions

## v0.1 — Harmony (original; formerly “v1.x”)

Original Harmony-based prompt set used in early releases. Provides orchestrator, research, design, develop, and validate flows with tool/controller integrations.

- Index: `resources/prompts/alain-kit-v0.1/INDEX.md`
- Canonical files: `resources/prompts/alain-kit/` (shared for backward compatibility)

## v0.2a – Research Bundle v2 (offline)

Focused improvement of the research prompt for deep, tool-assisted model investigation and offline packaging.

- Path: `resources/prompts/alain-kit-v0.2a/core/01-research.offline-bundle.v2.txt`
- Adds authoritative source links and search hints (HF Hub, GitHub releases/citation, arXiv, leaderboards/evals, servers/quantization, datasets, mirrors)
- Enforces strict revision pinning (Hub revision, Git SHA, arXiv vN) and manifest with checksums
- generation_config optional (fetch if present); servers/quantization marked official vs community support

## v0.2.0 – Tooling Orchestrator (current)

Prompts powering the tool-runtime pipeline (Harmony orchestrator, research, design, develop, validate) remain at the root of `resources/prompts/alain-kit/`. Use these when exercising the `0.2.0` release that integrates notebook and validator tool controllers.

## v0.1.0 – Text Prompt Baseline

The original text-only JSON prompts (outline + section) are preserved under `resources/prompts/alain-kit/versions/v0.1-text/` for comparison. They reflect the pre-tooling flow where OutlineJSON and SectionJSON were generated via direct prompts without tool logging.

## v2025.09.13

Numbered prompt set for harmony and flattened (Poe/API) variants.

- 01 — Harmony Orchestrator (offline)
  - File: orchestrator.offline.harmony.txt
- 02 — Harmony Research (offline)
  - File: research.offline.harmony.txt
- 03 — Harmony Cache Management
  - File: cache.management.harmony.txt

Offline Harmony coverage additions
- 04 — Harmony Design (offline)
  - File: design.offline.harmony.txt
- 05 — Harmony Develop (offline)
  - File: develop.offline.harmony.txt
- 06 — Harmony Validate (offline)
  - File: validate.offline.harmony.txt

Flattened variants (system-first, single-pass, online)
- 07 — Poe Research (flattened, online)
  - File: flattened/poe/research.online.v2025-09-13.txt
  - Usage: Put full file content in System; put model ref/text in User. Avoid developer/tool roles.
- 08 — API Research (OpenAI-compatible, flattened, online)
  - File: flattened/openai-compatible/research.online.v2025-09-13.txt
  - Usage: messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }].
- 09 — Poe Design (flattened, online)
  - File: flattened/poe/design.online.v2025-09-13.txt
- 10 — API Design (OpenAI-compatible, flattened, online)
  - File: flattened/openai-compatible/design.online.v2025-09-13.txt
- 11 — Poe Develop (flattened, online)
  - File: flattened/poe/develop.v2025-09-13.txt
- 12 — API Develop (OpenAI-compatible, flattened, online)
  - File: flattened/openai-compatible/develop.v2025-09-13.txt
- 13 — Poe Validate (flattened, online)
  - File: flattened/poe/validate.online.v2025-09-13.txt
- 14 — API Validate (OpenAI-compatible, flattened, online)
  - File: flattened/openai-compatible/validate.online.v2025-09-13.txt
  - Usage: messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }].

Outline-first helpers (multi-output, online)
- 15 — Poe Outline (flattened, online)
  - File: flattened/poe/outline.online.v2025-09-14.txt
- 16 — Poe Section (flattened, online)
  - File: flattened/poe/section.online.v2025-09-14.txt
  - Usage: first call Outline to plan; then call Section repeatedly to fill steps (800–1,500 tokens each) until complete.
 - 17 — API Outline (OpenAI-compatible, flattened, online)
  - File: flattened/openai-compatible/outline.online.v2025-09-14.txt
 - 18 — API Section (OpenAI-compatible, flattened, online)
  - File: flattened/openai-compatible/section.online.v2025-09-14.txt

All variants enforce the same contract:
- Return ONLY JSON (no markdown fences)
- Fields: For single-pass develop: title, description, learning_objectives[], steps[], assessments[]. For outline/section: follow each file’s JSON schema.
- Parameterized examples only; no secrets; no external calls
- If validation fails, REPAIR and return valid JSON
## v0.2c – Research Offline Bundler (fallback‑ready)

Iteration on v0.2a that always produces a complete offline bundle. Adds:
- No‑Tools Fallback: emits full bundle with Unknowns and [S#] placeholders when tools are unavailable
- Optional SPEC_JSON input to prefill from a prior spec extractor
- Final‑only output (no tool syntax or commentary)

Path: `resources/prompts/alain-kit-v0.2c/core/01-research.offline-bundle.v2c.txt`

## v0.2d – Research Spec Extractor (strict JSON)

Iteration on v0.2b enforcing citations and no speculation.
- JSON‑only single object
- Unknowns labeled as "Not specified" with notes: "unverified"
- Sources array with URLs for all non‑Unknown facts; Disputed section for conflicts

Path: `resources/prompts/alain-kit-v0.2d/core/01-research.spec-json.v2d.txt`

## v0.3 — Two‑Phase Research (Spec → Bundle)

Short, robust prompts for a reliable two‑stage flow:
- Stage 1 — Spec Extractor (strict JSON):
  - Path: `resources/prompts/alain-kit-v0.3/core/01-spec.strict.json.v0.3.txt`
  - Returns a single JSON object with verified facts and citations; Unknowns marked as "Not specified" + notes: "unverified"; Disputed supported.
- Stage 2 — Offline Bundler (MCP):
  - Path: `resources/prompts/alain-kit-v0.3/core/02-bundle.offline.v0.3.txt`
  - Consumes SPEC_JSON, fetches raw sources via MCP (HF/GitHub/arXiv/Web), writes bundle files via fs-local, falls back gracefully with Unknowns and [S#].

## v0.4 — Research Capsule (Spec → Bundle → Provenance)

Hardens outputs for full offline reproducibility and provenance.

- Stage 1 — Spec Extractor (strict JSON)
  - Path: `resources/prompts/alain-kit-v0.4/core/01-spec.strict.json.v0.4.txt`
  - Adds fields: identity.family_map, tokenizer_details, license_details, versioning, gaps_unknowns
- Stage 2 — Offline Bundler (MCP + provenance)
  - Path: `resources/prompts/alain-kit-v0.4/core/02-bundle.offline.v0.4.txt`
  - Downloads raw sources (HF/GitHub/papers/leaderboards/datasets), writes Markdown/code/env, and emits manifest with checksums + provenance metadata (etag, last_modified, content_length_bytes, retrieval_tool, download_time_utc)
