# GPT‑OSS Evaluation Playbook

- Define success: exact‑match, F1, BLEU/ROUGE, or rubric‑based scoring.
- Small golden set: 20–50 items representative of real tasks.
- Determinism: temperature near 0; fixed seeds for any sampling components.
- Baseline: compare to simpler prompts or rules; track delta.
- Regression checks: re‑run on changes or dependency bumps.
- Tooling: use `pytest --nbmake` for notebook exec; RAGAS/TruLens for RAG tasks.

