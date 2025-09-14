# ALAIN-Kit Model Testing

This directory contains test scripts to validate ALAIN-Kit's notebook generation across different model providers.

## Tested Models

### Local Models
- **Ollama** (localhost:11434)
- **LM Studio** (localhost:1234)

### Poe Models
- GPT-5
- GPT-OSS-20B
- GPT-OSS-120B
- GPT-OSS-120B-T

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # For Poe API
   export POE_API_KEY='your-poe-api-key'
   ```

## Running Tests

### Run All Tests
```bash
npm run test:all
```

### Run Specific Tests
```bash
# Test only local models (Ollama, LM Studio)
npm run test:local

# Test only Poe models
npm run test:poe

# Test specific model
npx tsx run-all-tests.ts --filter "Ollama"
```

## Output

Test results and generated notebooks will be saved to:
```
test/output/
  ├── ollama/
  │   ├── prompting-guide.ipynb
  │   └── validation-report.md
  ├── lm-studio/
  │   ├── prompting-guide.ipynb
  │   └── validation-report.md
  └── poe-*/
      ├── prompting-guide.ipynb
      └── validation-report.md
```

## Test Configuration

Edit `run-all-tests.ts` to modify:
- Test models and endpoints
- Prompt templates
- Number of sections to generate
- Output directories
