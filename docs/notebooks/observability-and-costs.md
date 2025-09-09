# Observability & Costs

- Token usage: print prompt/completion/input/output tokens when available.
- Latency: time key calls; report average over a small sample.
- Logging: summarize per‑section metrics; avoid verbose dumping.
- Cost estimation: multiply token counts by current pricing; show per‑step totals.
- Caching: reuse embeddings/results where possible to reduce spend.
- Limits: document rate limits and backoff strategies in troubleshooting.

