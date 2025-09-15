# ALAIN‑Kit SDK

Public SDK for outline‑first notebook generation, validation, and Colab compatibility. This provides a stable import surface that re‑exports the production modules in `alain-kit`.

## Install

Use `tsx` to run TypeScript directly (dev dependency is included in this subpackage).

## Quick Start

```ts
import { ALAINKit } from 'alain-kit-sdk';

const kit = new ALAINKit();
const res = await kit.generateNotebook({
  modelReference: 'https://huggingface.co/model-name',
  apiKey: process.env.POE_API_KEY || '',
  difficulty: 'beginner',
  maxSections: 6
});

console.log('Quality:', res.qualityScore, 'Colab:', res.colabCompatible ? '✅' : '⚠️');
```

Provider baseUrl tip
- When passing a custom base URL to the SDK or CLI, use the provider root without `/v1` (e.g., `https://api.poe.com`, `http://localhost:1234`). The SDK appends `/v1/chat/completions` automatically.

Run the example:

```bash
cd alain-ai-learning-platform/alain-kit-sdk
npx tsx examples/usage-example.ts
```

## Exports

- `ALAINKit`, `generateNotebook`
- `QualityValidator`, `ColabValidator`
- `OutlineGenerator`, `SectionGenerator`, `NotebookBuilder`

The SDK aligns with the orchestration guidance in `prompts/alain-kit/util/gpt-oss_orchestration_notes.md`.
