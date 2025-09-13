# ALAIN-Kit Versions

## v2025.09.13

Numbered prompt set for harmony and flattened (Poe/API) variants.

- 01 — Harmony Orchestrator (offline)
  - File: orchestrator.offline.harmony.txt
- 02 — Harmony Research (offline)
  - File: research.offline.harmony.txt
- 03 — Harmony Cache Management
  - File: cache.management.harmony.txt

Flattened variants (system-first, single-pass)
- 04 — Poe Develop (flattened)
  - File: flattened/poe/develop.v2025-09-13.txt
  - Usage: Put full file content in System; put model ref/text in User. Avoid developer/tool roles.
- 05 — API Develop (OpenAI-compatible, flattened)
  - File: flattened/openai-compatible/develop.v2025-09-13.txt
  - Usage: messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }].

All variants enforce the same contract:
- Return ONLY JSON (no markdown fences)
- Fields: title, description, learning_objectives[], steps[], assessments[]
- Parameterized examples only; no secrets; no external calls
- If validation fails, REPAIR and return valid JSON
