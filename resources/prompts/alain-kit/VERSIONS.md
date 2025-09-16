# ALAIN-Kit Versions

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
