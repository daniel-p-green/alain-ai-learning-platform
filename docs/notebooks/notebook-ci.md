# Notebook CI

Goals: ensure notebooks run cleanly, contain no outputs, and meet authoring standards.

## Pre-commit
1) Install dev deps: `pip install -r requirements-dev.txt`
2) Enable hooks: `pre-commit install`

Hooks:
- Strip outputs from `.ipynb` (nbstripout)
- Run `scripts/notebook_linter.py` on staged notebooks

## Pytest nbmake (smoke runs)
Config: `pytest.ini` sets `--nbmake` by default for `tests/`.

Run locally:
```bash
pytest -q
# or target a specific notebook
pytest --nbmake docs/templates/teaching_template.ipynb -q
```

Tip: keep smoke notebooks minimal or auto‑no‑op without API keys.

## CI Examples

GitHub Actions (example):
```yaml
name: Notebooks
on: [push, pull_request]
jobs:
  nb:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r alain-ai-learning-platform/requirements-dev.txt
      - run: pre-commit run --all-files
      - run: pytest -q
```

GitLab CI (example):
```yaml
notebooks:
  image: python:3.11
  script:
    - pip install -r alain-ai-learning-platform/requirements-dev.txt
    - pre-commit run --all-files
    - pytest -q
```

