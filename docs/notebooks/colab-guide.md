# Colab Guide

- Hardware: choose T4/A100 as needed; note time limits and idle resets.
- Installs first: keep `pip install` in the first cell; pin versions.
- Drive mounts: use `from google.colab import drive; drive.mount('/resources/content/drive')` when needed.
- Data: prefer small public files; cache with `hf_hub_download` when possible.
- Forms UI: use Colab forms for parameters (`#@param` comments) to guide inputs.
- Secrets: use environment variables; never paste keys in notebook; consider `colab.secrets`.
- Checkpoints: periodically save artifacts to Drive to avoid session loss.

