# Notebook Quality Checklist (Author/Reviewer)

- Title & outcomes: clear objective, expected result, time estimate
- Prereqs: keys, hardware, costs, links to docs stated up front
- Setup cell: env print, version pins, GPU check, seed set
- Secrets: read from env; no keys in-source; helpful error if missing
- Quickstart: runnable in <1 minute; minimal working example succeeds
- Structure: sections for Concepts, Guided Steps, Evaluation, Troubleshooting, Exercises
- Prompting: explicit instructions, format requirements, few-shot coherence, JSON mode if relevant
- Safety & cost: show usage tokens/cost; note rate limits and retries
- Evaluation: tiny golden set or acceptance tests included; deterministic settings for eval
- Robustness: retries/backoff, timeouts, validation of structured outputs
- Performance: batching/streaming where useful; token economy tips
- Accessibility: concise text, readable headings, alt text for images
- Distribution: Colab badge (if applicable), public sample data, license note
- Cleanup: instructions to stop jobs/free resources

If 11+ boxes are checked, your notebook is likely ready to publish/teach.
