# Reproducible Environments

- Pin dependencies: prefer `pip install pkg==X.Y` or `-r requirements.txt`.
- Lock files: consider `pip-tools` or `uv` for hashed lockfiles.
- Seeds: set `random`, `numpy`, and framework seeds (torch) in setup.
- Hardware checks: print CUDA availability and device name; provide CPU fallback.
- Data stability: use small public samples; version datasets or pin commit hashes.
- Caching: cache downloads (HF hub) and heavy computations; document locations.
- Isolation: use venv/conda; avoid relying on system‑wide packages.

