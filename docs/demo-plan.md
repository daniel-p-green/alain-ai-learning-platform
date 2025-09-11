# ALAIN Demo Polish — Execution Plan (live)

Branching + cadence
- [ ] Create branch `feat/demo-polish-p1` for this work
- [ ] Push small PRs every 30–60 minutes with tight scope

P0 — Core functionality (Hosted + Local)
- [ ] Poe hosted path configured and passing smoke
  - Success: `/api/providers/smoke` `{provider:'poe',model:'gpt-4o-mini'}` returns `{ success: true }` on Vercel; Generate (HF) returns preview.
- [ ] Local GPT‑OSS path (Ollama) passing smoke
  - Success: `/api/providers/smoke` `{provider:'openai-compatible'}` returns `{ success: true }`; Generate (Local) returns preview using `gpt-oss:20b` or `llama-3-8b-instruct`.
- [ ] HF token validation through backend
  - Success: Settings → Providers → Hugging Face → Test shows `ok` when `HF_Token` is set in Encore Cloud; actionable error when missing.

P1 — UX flow (reduce clicks, raise confidence)
- [ ] One‑click sample buttons on `/generate` (Hosted + Local)
  - Success: Judge can reach a working preview with ≤2 clicks in either path.
- [ ] Header Env Status dropdown (Copy env, Open Settings, Run tests)
  - Success: Badge conveys readiness; dropdown enables quick actions.
- [ ] Providers table: spinner + toast summary + inline Logs
  - Success: Visible progress during tests; summary shows pass/fail counts; logs show last error/time.

P1 — Error handling & messaging
- [ ] Friendly non‑JSON/401 messages (Generate + Settings)
  - Success: No raw parse errors; each failure gives next steps (sign‑in, demo bypass, provider setup).

P1 — Visual polish
- [ ] Consistent tokens: 12px radius everywhere, `0 1px 3px rgba(0,0,0,0.12)` shadows, `alain-stroke` focus rings
  - Success: Lighthouse a11y ≥ 90 on `/generate` and `/settings`.

P2 — Demo guide & docs
- [ ] README + in‑app callouts updated to match presets/one‑click samples
  - Success: Judge can complete demo in ≤ 2 minutes from README or in‑app tips.

P2 — Stability & QA
- [ ] `/health` aggregates provider readiness
  - Success: Single‑glance page shows demo readiness.

Notes
- Do not remove/redirect routes for now (will revisit).
- Check in with Daniel for taste/ambiguous decisions.

Tracking
- This file exists to verify PR flow and link a preview build. No functional changes.
