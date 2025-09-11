## ALAIN Final Sprint Plan (2025‑09‑10)

This is the clarified, judge‑oriented plan with concrete acceptance criteria and current status. It focuses on a smooth local demo (LM Studio/Ollama), truthful streaming, and high‑quality notebook export.

---

### Current State Snapshot

- Providers & streaming
  - Next.js route `web/app/api/execute/route.ts` performs real SSE by piping provider chunks. [OK]
  - Backend (Encore) execute is non‑streaming; README states streaming is handled by Next.js. [OK]
  - Providers are limited to `poe` and `openai-compatible`. [OK]
- Local‑first flow
  - `POST /lessons/generate-local` implemented; Generate page supports “From Local Runtime” with model dropdown from `/providers/models`. [OK]
  - Settings presets + detection for LM Studio (1234) and Ollama (11434); keyless local validation. [OK]
- LM Studio admin
  - Lowest‑risk: Next.js API routes handle search/options/download via SDK; backend endpoints disabled. [OK]
  - Routes return 501 when SDK missing; UI should show a helpful banner. [PENDING UI]
- Models & info
  - `/providers/models` lists local models; 60s cache. `/providers/models/:id/info` infers family/maker/tool‑use; used to enrich the local lesson prompt. [OK]
- Export
  - Notebook `backend/export/notebook.ts` produces intro, env setup, smoke test, steps, MCQs, and Tool‑Use demo cell for openai‑compatible. [OK]
- Auth/demo
  - `DEMO_ALLOW_UNAUTH=1` supported; SSE fallback uses demo id. [OK]

---

### P0 — Demo Polish & Reliability

1) Default to Local Runtime when detected
- What: If `/api/providers/models` returns models, default Generate to `source='local'` and preselect first model.
- Files: `web/app/generate/page.tsx`
- Acceptance: On load (with LM Studio/Ollama running), Local mode is selected with a model chosen.
- Status: PENDING

2) LM Studio Explorer — SDK‑missing banner
- What: When `/api/lmstudio/*` returns 501, show a banner with steps: “Install @lmstudio/sdk” and “Open LM Studio Desktop → Local Server”.
- Files: `web/app/lmstudio/page.tsx`
- Acceptance: No cryptic 501; clear, actionable guidance appears.
- Status: PENDING

3) README — Judge Fast Path (Local Runtime)
- What: Add a no‑HF, local flow (LM Studio + Ollama variants) with `DEMO_ALLOW_UNAUTH=1` snippet; note “Streaming via Next.js”.
- Files: `README.md`
- Acceptance: Judge section has Hosted + Local (Ollama) + Local (LM Studio) with 60–90s steps.
- Status: PENDING

---

### P1 — Trust & Clarity

4) Runtime badge (UI + notebook)
- What: Show “Runtime: LM Studio/Ollama/OpenAI‑compatible” in tutorial UI; add a line to notebook intro metadata.
- Files: `web/app/tutorial/[id]/page.tsx`, `backend/export/notebook.ts`
- Acceptance: Runtime visibly shown in UI and exported `.ipynb`.
- Status: PENDING

5) Token usage (best‑effort)
- What: Surface token estimates in Execution Summary. Prefer real `usage` when available; else derive rough estimate (chars→tokens ≈ /4).
- Files: `web/app/api/execute/route.ts` (track), `web/components/StreamingOutput.tsx` (display)
- Acceptance: Summary shows a token number or “N/A” without breaking flow.
- Status: PENDING

---

### P2 — Lightweight Tests & Sanity Checks

6) Unit tests: model listing + inference mapping
- What: Test `classifyProvider`, mocked `fetchModels`, and `inferModelInfo` behavior.
- Files: `backend/execution/models.ts` + new `*.test.ts`
- Acceptance: `npm --workspace backend run test:pure` passes.
- Status: PENDING

7) Streaming sanity
- What: Manual verification that SSE emits multiple chunks for LM Studio and Poe; if buffering, keep copy accurate.
- Files: N/A (manual), adjust README copy if needed.
- Acceptance: Confirmed multiple chunks; or copy reflects reality decisively.
- Status: PENDING

---

### P3 — UX Nice‑to‑Haves (Time‑Permitting)

8) Settings: “Use detected runtime” smarter default
- What: If both detected, prefer LM Studio; else Ollama. Button sets env via `/api/setup`.
- Files: `web/app/settings/page.tsx`
- Status: OPTIONAL

9) Generate page hint when no local models
- What: If Local selected but no models, show a link to `/lmstudio` to download.
- Files: `web/app/generate/page.tsx`
- Status: OPTIONAL

10) Explorer downloads with progress
- What: Convert synchronous download to async job + polling if current approach proves flaky.
- Files: `web/app/api/lmstudio/download/route.ts`, `web/app/lmstudio/page.tsx`
- Status: OPTIONAL

---

### Frontend Experience (Clarified)

- Generate page
  - Two clear tabs: From Hugging Face | From Local Runtime.
  - Local defaults to detected runtime with preselected model; HF path remains for hosted demos.
  - Error states concise; streaming output pane shows status, time, token estimate.

- Tutorial player
  - “Run step” with live SSE output; show runtime badge and rough token count when available.
  - Copy helpers: curl + JS SDK snippets; cost hint remains approximate.

- Settings
  - Presets (LM Studio/Ollama) and Validate buttons; “Use detected runtime” sets env quickly.

- Explorer (LM Studio)
  - Search → Options → Download → Identifier; clear banner if SDK missing; link back to Generate.

---

### Notebook Generation (Clarified)

- Pathways
  - HF path: `POST /lessons/generate` extracts model info from HF URL (offline‑safe), teacher generates lesson JSON; we import and render.
  - Local path: `POST /lessons/generate-local` uses `/providers/models/:id/info` (family, maker, tool‑use) to enrich the teacher prompt.

- Export content (ipynb)
  - Intro + model maker (when present), env setup for OpenAI‑compatible, smoke test.
  - Steps render markdown + code cells with parameterized calls; MCQs with a basic widget.
  - Tool‑Use demo cell included when provider is openai‑compatible (works well on LM Studio).

- Quality bar
  - JSON validation + one‑shot repair, schema defaults applied, safe prompt scaffolding, and no arbitrary code execution in generated cells.

Reference: See @ALAIN_progress notes for day‑by‑day evolution and checkpoints.

---

### Non‑Goals Before Submission

- Replace Encore with Express/Fastify.
- Add a dedicated LM Studio execute provider.
- Deep HF model card ingestion or Ollama `/api/tags`.
- Structured logging / request IDs.

---

### Acceptance Checklist (Demo Script)

- Hosted (Poe): HF URL → Generate → Tutorial → Streaming → Export `.ipynb`.
- Local (LM Studio): Start server → Generate Local (preselected model) → Streaming → Export `.ipynb` → Tool‑Use cell runs.
- Local (Ollama): `gpt-oss:20b` available → same flow works.
- Explorer: Search → Options → Download returns identifier (or banner with instructions if SDK missing).

---

### Risk Mitigation

- If SDK missing, Explorer shows guidance; Local flow still works via OpenAI‑compatible REST.
- If provider buffers, SSE still streams; README copy clarifies streaming via Next.js; avoid over‑promising.
- If token usage unavailable, show “N/A” without blocking UX.
