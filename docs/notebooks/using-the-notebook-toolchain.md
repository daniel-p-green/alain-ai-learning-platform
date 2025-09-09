# Using the ALAIN Notebook Toolchain (Author Guide)

This guide shows how to use our templates, linter, CI, and GPT‑OSS references to author high‑quality, teachable notebooks quickly and consistently.

## Author Workflow (Quickstart)

1) Install tools

```bash
pip install -r alain-ai-learning-platform/requirements-dev.txt
pre-commit install
```

2) Start from the template

- Copy `alain-ai-learning-platform/docs/templates/teaching_template.ipynb`
- Fill in outcomes, setup, minimal calls, evaluation, and cost cells

3) Follow best practices and style

- `docs/notebooks/notebook-best-practices.md`
- `docs/notebooks/jupyter-style-guide.md`

4) Lint + checklist before commit

```bash
python alain-ai-learning-platform/scripts/notebook_linter.py path/to/your.ipynb
```

- Check against: `docs/notebooks/notebook-quality-checklist.md`

5) Add a smoke test (optional but recommended)

- Place a tiny notebook under `alain-ai-learning-platform/tests/notebooks_smoke/` and run:

```bash
pytest -q
```

6) Commit

- Pre‑commit will strip outputs and run the linter on staged notebooks

## Core Components

- Template: `docs/templates/teaching_template.ipynb` (vendor‑agnostic)
- Best Practices: `docs/notebooks/notebook-best-practices.md`
- Style: `docs/notebooks/jupyter-style-guide.md`
- Checklist: `docs/notebooks/notebook-quality-checklist.md`
- Linter: `scripts/notebook_linter.py`
- CI How‑To: `docs/notebooks/notebook-ci.md`
- Reproducible Envs: `docs/notebooks/reproducible-environments.md`
- Colab Guide: `docs/notebooks/colab-guide.md`
- Privacy & Secrets: `docs/notebooks/data-privacy-and-secrets.md`
- Observability & Costs: `docs/notebooks/observability-and-costs.md`
- Testing Patterns: `docs/notebooks/testing-patterns.md`

## Creating a New Notebook

- Copy the teaching template and rename it
- Keep one idea per cell; add headings for each step
- Print environment info and set seeds in the setup cell
- Read API keys from env (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`); never hardcode
- Provide a smallest working example (quickstart) that runs in < 1 minute
- Add an Evaluation section with a tiny golden set or acceptance test
- Log token usage/cost where available; show basic latency
- Include Troubleshooting and Exercises; add Cleanup if resources are used

## Linting & Pre‑Commit

- Manual run:

```bash
python alain-ai-learning-platform/scripts/notebook_linter.py your.ipynb
```

- The linter checks: seeds, version pins in `pip install`, secrets via env, evaluation presence, and cost logging
- Pre‑commit config: `.pre-commit-config.yaml` automatically strips outputs and runs the linter on staged `.ipynb`

## Testing with Pytest (nbmake)

- Default config enables `--nbmake` via `pytest.ini`
- Run all tests:

```bash
pytest -q
```

- Run a single notebook as a test:

```bash
pytest --nbmake docs/templates/teaching_template.ipynb -q
```

- Tips: make test notebooks no‑op without API keys; keep timeouts reasonable

## Reproducible Environments

- Pin versions in install cells (e.g., `pip install pkg==X.Y`)
- Print Python, package versions, CUDA availability
- Set `random`, NumPy, and framework seeds
- Cache heavy steps where possible; use small public datasets

## Colab Tips

- Put `pip install` in the first cell; pin versions
- Use forms (`#@param`) for inputs; mount Drive if needed
- Expect session resets; periodically save artifacts

## Privacy & Secrets

- Read keys from env; avoid printing secrets
- Use synthetic data for examples; link a cleanup cell for local caches
- Warn when sending data to third‑party APIs

## Observability & Cost

- Print tokens (prompt/completion/input/output) if SDK provides
- Report simple latency metrics and averages over small runs
- Estimate cost from token counts and current pricing

## GPT‑OSS: Local Runs & Patterns

- Local Run Guide: `docs/gpt-oss/local-run.md` (Ollama/vLLM via OpenAI‑compatible API)
- Prompting: `docs/gpt-oss/prompting.md` (structure, JSON, stop sequences, temperature)
- Evaluation: `docs/gpt-oss/evaluation.md` (golden sets, determinism, regression)
- Fine‑Tuning (Unsloth QLoRA): `docs/gpt-oss/fine-tuning.md` (4‑bit LoRA, checkpoints, GGUF)
- RAG Recipes: `docs/gpt-oss/rag-recipes.md` (embeddings, retrieval, evaluation)

## CI Examples

- GitHub Actions / GitLab CI snippets in `docs/notebooks/notebook-ci.md`
- Typical steps: install `requirements-dev.txt`, run pre‑commit, run `pytest -q`

## Publishing Tips

- Include a Colab badge when appropriate
- Keep a minimal Quickstart prominent; link to detailed sections below
- Provide license note and data source attributions

## Checklist Before Review

- Run linter and ensure all checks pass
- Validate against `docs/notebooks/notebook-quality-checklist.md`
- Execute smoke tests locally (`pytest -q`)
