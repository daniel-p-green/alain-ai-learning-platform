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

Flattened variants (system-first, single-pass)
- 07 — Poe Research (flattened)
  - File: flattened/poe/research.v2025-09-13.txt
  - Usage: Put full file content in System; put model ref/text in User. Avoid developer/tool roles.
- 08 — API Research (OpenAI-compatible, flattened)
  - File: flattened/openai-compatible/research.v2025-09-13.txt
  - Usage: messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }].
- 09 — Poe Design (flattened)
  - File: flattened/poe/design.v2025-09-13.txt
- 10 — API Design (OpenAI-compatible, flattened)
  - File: flattened/openai-compatible/design.v2025-09-13.txt
- 11 — Poe Develop (flattened)
  - File: flattened/poe/develop.v2025-09-13.txt
- 12 — API Develop (OpenAI-compatible, flattened)
  - File: flattened/openai-compatible/develop.v2025-09-13.txt
- 13 — Poe Validate (flattened)
  - File: flattened/poe/validate.v2025-09-13.txt
- 14 — API Validate (OpenAI-compatible, flattened)
  - File: flattened/openai-compatible/validate.v2025-09-13.txt
  - Usage: messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }].

All variants enforce the same contract:
- Return ONLY JSON (no markdown fences)
- Fields: title, description, learning_objectives[], steps[], assessments[]
- Parameterized examples only; no secrets; no external calls
- If validation fails, REPAIR and return valid JSON
