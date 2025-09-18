# Tool-Calling Baseline: Pipeline Trace & Validator Contract

## 1. Current Pipeline Flow

### 1.1 Outline Generation
- **Entry:** `ALAINKit.generateNotebook` (`packages/alain-kit/validation/integration.ts:60`)
- **Call:** `OutlineGenerator.generateOutline` (`packages/alain-kit/core/outline-generator.ts`)
- **Inputs:** model reference, difficulty, optional custom prompt
- **Outputs:** `NotebookOutline` with title, objectives, prerequisites, setup commands, outline steps, exercises, assessments, summary, references
- **Validation:** `OutlineGenerator.validateOutline` ensures step count, token budgets, required fields before proceeding

### 1.2 Section Generation
- **Dir:** Checkpoints persisted under `/tmp/alain-kit-<timestamp>/sections`
- **For each step (1..n):**
  - Inputs: full outline, section number, prior generated sections (context), model reference, difficulty, prompt overrides
  - Call: `SectionGenerator.generateSection` (`packages/alain-kit/core/section-generator.ts:86`)
  - Completeness guard: `ensureSectionCompleteness` enforces at least one markdown cell, one code cell, placeholder bans, callouts (tip/warning/note), markdown length, code executable content
  - Validator: `SectionGenerator.validateSection` checks token estimates (>=~680, <=~2200), markdown/code presence, placeholder regex, estimated token delta
  - Retry: wrapped in `attemptWithBackoff` up to 5 attempts; section JSON cached to disk for resume

### 1.3 Notebook Assembly
- **Call:** `NotebookBuilder.buildNotebook` (stitches outline metadata + ordered sections)
- **Artifacts:** raw `.ipynb` JSON (in-memory until validations complete)
- **Downstream QA:**
  - `QaGate.evaluate`: structural sanity (outline completeness, placeholder scans, objective alignment)
  - `SemanticValidator.evaluate`: optional LLM-based semantic checks (flag filler content, policy issues)

### 1.4 Validation & Export
- **Quality Validator:** `QualityValidator.validateNotebook` (`packages/alain-kit/validation/quality-validator.ts:20`)
  - Returns `QualityMetrics` (score, step count, markdown ratio, token estimate, reading time, hasRequiredSections, meetsStandards >=90)
- **Colab Validator:** `ColabValidator.validateNotebook` (`packages/alain-kit/validation/colab-validator.ts`) auto-fixes common issues and ensures `isCompatible`
- **Final Report:** `generateValidationReport` synthesizes quality + Colab results; pipeline fails fast if quality standards not met or QA gates fail earlier

## 2. Validator Requirements (for Tool Contracts)

### 2.1 Quality Metrics
| Metric | Expectation | Notes |
| --- | --- | --- |
| `qualityScore` | >= 90/100 | Weighted: structure (40), step count (20), markdown ratio (20), token budget (20) |
| `stepCount` | 6-15 optimal; >=3 minimum | Derived from headings `## Step N:` or `## Section N:` |
| `markdownRatio` | 0.4-0.7 optimal (0.3-0.8 tolerated) | Ratio of markdown to total cells |
| `estimatedTokens` | 2,000-4,000 optimal (1,000-6,000 tolerated) | Based on cell text length /4 |
| `hasRequiredSections` | true | Title, objectives, setup, assessments detected |
| `estimatedReadingTime` | computed from tokens/200 | Used for reporting only |

### 2.2 Section Completeness Rules
- Markdown content >=150 characters per markdown cell
- Minimum one markdown cell and one runnable code cell per section
- Code cell must have >=3 non-comment lines
- Mandatory callouts: at least 3 (`tip`, `warning`, `note`)
- Placeholder blacklist (`Replace the placeholder`, `Thinking...`, etc.)
- Token window per section: 800-2,000 tokens target (`MIN_TOKENS = 800`, `TOKEN_LIMIT = 2000`)

### 2.3 Colab Compatibility
- Critical issues: subprocess pip installs without Colab guard, hardcoded token placeholders, unguarded `device_map="auto"`
- Auto-fixes inject environment detection cell and apply targeted replacements
- Validator tolerates up to `ALAIN_COLAB_MAX_ISSUES` critical items (default 0); notebook must be compatible after fixes or pipeline fails

### 2.4 QA Gate & Semantic Checks
- QA gate blocks on missing sections, placeholder content, or outline misalignment before heavy validators
- Semantic validator (conditional) must return `status !== 'fail'`; report includes filler section detection and policy compliance issues

## 3. Artifacts & Telemetry
- **Artifacts Generated:** outline JSON, per-section JSON checkpoints, assembled notebook JSON, validation markdown, metrics JSON, QA report, semantic report
- **Metrics/Events:** `alain_outline_duration_ms`, `alain_section_duration_ms`, `alain_pipeline_success_total`, `alain_pipeline_failures_total`, QA/semantic events, section trace logs if `ALAIN_HUMAN_REVIEW_DIR` set

## 4. Implications for Tool Design
- Each tool must produce outputs satisfying the above validators without post-hoc text repairs
- Callouts, markdown length, and code executability need explicit parameters (e.g., structured callout array, code blocks)
- Section tools should emit estimated tokens and callouts to satisfy completeness checks
- Validator tools must expose quality/Colab results with the same schema (`QualityMetrics`, `ColabValidationResult`) so existing dashboards remain accurate

## 5. Next Steps
1. Circulate this baseline with notebook + validation owners for confirmation
2. Use the metric thresholds to draft tool instructions and JSON schemas (Phase 02)
3. Ensure telemetry hooks remain intact when calls move from prompt responses to tool outputs
