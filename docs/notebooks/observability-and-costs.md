# Observability & Costs

- Token usage: print prompt/completion/input/output tokens when available.
- Latency: time key calls; report average over a small sample.
- Logging: summarize per‑section metrics; avoid verbose dumping.
- Cost estimation: multiply token counts by current pricing; show per‑step totals.
- Caching: reuse embeddings/results where possible to reduce spend.
- Limits: document rate limits and backoff strategies in troubleshooting.

Cost formula example (OpenAI‑compatible)
```
prompt = usage.prompt_tokens or 0
completion = usage.completion_tokens or 0
input_cost_per_1k = 0.15   # example only
output_cost_per_1k = 0.60  # example only
cost = (prompt/1000.0)*input_cost_per_1k + (completion/1000.0)*output_cost_per_1k
print(f"Estimated cost: ${cost:.4f}")
```

Local GPT‑OSS note
- Local runs are compute‑bound, not billed per token. Expect faster latency with adequate VRAM (e.g., ≥8–16GB for small models). Reduce `max_tokens` and batch size if memory is limited.
