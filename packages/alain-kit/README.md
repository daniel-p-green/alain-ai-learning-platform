# ALAIN-Kit: Production-Ready Notebook Generation System

## Overview

ALAIN‑Kit generates production‑ready, Colab‑compatible Jupyter notebooks via a single, reliable flow:

1) The model returns small JSON artifacts (OutlineJSON, then StepFillJSON).
2) ALAIN‑Kit assembles the final `.ipynb` locally (NotebookBuilder).
3) Quality + Colab validators enforce pinned installs, structure, and fixes.

Never ask the model to emit a full ipynb — assembly is always local. For apps, use `alain-ai-learning-platform/alain-kit-sdk`, which re‑exports the modules and provides a CLI.

## Architecture

```
alain-kit/
├── core/                    # Core generation logic
│   ├── outline-generator.ts # Step 1: Generate OutlineJSON (JSON mode)
│   ├── section-generator.ts # Step 2: Fill sections → StepFillJSON (JSON mode)
│   └── notebook-builder.ts  # Step 3: Assemble final ipynb locally
├── prompts/                 # Optimized prompts (if used)
│   ├── outline.txt          # Outline generation prompt
│   └── section.txt          # Section filling prompt
├── validation/              # Quality & compatibility validation
│   ├── quality-validator.ts # Quality scoring (90+ target)
│   ├── colab-validator.ts  # Colab compatibility fixes
│   └── integration.ts      # Combined validation pipeline
└── examples/               # Usage examples
    └── tinyllama-example.ts
```

## Key Features

### 1. Outline‑First Generation (Single Contract)
- Model only returns OutlineJSON and StepFillJSON (JSON mode on OpenAI‑compatible backends)
- Local assembly guarantees consistent kernelspec, pinned installs, env detection
- Default decoding: outline temp 0.30; fill temp 0.45; top_p 0.9; chunk size 1

### 2. Quality Validation
- Based on 575 notebook analysis
- 90+ quality score target
- Validates structure, content balance, readability

### 3. Colab Compatibility
- Automatic error detection and fixing
- Environment detection and adaptation
- Memory management and troubleshooting

### 4. Production Ready
- Clean, documented codebase
- Error handling and validation
- Scalable section-by-section generation

## Usage (SDK)

```typescript
import { ALAINKit } from 'alain-kit-sdk'

const kit = new ALAINKit({ baseUrl: process.env.OPENAI_BASE_URL })
const res = await kit.generateNotebook({
  modelReference: 'gpt-oss-20b',
  apiKey: process.env.POE_API_KEY,
  difficulty: 'beginner',
  maxSections: 8
})

// res.notebook is a complete ipynb object
// res.validationReport includes quality + colab status
```

Tip for Poe and local OpenAI‑compatible servers
- When passing a custom base URL (CLI or SDK), use the provider root without `/v1` (e.g., `https://api.poe.com` or `http://localhost:1234`). The SDK appends `/v1/chat/completions` automatically.

## Quality Standards (Enforced)

- Structure: Objectives, Prereqs, Setup, 6–12 Steps, Exercises, Summary, References
- Content: Target markdown ratio ~0.56 (acceptable 0.45–0.70), split code cells >40 lines
- Compatibility: Colab checks + fixes (install cell with pinned versions)
- Token budget: ~900–1100 tokens per step; soft 7.5k / hard 9k total

## Generated Notebooks Include

- Environment detection (Colab vs local)
- Pinned installs (package==version) and setup cell
- Secure token handling (.env guidance)
- Memory and troubleshooting guidance
- Interactive assessments
- Reproducible configuration (seeds, versions)

## Web Integration

- Server route calls `ALAINKit.generateNotebook(...)` and returns `res.notebook`.
- Keep API keys server‑side; pass `baseUrl` (provider root) and `apiKey`.
- Optional: stream progress (outline → N section fill ticks → assembly) via SSE. Complexity is moderate and does not change the core pipeline.

Tip: For Poe/local providers, set JSON mode via `response_format: { type: 'json_object' }` — already handled in generators.
