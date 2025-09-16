Examples

This folder contains example scripts that are not part of the core app. They’re useful for testing provider integrations and basic flows.

- examples/poe/poe-openai-sdk-example.js
  - Node example using the OpenAI-compatible SDK shape against Poe.
  - Run: `node examples/poe/poe-openai-sdk-example.js --test-all`

- examples/poe/poe-python-example.py
  - Python example of basic Poe requests.
  - Run: `python3 examples/poe/poe-python-example.py`

- examples/poe/test-poe-integration.js
  - Minimal integration test to verify Poe + optional OpenAI-compatible fallback.
  - Env: `POE_API_KEY=... [OPENAI_API_KEY=...]`
  - Run: `node examples/poe/test-poe-integration.js`

- examples/poe/test-poe-models.js
  - Lists/validates selected model presets.
  - Run: `node examples/poe/test-poe-models.js`

Notes
- These are standalone examples; they don’t require the web/backend workspaces to run.
- Keep secrets in your shell env; do not commit credentials.
