# AI Model Teaching Notebooks: Best Practices

Purpose: a pragmatic, copyable set of patterns for writing clear, reliable, and pedagogically strong notebooks that teach users how to use new AI models (OpenAI, Anthropic, Unsloth/Hugging Face, etc.).

## Core Principles
- Clarity: prioritize readable, well-chunked explanations over dense blocks.
- Reproducibility: deterministic seeds, pinned deps, environment checks, stable data access.
- Safety & Cost: highlight safety constraints, rate limits, and show token/cost accounting.
- Evaluation: include quick, objective checks so users know if they’re succeeding.
- Interactivity: short exercises, toggles, and “try this” prompts to engage.
- Robustness: error handling, timeouts/retries, and defensive guards for secrets.
- Performance: batched calls, streaming where useful, caching, and sensible defaults.
- Modularity: small utilities, functions, and clear sections; avoid monolithic cells.
- Accessibility: readable fonts, alt text for images, plain language, and captions.

## Recommended Structure (Teaching-Focused)
- Title & Outcomes: what users will learn, build, and the expected time.
- Prerequisites: API keys, GPU/CPU requirements, costs, and links to docs.
- Setup: environment checks, package installs (with versions), seed setting.
- Quickstart: smallest working example (one request or forward pass) fast.
- Concepts: short explainer on model capabilities/limits and when to use it.
- Guided Steps: incremental tasks (each with context, code, expected result).
- Evaluation: simple metrics or acceptance tests to verify it works.
- Cost & Observability: log tokens, latency, and spend; show how to inspect.
- Troubleshooting: common errors and fixes; rate-limit/backoff guidance.
- Exercises: “Try this” variations; stretch goals; links to further reading.
- Cleanup: how to stop jobs, free GPU, or remove temp files.

## Setup Patterns
- Environment Cell: print Python, CUDA, `pip list | grep -E "(openai|anthropic|transformers|unsloth|vllm)"`.
- Package Pins: prefer `pip install pkg==x.y` for reproducibility; cite tested versions.
- GPU Detection: show `torch.cuda.is_available()` and device name if applicable.
- Secrets: read keys from env (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`), never hardcode.
- Seeds: set `random`, `numpy`, and framework seeds for deterministic examples.

## Safety & Cost Controls
- Rate Limits: note current limits and demonstrate retry/backoff.
- Token Budgets: show how to estimate tokens before calls when feasible.
- Cost Logging: capture response token usage and approximate cost per step.
- Content Safety: clarify acceptable use; show moderation/guardrail examples when relevant.

## Prompting & Structured Outputs
- Explicit Instructions: specify role, goal, constraints, and format requirements.
- JSON Mode: use model-native JSON or schema tools (e.g., Pydantic) when supported.
- Few-Shot: align examples with the rubric; test against edge cases.
- Determinism: use temperature near 0 for verification steps; higher for ideation.
- Tool Use: show function/tool schemas, tool_choice, and validation on outputs.

## Evaluation Essentials
- Baseline: include a tiny baseline and a target metric (e.g., >90% exact-match on 20 items).
- Data Splits: separate toy train/dev/test if you’re tuning prompts or LoRA.
- Regression: keep a small golden set to catch breaks across edits.
- Visualization: compact charts/tables to help users “see” improvement.

## Robustness Techniques
- Retries: exponential backoff on 429/5xx; idempotent designs for batch steps.
- Timeouts: set per-call timeouts; surface helpful error messages.
- Validation: assert on required fields, JSON schemas, or pydantic models.
- Caching: memoize expensive steps (downloads, embeddings) to save time/cost.

## Performance Tips
- Batching: batch small requests; prefer streaming for interactive UX.
- Token Economy: compress prompts, avoid redundant context, and use prompt caching where available.
- Model Fit: match model size to task; don’t demo GPT-4 class on trivial tasks.
- Hardware Fit: Unsloth 4-bit LoRA + gradient checkpointing for modest GPUs.

## Vendor-Specific Notes
- OpenAI
  - Patterns: Assistants API, JSON mode, function calling, streaming, and Evals notebooks.
  - Good Practice: include evaluation cells; show logprobs/usage; pin `openai` SDK.
  - Teaching Hook: start with a single message completion; then add tools and evals.
- Anthropic
  - Patterns: extended thinking mode, prompt caching, tool use, and cost API.
  - Good Practice: include setup, error handling, token counting, and “handling edge cases.”
  - Teaching Hook: Basic text, then vision, then tools; show JSON mode where relevant.
- Unsloth (HF Fine-Tuning)
  - Patterns: `FastLanguageModel`, gradient checkpointing ("unsloth"), 4-bit LoRA, sequence packing.
  - Good Practice: seed setting, eval during/after training, GGUF export, vLLM inference check.
  - Teaching Hook: clear data formatting, tiny subset train, quick sanity eval, then scale.

## Authoring Checklist (Short)
- Outcomes clear; intro screenshot/gif optional; time estimate added.
- Setup cells run cleanly; versions pinned; GPU detection printed.
- Secrets via env; no hardcoded keys; safe default config.
- Quickstart works in <1 minute; later sections deepen complexity.
- Cost/usage visible; evaluation cell demonstrates success criteria.
- Troubleshooting present; common 429/JSON/timeout issues covered.
- Exercises and stretch goals invite exploration.

## Distribution
- Colab Badge: add a Colab link when practical; ensure `pip` cells are first.
- Data Hosting: use small, public sample datasets; document larger alternatives.
- Binder/Spaces: if interactive UI helps, link a companion Space or app.
- License: include a permissive license note if you expect re-use.

## Teaching Patterns That Work
- Incremental Reveal: minimal example → feature → eval → reflect.
- Tidy Cells: one idea per cell; headings for each step.
- Visible State: print shapes, token counts, and concise diffs.
- Reflection Prompts: ask users to predict before they run; compare after.
- Guardrails First: show safe defaults; progressively relax as a lesson.

