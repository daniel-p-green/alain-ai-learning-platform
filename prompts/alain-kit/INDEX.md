ALAIN-Kit Prompt Index (v2025.09.13)

01 - Harmony Orchestrator (offline) - orchestrator.offline.harmony.txt
02 - Harmony Research (offline) - research.offline.harmony.txt
03 - Harmony Cache Management - cache.management.harmony.txt
04 - Harmony Design (offline) - design.offline.harmony.txt
05 - Harmony Develop (offline) - develop.offline.harmony.txt
06 - Harmony Validate (offline) - validate.offline.harmony.txt

Flattened variants (online):
07 - Poe Research (flattened, online) - flattened/poe/research.online.v2025-09-13.txt
08 - API Research (flattened, online) - flattened/openai-compatible/research.online.v2025-09-13.txt
09 - Poe Design (flattened, online) - flattened/poe/design.online.v2025-09-13.txt
10 - API Design (flattened, online) - flattened/openai-compatible/design.online.v2025-09-13.txt
11 - Poe Develop (flattened, online) - flattened/poe/develop.v2025-09-13.txt
12 - API Develop (flattened, online) - flattened/openai-compatible/develop.v2025-09-13.txt
13 - Poe Validate (flattened, online) - flattened/poe/validate.online.v2025-09-13.txt
14 - API Validate (flattened, online) - flattened/openai-compatible/validate.online.v2025-09-13.txt

Outline-first, multi-output helpers (online):
15 - Poe Outline (flattened, online) - flattened/poe/outline.online.v2025-09-14.txt
16 - Poe Section (flattened, online) - flattened/poe/section.online.v2025-09-14.txt
17 - API Outline (flattened, online) - flattened/openai-compatible/outline.online.v2025-09-14.txt
18 - API Section (flattened, online) - flattened/openai-compatible/section.online.v2025-09-14.txt

Usage notes:
- Canonical prompts: use the Harmony .harmony.txt files at the top level; loaders read system + developer blocks.
- Flattened (manual): for Poe/OpenAI-compatible copy/paste, use files under flattened/.
  - Poe: paste SYSTEM into System, USER with model ref or text.
  - OpenAI-compatible: send two messages (system, user) with those bodies.

Deprecated:
- Legacy develop variants (develop.harmony.original.txt, develop.harmony.fixed.txt, develop.harmony.backup.txt, develop.harmony.simple.txt, develop.harmony.poe.txt) are retained for reference only. Use develop.harmony.txt or the flattened templates above.
