#############################################################
# Community Notebook Aggregator (Seed)
#############################################################

This file lists a curated set of high‑quality AI notebooks with attribution. The app API serves a JSON version at `/api/aggregator/index` for simple consumption.

Sources
- Anthropic: Claude Cookbook — https://github.com/anthropics/anthropic-cookbook (Apache‑2.0)
- OpenAI: OpenAI Cookbook — https://github.com/openai/openai-cookbook (MIT)
- Unsloth: Fast Finetuning — https://github.com/unslothai/unsloth (Apache‑2.0)
- Oxen.ai: Notebooks — https://github.com/oxen-ai/notebooks (Apache‑2.0)
- Hugging Face: Transformers Examples — https://github.com/huggingface/notebooks (Apache‑2.0)

Implementation notes
- Authoritative YAML seed: `hackathon-notes/notebooks-index.yml`
- JSON used by the web API: `apps/web/data/notebooks-index.json`
- API endpoint: `GET /api/aggregator/index` → `{ items: [...] }`
- Remix and grading are not enabled; notebooks render read‑only in the Notebooks viewer.

