# Data Privacy & Secrets

- API Keys: read via env (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`); no hardcoding.
- Redaction: avoid printing secrets; scrub exceptions; don’t log full payloads.
- PII: don’t include real personal data; use synthetic samples; document retention.
- Local caches: point to user‑owned paths; provide cleanup cell.
- Uploads: warn about sending data to third‑party APIs; include opt‑out switches.
- Access control: assume notebooks are shareable; keep credentials outside the repo.

