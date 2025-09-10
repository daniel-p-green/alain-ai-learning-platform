# Build: Run GPT‑OSS Locally (OpenAI‑Compatible API)

Parts: [AL-P101, AL-P102, AL-P103]
Tools: [Terminal, curl, .env editor]
Time: ~15–25 min

Part No. / Description
- AL-P101 — Runtime: Ollama (preferred) or vLLM
- AL-P102 — Model Weights: `llama3.1:8b` (or `qwen2:7b`)
- AL-P103 — Backend Env: `OPENAI_BASE_URL`, `OPENAI_API_KEY`

1) Unpack runtime (AL-S010)
   - Install Ollama: https://ollama.ai
   - Or prepare Python environment for vLLM

2) Pull a base model (AL-S020)
   - `ollama pull llama3.1:8b`
   - or `ollama pull qwen2:7b`

3) Start local API (AL-S030)
   - Ollama default endpoint: `http://localhost:11434/v1`
   - vLLM: `python -m vllm.entrypoints.openai.api_server --model <hf-model>`

4) Set backend environment (AL-S040)
   - `OPENAI_BASE_URL=http://localhost:11434/v1`
   - `OPENAI_API_KEY=ollama` (placeholder)

5) Smoke test the endpoint (AL-S050)
```bash
curl -s -X POST "$OPENAI_BASE_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "llama3.1:8b",
    "messages": [
      {"role":"system","content":"You are helpful."},
      {"role":"user","content":"Say hello in five words."}
    ]
  }' | jq '.choices[0].message.content'
```

6) Verify in the ALAIN app (AL-S060)
   - Select `GPT-OSS-20B` (alias will route via backend to your local model)
   - Generate a lesson → Open Tutorial → run the first step

QA
- Chat request returns 200 with non‑empty content
- Lesson steps stream output and show a `[DONE]` terminator
- Costs/latency show local values (no remote provider charges)

Troubleshooting
- If you see connection errors: confirm `OPENAI_BASE_URL` and port 11434
- If model errors out: try a smaller context prompt; verify model is loaded
- vLLM: add `--tensor-parallel-size` if you have multiple GPUs

Notes
- You can keep your local model selection while using the `GPT‑OSS-20B` teacher alias in the app; only the API base URL and key matter for routing.

