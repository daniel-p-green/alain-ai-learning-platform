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
- Some Poe-hosted teacher models (e.g., `gpt-5`) reject custom temperature hints; the SDK detects these and omits the `temperature` field automatically.

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

## Environment and API Keys

- ALAIN‑Kit loads environment variables from `.env.local` (preferred) then `.env`.
  - The CLI loads from your current working directory first, then from the repo root.
  - Common keys: `POE_API_KEY` (preferred for Poe‑compatible servers), `OPENAI_API_KEY`, `HF_TOKEN`.
- Every generated notebook includes two early cells:
  - A short primer explaining why `.env` files matter and where to put them.
  - A loader cell that installs `python‑dotenv` if needed, loads `.env.local`/`.env`, prompts for missing keys, and can write `.env.local` with 0600 permissions (toggle `SAVE_TO_ENV = False` to disable).
- The CLI seeds `<outDir>/.env.local.example` on first run if no `.env` is present.

Tip: keep secrets out of version control. `.gitignore` already ignores `.env*`.

## .env Best Practices

- Use `.env.local` for machine-specific secrets; keep `.env` for shared non-secret defaults.
- Never commit real secrets. Use placeholder examples (the CLI seeds `.env.local.example`).
- Quote values that contain spaces or special characters.
- Rotate and revoke tokens you no longer use; prefer least-privilege scopes.
- In Colab, you can also use `google.colab.userdata` to store keys per session.
