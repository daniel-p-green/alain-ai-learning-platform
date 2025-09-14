**ALAIN‑Kit: GPT‑OSS Orchestration Notes**

Purpose: Operational guidance for using OpenAI’s gpt‑oss‑20b/120b as the teacher model in ALAIN‑Kit workflows. Summarizes model‑card facts and translates them into concrete defaults, guardrails, and tactics for higher success rates.

**Model Overview**
- Architecture: Mixture‑of‑Experts (MoE) Transformer; gpt‑oss‑20b uses 32 experts with top‑4 routing per token; gpt‑oss‑120b uses 128 experts.
- Context: Dense layers extended to 131,072 tokens (long‑context friendly).
- Training: Includes post‑training for Harmony chat format, variable‑effort reasoning, and agentic tool use.
- Quantization: MXFP4 MoE weight quantization; 20b can run on ~16GB memory; 120b on ~80GB.
- Capabilities: Strong instruction following, tool use (web, code execution), structured outputs, and full chain‑of‑thought (CoT) support.
- Safety: Open‑weight risks require developer safeguards; expect jailbreak attempts, hallucinations, instruction hierarchy conflicts, and CoT exposure risks.

**Harmony Chat Usage**
- Channels: Use `analysis` for hidden reasoning, `commentary` for tool calls (functions.*), `final` for end results.
- Tool calls: MUST be in `commentary` channel and constrained to JSON (`<|constrain|> json`).
- CoT management: Allow rich reasoning in `analysis`, but never emit CoT in `final` or student‑facing JSON. Summarize reasoning into concise conclusions.
- Instruction hierarchy: System > developer > user. Ensure prompts explicitly restate JSON‑only requirements to avoid drift.

**Structured Outputs (JSON) Best Practices**
- JSON‑only: Start with `{` and end with `}`; no fences or prose. If invalid, repair and resend valid JSON only.
- Escaping: Avoid unescaped newlines/quotes inside JSON strings. Prefer `\n` within strings and backtick‑free code blocks.
- Determinism: Use `temperature` 0.2–0.5 for schema‑critical outputs (outlines, sections). Optionally raise for creative sections.
- Size control: Keep individual JSON payloads under ~2k tokens when possible; segment content across steps.

**Outline‑First + Section‑Fill Strategy**
- Rationale: Most high‑quality notebooks exceed 2–4k tokens total; chunking improves reliability and quality.
- Targets (from 575‑notebook analysis):
  - Steps: 6–12 (p90 ≈ 15)
  - Markdown ratio: 0.40–0.70
  - Tokens total: 2,000–4,000 typical; long exemplars are larger
  - Reading time: 15–30 minutes typical
- Flow:
  1) Generate outline (Title, Overview, exactly 4 Objectives, Prerequisites, Setup with pinned versions and env vars, 6–12 “Step N:” entries with `estimated_tokens`, Exercises, Assessments, Summary, References).
  2) Fill each section (800–1,500 tokens) with short cells, callouts (Note/Tip/Warning), seeds/random_state, and pinned dependencies.
  3) Assemble via `scripts/assemble_notebook.py` into .ipynb and lint.

**Default Parameters (Teacher Generation)**
- Temperature: 0.3 for outlines/assessments; 0.5–0.7 for narrative sections; ≤0.3 for code‑heavy cells.
- Max tokens per response: 1,200–1,500 for sections; 2,500 for outline.
- Top‑p: 0.9; Frequency/presence penalties: 0.0–0.2 as needed to curb repetition.
- Retries: 3 with exponential backoff; Timeout: 30s; Streaming optional for long sections.

**Tool Use & Reasoning**
- Variable effort reasoning: When provider supports it, nudge via instructions (e.g., “use minimal necessary reasoning; move details to analysis channel”).
- Agentic tool use: Prefer explicit function schemas (emit_notebook_outline, emit_notebook_section, emit_validation_report) to structure outputs and enable recovery.
- Robust extraction: Post‑process responses with a tolerant JSON extractor (strip non‑JSON pre/post, validate, re‑ask on failure). See `test-robust-json-extraction.ts`.

**Reproducibility & Setup**
- Pin versions in Setup and add a `requirements.txt` block; include `.env.example` keys used by code.
- Use seeds: `random.seed(42)`, `numpy.random.seed(42)`, framework equivalents.
- Insert troubleshooting notes for installs (platform quirks, CUDA, Apple Silicon).

**Notebook Quality Heuristics (what “good” looks like)**
- Structure: Title, Overview, 4 Objectives, Prereqs, Setup (requirements/env/commands), ToC, 6–12 steps with “Step N:” headings, Exercises, Assessments, Summary, References.
- Balance: Markdown/code ratio in 0.40–0.70; avoid mega‑cells; break code logically.
- Guidance: Use callouts and visuals; provide checkpoints; end with “Next steps”.
- Assessments: MCQs (4 options, 1 correct, explanation) and practical tasks; solutions may be deferred to save tokens.
- Reproducibility: Seeds, parameters explained, version pins, environment checks.

**Assembler & Lint**
- Build: `python scripts/assemble_notebook.py --outline outline.json --sections-dir sections/ --out-dir notebook_output`
- Lint checks:
  - Markdown ratio 0.40–0.70 (warn if out of range)
  - Headings ≥ 8
  - Required sections present (overview/objectives/prereqs/setup/exercises/summary/references)
  - Steps count matches outline
  - Objectives count = 4

**Model Selection Guidance**
- Default teacher: gpt‑oss‑20b (cost/latency efficient; sufficient quality for most lessons).
- Use gpt‑oss‑120b for complex reasoning sections or large summarization/fusion tasks, especially with long context.
- For local/offline demos, leverage quantized checkpoints where appropriate; keep the same structured prompting and chunking.

**Safety & Compliance**
- Avoid disallowed content; refuse or route to safe alternatives.
- Mitigate CoT exposure: do not print chain‑of‑thought to learners; keep it in `analysis`.
- Provide neutral phrasing and fairness checks in assessments; avoid sensitive topics unless necessary and handled carefully.

**Common Failure Modes & Recovery**
- Invalid JSON: Re‑ask with stricter JSON‑only system prompt; reduce temperature.
- Oversized output: Switch to section fill; reduce per‑section token target.
- Hallucinated APIs: Enforce “parameterized examples only; no secrets; no external calls”.
- Repetition/drift: Add brief reminders of schema and length limits to each prompt.

**Quick Prompt Starters**
- Outline (Poe): `prompts/alain-kit/flattened/poe/outline.online.v2025-09-14.txt`
- Outline (OpenAI‑compatible): `prompts/alain-kit/flattened/openai-compatible/outline.online.v2025-09-14.txt`
- Section (Poe): `prompts/alain-kit/flattened/poe/section.online.v2025-09-14.txt`
- Section (OpenAI‑compatible): `prompts/alain-kit/flattened/openai-compatible/section.online.v2025-09-14.txt`

**References**
- GPT‑OSS Model Card: `alain-ai-learning-platform/research-outputs/oai_gpt-oss_model_card.pdf`
- Outline/Section assembly: `scripts/assemble_notebook.py`
- JSON extraction tests: `alain-ai-learning-platform/test-robust-json-extraction.ts`
