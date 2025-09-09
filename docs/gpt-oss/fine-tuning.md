# GPT‑OSS Fine‑Tuning (Unsloth QLoRA)

- Setup: use Unsloth `FastLanguageModel`; enable gradient checkpointing (`"unsloth"`).
- Quantization: 4‑bit QLoRA for modest GPUs; verify VRAM fits seq length.
- Data: clean, instruction‑style pairs; consistent formatting; small sanity subset.
- Training: short warm‑starts; monitor loss; save checkpoints and final adapters.
- Eval: quick golden set before/after; ensure no regressions on safety/format.
- Export: save to safetensors; optional GGUF export for llama.cpp; test with vLLM.

