#! ALAIN‑Kit — Harmony Prompt User Guide

This guide explains how to use and extend the ALAIN‑Kit Harmony prompts that power the platform’s “model → interactive learning” pipeline.

- Audience: contributors and advanced users
- Scope: how prompts are structured, loaded, and used at runtime

---

## What Is ALAIN‑Kit?

ALAIN‑Kit is a set of Harmony‑formatted prompts that implement a four‑phase methodology for turning AI model references into structured, interactive lessons:

1) Research → 2) Design → 3) Develop → 4) Validate (plus an Orchestrator)

Canonical prompts live in prompts/alain-kit/ and end with .harmony.txt. Provider-specific flattened templates for manual copy/paste live in prompts/alain-kit/flattened/.

---

## File Layout

- `research.harmony.txt` — Gather comprehensive model intelligence
- `design.harmony.txt` — Plan structured learning experiences
- `develop.harmony.txt` — Build interactive notebook implementations
- `validate.harmony.txt` — Validate technical/educational/UX quality
- `orchestrator.harmony.txt` — Coordinate the full workflow
- `util/json_repair.harmony.txt` — Strict schema‑guided JSON repair
- `util/hf_extract.harmony.txt` — Robust extraction from HF model cards

Each file contains:
- A Harmony `system` block (runtime facts, rails)
- A Harmony `developer` block (instructions + function schemas)
- Optional inline examples for documentation (not sent to the model at runtime)

---

## How Prompts Are Loaded at Runtime

The backend can load only the instruction portions (system + developer) and ignore inline examples. This ensures compatibility with provider‑side Harmony rendering.

- Controlled via env var: `TEACHER_PROMPT_PHASE`
  - Accepted values: `research`, `design`, `develop`, `validate`, `orchestrator`
  - When set, the teacher service will:
    - Read `system` and `developer` from the corresponding `.harmony.txt`
    - Combine them with the runtime `user` message(s)
  - When unset, the existing (default) behavior is used.

Implementation:
- Loader: `backend/execution/prompts/loader.ts`
- Teacher integration: `backend/execution/teacher.ts`
- Override root: set `PROMPT_ROOT=/absolute/path/to/prompts/alain-kit` (optional; otherwise module‑relative paths are used)

Note: Provider‑side Harmony rendering (Poe, LM Studio, Transformers Serve) handles message formatting. We do not inject raw `<|start|>…` tokens into message content.

---

## Best Practices

- Do not reveal analysis: chain‑of‑thought remains in `analysis`; user‑visible content goes to `final`.
- Prefer function outputs: return structured JSON via function tools; avoid markdown fences around JSON.
- JSON stability: use low temperature, bounded `max_tokens`, and `response_format: json_object` (when supported). The platform validates and can repair once if needed.
- Keep examples for humans: inline examples in the prompt files are for docs/tests. The loader excludes them at runtime.

---

## Using Utility Prompts

These are optional helpers for specific sub‑tasks:

- `util/json_repair.harmony.txt` — When the model’s JSON is invalid or incomplete, this prompt steers a targeted repair via `functions.repair_lesson_json`.
- `util/hf_extract.harmony.txt` — Normalizes Hugging Face model metadata via `functions.extract_hf_model_info`.

You can include these in direct API workflows or wire them into new backend endpoints similarly to the phase prompts.

---

## Contributing Prompts

- File extension: keep `.harmony.txt`.
- Structure: include both `system` and `developer` blocks; declare function schemas inside `developer`.
- Examples: feel free to add short examples at the end for maintainers; the loader will skip them.
- Naming: keep phase names stable; put helpers under `util/`.

Checklist before submitting:
- Follows Harmony token rules (`<|start|>`, `<|message|>`, `<|end|>`, `<|channel|>`, `<|constrain|>`, `<|call|>`, `<|return|>`)
- Uses `commentary` channel for tool calls and sets `<|constrain|> json` when returning JSON
- Includes a clear function schema with required/optional fields

---

## FAQ

Q: Can I send these files directly to the model?
- For providers that render Harmony (Poe/LM Studio/Transformers Serve), send normal chat messages built from the loader outputs (system/developer/user). Do not embed raw Harmony tokens in message content.

Q: What if we run low‑level inference?
- Use the `openai-harmony` renderer and pass the full prompt shape (including `<|start|>…` tokens), or reuse these files as authoring references.

Q: How do I opt‑in to file‑based instructions?
- Set `TEACHER_PROMPT_PHASE` to one of the phases. Unset it to restore default behavior.

---

## See Also

- prompts/alain-kit/README.md — Prompt overview and format details
- backend/execution/prompts/loader.ts — Instruction‑only prompt loader
- backend/execution/teacher.ts — Optional integration via env flag
- Deployment note: ensure `prompts/` are included in backend deploy artifacts (Docker/Encore)
