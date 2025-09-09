# GPT‑OSS Local Run Guide

Run GPT‑OSS locally via OpenAI‑compatible APIs (Ollama or vLLM).

## Ollama
- Install: https://ollama.ai
- Pull model: `ollama pull gpt-oss:20b`
- Endpoint: defaults to `http://localhost:11434/v1`
- Env for backend:
  - `OPENAI_BASE_URL=http://localhost:11434/v1`
  - `OPENAI_API_KEY=ollama`

## vLLM
- Launch with OpenAI server: `python -m vllm.entrypoints.openai.api_server --model <hf-model>`
- Set `OPENAI_BASE_URL` to the server URL; choose an API key value (any).

## Limits & Tips
- Context: choose prompts that fit smaller contexts unless configured otherwise.
- Quantization: prefer Q4/Q5 for memory; verify accuracy for your task.
- Throughput: enable tensor parallel where available; batch small requests.
- Compatibility: use plain chat completions; avoid advanced features unless supported.

