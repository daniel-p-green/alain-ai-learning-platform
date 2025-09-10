Examples

- `alain-ai-learning-platform/docs/examples/gpt-oss-20b_active_learning.ipynb`
  - Goal: demonstrate active‑learning scaffolding with GPT‑OSS request shape (OpenAI‑compatible).
  - Runtime: local (Ollama/vLLM) or hosted (OpenAI‑compatible endpoint).
  - Checklist coverage: seeds set, environment printed, minimal usage tokens logged, MCQ/exercises included, troubleshooting notes.

How to run
- Prefer local GPT‑OSS per `alain-ai-learning-platform/docs/gpt-oss/local-run.md`.
- In CI, use `pytest --nbmake` if a smoke version is needed; keep timeouts reasonable.

