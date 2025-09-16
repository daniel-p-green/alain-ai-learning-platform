# Third-Party Testing Instructions: ALAIN-Kit Outline-First Generator

## Overview

You are being asked to conduct an independent review and testing of the ALAIN‑Kit outline‑first notebook generation system. The project now uses `alain-kit` (and `alain-kit-sdk` for the CLI). Prior debugging focused on Poe API integration and robust JSON extraction.

## What Was Recently Fixed
The previous engineer addressed these critical issues:
1. **Poe API 403 Errors** — Ensured correct `/v1/chat/completions` endpoint usage
2. **JSON Parsing Robustness** — Added loose JSON extraction with fallback sections
3. **Quality Validation** — Strengthened checks for required structure and content balance
4. **Schema/Artifacts** — Standardized output to Jupyter `.ipynb` with validation report and metrics

## Test Environment Setup

### Prerequisites
```bash
cd /Users/danielgreen/Downloads/OSS\ hackathon/alain-ai-learning-platform
npm install
```

### JS/TS Unit Tests (Vitest)
- Run all JS/TS unit tests from the repo root (projects: backend + web):
```bash
npx vitest run --reporter=dot
```
- Notes:
  - E2E Playwright specs under `web/e2e/**` are excluded from Vitest.
  - Backend “tutorials” DB/runtime tests are skipped unless `ENCORE_RUNTIME_LIB` is set (see apps/apps/backend/TESTING.md).
  - HF metadata fetch runs in offline mode during tests to avoid network flakiness.

### Enable Encore-Dependent Backend Tests
Some backend tutorial tests require the Encore runtime library. To run them:
```bash
export ENCORE_RUNTIME_LIB="$(node -e "console.log(require.resolve('encore.dev/dist/internal/runtime/napi/encore-runtime.node'))")"
npx vitest run --reporter=dot
```

### Required Environment Variables
In your shell (or `.env` you source before running):
```bash
export POE_API_KEY=your_poe_api_key_here
```

## Test Cases to Execute

### 1. Basic Functionality Test
Run the SDK CLI from the repo root. Note: pass Poe base URL without `/v1` — the system appends it.
```bash
npm run alain:cli -- \
  --model gpt-oss-20b \
  --baseUrl https://api.poe.com \
  --difficulty beginner \
  --maxSections 6 \
  --outDir packages/alain-kit/test/output/outline-first
```

**Expected Outcomes:**
- ✅ Notebook generated as `.ipynb`
- ✅ Validation report `.md` created with readability metrics
- ✅ Metrics `.json` emitted (quality score, sections, readability)

**Success Criteria:**
- No unhandled exceptions; CLI exits 0
- Quality score present; sections generated (target 6)
- Readability metrics reported

### 2. Artifacts Verification
After running, list the output directory:
```bash
ls -la packages/alain-kit/test/output/outline-first
```

**Expected Files:**
- `alain-notebook-*.ipynb` — Final Jupyter notebook
- `alain-validation-*.md` — Validation report (includes readability)
- `alain-metrics-*.json` — Structured metrics

**Validation Steps:**
```bash
# Inspect report key lines
grep -E "Score:|FK Grade|Markdown Ratio" $(ls -t packages/alain-kit/test/output/outline-first/alain-validation-*.md | head -n1)

# Inspect metrics
jq '.qualityScore, .sectionCount, .readability' $(ls -t packages/alain-kit/test/output/outline-first/alain-metrics-*.json | head -n1)
```

### 3. Error Handling Test
Temporarily use an invalid key to test failure behavior:
```bash
POE_API_KEY=invalid npm run alain:cli -- \
  --model gpt-oss-20b \
  --baseUrl https://api.poe.com \
  --difficulty beginner \
  --maxSections 6 \
  --outDir packages/alain-kit/test/output/outline-first
```

**Expected Behavior:**
- Clear error message and non‑zero exit
- Artifacts may not be created on failure

### 4. Schema Validation Test
Verify the Jupyter notebook structure:
```bash
cat packages/alain-kit/test/output/outline-first/alain-notebook-*.ipynb | jq '.nbformat, .nbformat_minor, .cells[0].cell_type'
```

**Verify Structure Includes:**
- Top‑level keys: `cells`, `metadata`, `nbformat`, `nbformat_minor`
- A markdown title cell; objectives; setup; generated section cells; troubleshooting

### 5. Quality Gates Test
Use the metrics JSON and report to confirm quality thresholds:
```bash
jq '.qualityScore, .sectionCount, .readability' $(ls -t packages/alain-kit/test/output/outline-first/alain-metrics-*.json | head -n1)
```

**Expected Quality Checks:**
- Steps in notebook: 6–15 typical; CLI run used 6
- Quality score: target ≥ 90
- Markdown ratio: 0.40–0.70

### 6. Colab Pip Fallback (Manual Spot Check)
- Goal: ensure the Colab validator rewrites `subprocess.check_call([...pip install...])` when no Colab guard is present.
- Steps:
  1. Create a trivial notebook with a single code cell containing:
     ```python
     import subprocess, sys
     subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'transformers', 'torch'])
     ```
     Save as `tmp-colab.ipynb`.
  2. Run a short Node script:
     ```bash
     node - <<'JS'
     const { ColabValidator } = require('./packages/alain-kit/validation/colab-validator');
     const res = new ColabValidator().validateNotebook('tmp-colab.ipynb');
     res.then((out) => {
       console.log('issues:', out.issues);
       console.log('fixed cell:', out.fixedNotebook?.cells?.[0]?.source?.join(''));
     });
     JS
     ```
  3. Confirm the fixed cell now contains the Colab guard with a `%pip` fallback and that `issues` is empty.

Automation: `apps/apps/backend/validation/colab-validator.test.ts` provides unit coverage for both unguarded and guarded code paths.

## Critical Areas to Focus On

### 1. JSON Parsing Robustness
- Issue: LLM responses can include extra text around JSON
- Fix Applied: `core/json-utils.ts` loose extraction with fallback
- Test: Validate valid notebook even if a section JSON parse is imperfect

### 2. API Integration Stability
- Issue: 403 errors from incorrect endpoint construction
- Fix Applied: All calls use `${baseUrl}/v1/chat/completions` with `Authorization: Bearer`
- Test: Confirm successful calls with `--baseUrl https://api.poe.com` (no trailing `/v1`)

### 3. Notebook Assembly
- Issue: Consistent Jupyter structure and Colab compatibility
- Fix Applied: Centralized builder in `packages/alain-kit/core/notebook-builder.ts`
- Test: Verify `.ipynb` opens in Jupyter/Colab; check setup and troubleshooting cells

### 4. Validation & Reporting
- Issue: Clear, actionable quality feedback
- Fix Applied: `validation/quality-validator.ts` and appended readability in report
- Test: Check report and metrics for thresholds and readability values

## Performance Benchmarks
- Outline generation: typically < 20s
- Section generation: rate‑limited (~1s between sections) + model latency
- Total time (6 sections): typically < 2 minutes

## Red Flags to Report
1. Unhandled exceptions or process crashes
2. Invalid `.ipynb` (missing required top‑level fields)
3. Low quality score (< 90) with poor markdown ratio
4. API failures (403/401) due to incorrect headers or endpoint
5. Missing artifacts (no notebook/report/metrics on success)

## Success Metrics
- [ ] CLI run completes without exceptions (exit 0)
- [ ] Generated `.ipynb`, validation report, and metrics JSON exist
- [ ] Quality score ≥ 90; markdown ratio in 0.40–0.70
- [ ] Sections generated match requested count (e.g., 6)

## Reporting Format
Please provide:
1. Test results summary (pass/fail per case)
2. Performance metrics (timings; any rate limits observed)
3. Generated artifacts (paths to notebook/report/metrics; key metrics)
4. Issues found (bugs, edge cases, suggested improvements)
5. Recommendations (further stabilization or tuning)

## Additional Context
This system is part of the ALAIN AI Learning Platform. The outline‑first architecture is designed to generate high‑quality educational notebooks with executable code, markdown explanations, and compatibility with Google Colab. Recent work focused on robust JSON handling, Poe API stability, and clear validation reporting.
