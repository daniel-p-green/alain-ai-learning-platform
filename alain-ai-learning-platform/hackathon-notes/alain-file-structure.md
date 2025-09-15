# ALAIN AI Learning Platform — File Structure

Generated: 2025-09-15T04:17:59Z (UTC)
Scope: lists all git-tracked files and directories under 'alain-ai-learning-platform'. Excludes untracked dependencies and build artifacts (e.g., node_modules, .next).

## Directory Tree (git-tracked)

```text
alain-ai-learning-platform/
├── ./
├── .github/
│   └── workflows/
├── alain-kit/
│   ├── core/
│   ├── examples/
│   └── validation/
├── alain-kit-clean/
│   └── test/
│       └── output/
│           ├── audit/
│           │   └── 2025-09-14T21-29-46-038Z/
│           ├── lm-studio/
│           ├── ollama/
│           ├── outline-first/
│           ├── poe-gpt-5/
│           ├── poe-gpt-oss-120b/
│           ├── poe-gpt-oss-120b-t/
│           └── poe-gpt-oss-20b/
├── alain-kit-sdk/
│   ├── bin/
│   └── examples/
├── backend/
│   ├── assessments/
│   ├── catalog/
│   ├── config/
│   ├── content/
│   │   └── research/
│   │       └── openai/
│   │           ├── gpt-oss-120b/
│   │           └── gpt-oss-20b/
│   ├── execution/
│   │   ├── prompts/
│   │   ├── providers/
│   │   └── spec/
│   ├── export/
│   ├── frontend/
│   │   └── dist/
│   ├── progress/
│   ├── research/
│   ├── research-outputs/
│   │   ├── bert-alain-kit-research/
│   │   ├── microsoft/
│   │   │   └── DialoGPT-medium/
│   │   └── openai/
│   │       ├── gpt-3.5-turbo/
│   │       ├── gpt-oss-120b/
│   │       └── gpt-oss-20b/
│   ├── scripts/
│   ├── storage/
│   ├── tutorials/
│   │   └── migrations/
│   └── utils/
├── brand/
│   └── examples/
├── content/
│   ├── lessons/
│   │   └── poe/
│   │       ├── custom-content/
│   │       │   └── 2025-09-14/
│   │       └── gpt-oss-20b/
│   │           ├── 2025-09-13/
│   │           └── 2025-09-14/
│   ├── notebooks/
│   │   ├── openai/
│   │   │   └── gpt-oss-20b/
│   │   └── poe/
│   │       ├── custom-content/
│   │       │   └── beginner/
│   │       │       └── 2025-09-14/
│   │       └── gpt-oss-20b/
│   │           └── beginner/
│   │               ├── 2025-09-13/
│   │               └── 2025-09-14/
│   └── research/
│       └── openai/
│           └── gpt-oss-20b/
│               └── hf-files/
│                   └── original/
├── data/
│   └── notebooks/
│       └── gpt-oss-20b/
│           └── beginner/
│               └── 2025-09-13/
├── docs/
│   ├── debug/
│   ├── examples/
│   ├── gpt-oss/
│   ├── notebooks/
│   ├── screenshots/
│   └── templates/
├── examples/
│   └── poe/
├── hackathon-notes/
├── prompts/
│   └── alain-kit/
│       ├── archive/
│       │   └── develop/
│       ├── flattened/
│       │   ├── openai-compatible/
│       │   └── poe/
│       ├── optimized/
│       ├── outline-first/
│       ├── section-fill/
│       └── util/
├── research-outputs/
│   ├── chatgpt-experience-research/
│   ├── chatgpt-real-model-research/
│   ├── enhanced-demo/
│   ├── real-model-microsoft-CodeBERT-base/
│   └── real-model-microsoft-DialoGPT-medium/
├── schemas/
├── scripts/
│   └── smoke/
├── tests/
│   └── notebooks_smoke/
└── web/
    ├── __tests__/
    ├── app/
    │   ├── admin/
    │   │   └── moderation/
    │   ├── api/
    │   │   ├── adapt/
    │   │   ├── admin/
    │   │   │   ├── moderation/
    │   │   │   │   └── [id]/
    │   │   │   │       ├── approve/
    │   │   │   │       └── reject/
    │   │   │   ├── notebooks/
    │   │   │   │   ├── [id]/
    │   │   │   │   └── upload/
    │   │   │   └── settings/
    │   │   │       └── github/
    │   │   ├── aggregator/
    │   │   │   └── index/
    │   │   ├── catalog/
    │   │   │   ├── lessons/
    │   │   │   │   ├── public/
    │   │   │   │   └── publish/
    │   │   │   └── notebooks/
    │   │   │       ├── mine/
    │   │   │       ├── public/
    │   │   │       └── publish/
    │   │   ├── content/
    │   │   │   ├── index/
    │   │   │   └── research/
    │   │   ├── exec/
    │   │   ├── execute/
    │   │   ├── export/
    │   │   │   └── colab/
    │   │   │       └── local/
    │   │   │           └── [id]/
    │   │   ├── files/
    │   │   │   └── download/
    │   │   ├── generate-from-text/
    │   │   ├── generate-lesson/
    │   │   ├── generate-local/
    │   │   ├── health/
    │   │   ├── hf/
    │   │   │   └── model/
    │   │   ├── library/
    │   │   │   └── pointer/
    │   │   ├── lmstudio/
    │   │   │   ├── download/
    │   │   │   ├── options/
    │   │   │   │   └── [id]/
    │   │   │   └── search/
    │   │   ├── notebooks/
    │   │   │   ├── [id]/
    │   │   │   │   ├── export/
    │   │   │   │   │   └── alain/
    │   │   │   │   ├── publish-request/
    │   │   │   │   └── remix/
    │   │   │   ├── featured/
    │   │   │   ├── grade/
    │   │   │   ├── ingest/
    │   │   │   ├── remix/
    │   │   │   └── upload/
    │   │   ├── phases/
    │   │   ├── providers/
    │   │   │   ├── models/
    │   │   │   ├── ollama/
    │   │   │   │   ├── show/
    │   │   │   │   └── tags/
    │   │   │   └── smoke/
    │   │   ├── repair-lesson/
    │   │   ├── research/
    │   │   ├── setup/
    │   │   └── tutorials/
    │   │       ├── [id]/
    │   │       │   ├── progress/
    │   │       │   └── publish/
    │   │       ├── local/
    │   │       │   └── [id]/
    │   │       └── public/
    │   ├── blueprint/
    │   ├── explore/
    │   │   ├── lessons/
    │   │   └── notebooks/
    │   ├── generate/
    │   ├── hackathon-notes/
    │   │   ├── generate/
    │   │   ├── settings/
    │   │   └── tutorials/
    │   ├── health/
    │   ├── home/
    │   ├── lmstudio/
    │   ├── my/
    │   │   └── notebooks/
    │   ├── notebooks/
    │   │   ├── [id]/
    │   │   │   └── edit/
    │   │   └── featured/
    │   ├── onboarding/
    │   ├── phases/
    │   ├── research/
    │   ├── stream/
    │   ├── tutorials/
    │   │   └── [id]/
    │   ├── upload/
    │   └── v1/
    │       └── generate/
    ├── components/
    ├── data/
    ├── docs/
    ├── e2e/
    ├── features/
    │   ├── generate/
    │   ├── onboarding-settings/
    │   │   └── __tests__/
    │   └── research/
    ├── lib/
    │   └── providers/
    ├── public/
    │   └── brand/
    ├── scripts/
    └── types/
```

## Basic Directory Overview
Top-level and nested directories (git-tracked):

- .
- .github/workflows
- alain-kit
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z
- alain-kit-clean/test/output/lm-studio
- alain-kit-clean/test/output/ollama
- alain-kit-clean/test/output/outline-first
- alain-kit-clean/test/output/poe-gpt-5
- alain-kit-clean/test/output/poe-gpt-oss-120b
- alain-kit-clean/test/output/poe-gpt-oss-120b-t
- alain-kit-clean/test/output/poe-gpt-oss-20b
- alain-kit-sdk
- alain-kit-sdk/bin
- alain-kit-sdk/examples
- alain-kit/core
- alain-kit/examples
- alain-kit/validation
- backend
- backend/assessments
- backend/catalog
- backend/config
- backend/content/research/openai/gpt-oss-120b
- backend/content/research/openai/gpt-oss-20b
- backend/execution
- backend/execution/prompts
- backend/execution/providers
- backend/execution/spec
- backend/export
- backend/frontend
- backend/frontend/dist
- backend/progress
- backend/research
- backend/research-outputs
- backend/research-outputs/bert-alain-kit-research
- backend/research-outputs/microsoft/DialoGPT-medium
- backend/research-outputs/openai/gpt-3.5-turbo
- backend/research-outputs/openai/gpt-oss-120b
- backend/research-outputs/openai/gpt-oss-20b
- backend/scripts
- backend/storage
- backend/tutorials
- backend/tutorials/migrations
- backend/utils
- brand
- brand/examples
- content
- content/lessons/poe/custom-content/2025-09-14
- content/lessons/poe/gpt-oss-20b/2025-09-13
- content/lessons/poe/gpt-oss-20b/2025-09-14
- content/notebooks/openai/gpt-oss-20b
- content/notebooks/poe/custom-content/beginner/2025-09-14
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14
- content/research/openai/gpt-oss-20b
- content/research/openai/gpt-oss-20b/hf-files
- content/research/openai/gpt-oss-20b/hf-files/original
- data/notebooks/gpt-oss-20b/beginner/2025-09-13
- docs
- docs/debug
- docs/examples
- docs/gpt-oss
- docs/notebooks
- docs/screenshots
- docs/templates
- examples
- examples/poe
- hackathon-notes
- prompts/alain-kit
- prompts/alain-kit/archive/develop
- prompts/alain-kit/flattened/openai-compatible
- prompts/alain-kit/flattened/poe
- prompts/alain-kit/optimized
- prompts/alain-kit/outline-first
- prompts/alain-kit/section-fill
- prompts/alain-kit/util
- research-outputs
- research-outputs/chatgpt-experience-research
- research-outputs/chatgpt-real-model-research
- research-outputs/enhanced-demo
- research-outputs/real-model-microsoft-CodeBERT-base
- research-outputs/real-model-microsoft-DialoGPT-medium
- schemas
- scripts
- scripts/smoke
- tests/notebooks_smoke
- web
- web/__tests__
- web/app
- web/app/admin
- web/app/admin/moderation
- web/app/api/adapt
- web/app/api/admin/moderation/[id]/approve
- web/app/api/admin/moderation/[id]/reject
- web/app/api/admin/notebooks/[id]
- web/app/api/admin/notebooks/upload
- web/app/api/admin/settings/github
- web/app/api/aggregator/index
- web/app/api/catalog/lessons/public
- web/app/api/catalog/lessons/publish
- web/app/api/catalog/notebooks/mine
- web/app/api/catalog/notebooks/public
- web/app/api/catalog/notebooks/publish
- web/app/api/content/index
- web/app/api/content/research
- web/app/api/exec
- web/app/api/execute
- web/app/api/export/colab/local/[id]
- web/app/api/files/download
- web/app/api/generate-from-text
- web/app/api/generate-lesson
- web/app/api/generate-local
- web/app/api/health
- web/app/api/hf/model
- web/app/api/library/pointer
- web/app/api/lmstudio/download
- web/app/api/lmstudio/options/[id]
- web/app/api/lmstudio/search
- web/app/api/notebooks
- web/app/api/notebooks/[id]
- web/app/api/notebooks/[id]/export/alain
- web/app/api/notebooks/[id]/publish-request
- web/app/api/notebooks/[id]/remix
- web/app/api/notebooks/featured
- web/app/api/notebooks/grade
- web/app/api/notebooks/ingest
- web/app/api/notebooks/remix
- web/app/api/notebooks/upload
- web/app/api/phases
- web/app/api/providers
- web/app/api/providers/models
- web/app/api/providers/ollama/show
- web/app/api/providers/ollama/tags
- web/app/api/providers/smoke
- web/app/api/repair-lesson
- web/app/api/research
- web/app/api/setup
- web/app/api/tutorials/[id]
- web/app/api/tutorials/[id]/progress
- web/app/api/tutorials/[id]/publish
- web/app/api/tutorials/local/[id]
- web/app/api/tutorials/public
- web/app/blueprint
- web/app/explore/lessons
- web/app/explore/notebooks
- web/app/generate
- web/app/hackathon-notes/generate
- web/app/hackathon-notes/settings
- web/app/hackathon-notes/tutorials
- web/app/health
- web/app/home
- web/app/lmstudio
- web/app/my/notebooks
- web/app/notebooks
- web/app/notebooks/[id]
- web/app/notebooks/[id]/edit
- web/app/notebooks/featured
- web/app/onboarding
- web/app/phases
- web/app/research
- web/app/stream
- web/app/tutorials/[id]
- web/app/upload
- web/app/v1/generate
- web/components
- web/data
- web/docs
- web/e2e
- web/features/generate
- web/features/onboarding-settings
- web/features/onboarding-settings/__tests__
- web/features/research
- web/lib
- web/lib/providers
- web/public/brand
- web/scripts
- web/types

## Detailed File Listing (with brief descriptions)
Each entry is a file path relative to the repository root, annotated with a brief type description.

- .encoreignore — File
- .github/workflows/ci.yml — YAML config
- .gitignore — .gitignore
- .pre-commit-config.yaml — YAML config
- ENHANCED_RESEARCH_INTEGRATION_GUIDE.md — Markdown doc
- LICENSE — License
- README.md — README
- TESTING_INSTRUCTIONS.md — Markdown doc
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/fill-response-0.txt — Text resource
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/fill-response-1.txt — Text resource
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/fill-response-2.txt — Text resource
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/fill-thinking-0.txt — Text resource
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/fill-thinking-1.txt — Text resource
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/fill-thinking-2.txt — Text resource
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/outline-response.txt — Text resource
- alain-kit-clean/test/output/audit/2025-09-14T21-29-46-038Z/outline-thinking.txt — Text resource
- alain-kit-clean/test/output/lm-studio/prompting-gpt-oss-guide.ipynb — Jupyter notebook
- alain-kit-clean/test/output/lm-studio/validation-report.md — Markdown doc
- alain-kit-clean/test/output/ollama/prompting-gpt-oss-guide-2025-09-14T20-58-18.ipynb — Jupyter notebook
- alain-kit-clean/test/output/ollama/prompting-gpt-oss-guide.ipynb — Jupyter notebook
- alain-kit-clean/test/output/ollama/validation-report-2025-09-14T20-58-18.md — Markdown doc
- alain-kit-clean/test/output/ollama/validation-report.md — Markdown doc
- alain-kit-clean/test/output/outline-first/notebook-2025-09-14T21-23-31.json — JSON data/schema
- alain-kit-clean/test/output/outline-first/notebook-2025-09-14T21-29-46.json — JSON data/schema
- alain-kit-clean/test/output/outline-first/outline-2025-09-14T21-17-58.json — JSON data/schema
- alain-kit-clean/test/output/outline-first/outline-2025-09-14T21-19-09.json — JSON data/schema
- alain-kit-clean/test/output/outline-first/outline-2025-09-14T21-23-31.json — JSON data/schema
- alain-kit-clean/test/output/outline-first/outline-2025-09-14T21-29-46.json — JSON data/schema
- alain-kit-clean/test/output/poe-gpt-5/prompting-gpt-oss-guide.ipynb — Jupyter notebook
- alain-kit-clean/test/output/poe-gpt-5/validation-report.md — Markdown doc
- alain-kit-clean/test/output/poe-gpt-oss-120b-t/prompting-gpt-oss-guide.ipynb — Jupyter notebook
- alain-kit-clean/test/output/poe-gpt-oss-120b-t/validation-report.md — Markdown doc
- alain-kit-clean/test/output/poe-gpt-oss-120b/prompting-gpt-oss-guide.ipynb — Jupyter notebook
- alain-kit-clean/test/output/poe-gpt-oss-120b/validation-report.md — Markdown doc
- alain-kit-clean/test/output/poe-gpt-oss-20b/prompting-gpt-oss-guide.ipynb — Jupyter notebook
- alain-kit-clean/test/output/poe-gpt-oss-20b/validation-report.md — Markdown doc
- alain-kit-sdk/README.md — README
- alain-kit-sdk/bin/alain-kit.ts — CLI entry
- alain-kit-sdk/examples/bench-run.ts — TypeScript source
- alain-kit-sdk/examples/generate-prompting-guide.ts — TypeScript source
- alain-kit-sdk/examples/usage-example.ts — TypeScript source
- alain-kit-sdk/index.ts — TypeScript source
- alain-kit-sdk/package.json — Node package manifest
- alain-kit/README.md — README
- alain-kit/core/json-utils.ts — TypeScript source
- alain-kit/core/notebook-builder.ts — TypeScript source
- alain-kit/core/outline-generator.ts — TypeScript source
- alain-kit/core/section-generator.ts — TypeScript source
- alain-kit/examples/usage-example.ts — TypeScript source
- alain-kit/package.json — Node package manifest
- alain-kit/validation/colab-validator.ts — TypeScript source
- alain-kit/validation/integration.ts — TypeScript source
- alain-kit/validation/quality-validator.ts — TypeScript source
- backend/.encoreignore — File
- backend/.gitignore — .gitignore
- backend/TESTING.md — Markdown doc
- backend/alain-kit-research.ts — TypeScript source
- backend/assessments/api.ts — TypeScript source
- backend/assessments/encore.service.ts — TypeScript source
- backend/assessments/logic.test.ts — TypeScript source
- backend/assessments/logic.ts — TypeScript source
- backend/auth.ts — TypeScript source
- backend/catalog/api.ts — TypeScript source
- backend/catalog/store.ts — TypeScript source
- backend/config/env.ts — TypeScript source
- backend/content/research/openai/gpt-oss-120b/huggingface-info.md — Markdown doc
- backend/content/research/openai/gpt-oss-120b/model-card.md — Markdown doc
- backend/content/research/openai/gpt-oss-120b/openai-cookbook.md — Markdown doc
- backend/content/research/openai/gpt-oss-120b/research-data.json — JSON data/schema
- backend/content/research/openai/gpt-oss-120b/unsloth-content.md — Markdown doc
- backend/content/research/openai/gpt-oss-20b/huggingface-info.md — Markdown doc
- backend/content/research/openai/gpt-oss-20b/model-card.md — Markdown doc
- backend/content/research/openai/gpt-oss-20b/openai-cookbook.md — Markdown doc
- backend/content/research/openai/gpt-oss-20b/research-data.json — JSON data/schema
- backend/content/research/openai/gpt-oss-20b/unsloth-content.md — Markdown doc
- backend/convert-to-notebook.ts — TypeScript source
- backend/demo-gpt-oss-20b-tutorial.ipynb — Jupyter notebook
- backend/encore.app — File
- backend/execution/adapt.test.ts — TypeScript source
- backend/execution/adapt.ts — TypeScript source
- backend/execution/capabilities.ts — TypeScript source
- backend/execution/encore.service.ts — TypeScript source
- backend/execution/execute.ts — TypeScript source
- backend/execution/generate_import.integration.test.ts — TypeScript source
- backend/execution/health.ts — TypeScript source
- backend/execution/lesson-generator.test.ts — TypeScript source
- backend/execution/lesson-generator.ts — TypeScript source
- backend/execution/lmstudio_repo.ts — TypeScript source
- backend/execution/models.test.ts — TypeScript source
- backend/execution/models.ts — TypeScript source
- backend/execution/parse-model.ts — TypeScript source
- backend/execution/poe-nodejs.ts — TypeScript source
- backend/execution/prompts/loader.test.ts — TypeScript source
- backend/execution/prompts/loader.ts — TypeScript source
- backend/execution/providers/aliases.test.ts — TypeScript source
- backend/execution/providers/aliases.ts — TypeScript source
- backend/execution/providers/base.ts — TypeScript source
- backend/execution/providers/index.ts — TypeScript source
- backend/execution/providers/openai.ts — TypeScript source
- backend/execution/providers/poe.ts — TypeScript source
- backend/execution/repair.test.ts — TypeScript source
- backend/execution/repair.ts — TypeScript source
- backend/execution/setup.ts — TypeScript source
- backend/execution/spec/lessonSchema.test.ts — TypeScript source
- backend/execution/spec/lessonSchema.ts — TypeScript source
- backend/execution/stream.ts — TypeScript source
- backend/execution/teacher.routing.test.ts — TypeScript source
- backend/execution/teacher.test.ts — TypeScript source
- backend/execution/teacher.ts — TypeScript source
- backend/export/colab.test.ts — TypeScript source
- backend/export/colab.ts — TypeScript source
- backend/export/encore.service.ts — TypeScript source
- backend/export/notebook-attribution.test.ts — TypeScript source
- backend/export/notebook.test.ts — TypeScript source
- backend/export/notebook.ts — TypeScript source
- backend/frontend/dist/index.html — File
- backend/frontend/encore.service.ts — TypeScript source
- backend/frontend/health.ts — TypeScript source
- backend/package.json — Node package manifest
- backend/progress/db.ts — TypeScript source
- backend/progress/encore.service.ts — TypeScript source
- backend/progress/get.ts — TypeScript source
- backend/progress/health.ts — TypeScript source
- backend/progress/stats.ts — TypeScript source
- backend/progress/update.ts — TypeScript source
- backend/research-outputs/ALAIN_KIT_FUNCTION_CALLING_ANALYSIS.md — Markdown doc
- backend/research-outputs/bert-alain-kit-research/QUALITY_ASSESSMENT_REPORT.md — Markdown doc
- backend/research-outputs/bert-alain-kit-research/bert-research-1757812793653.json — JSON data/schema
- backend/research-outputs/bert-alain-kit-research/bert-research-1757813023109.json — JSON data/schema
- backend/research-outputs/function-calling-test-results-1757813093769.json — JSON data/schema
- backend/research-outputs/function-calling-test-results-1757813121011.json — JSON data/schema
- backend/research-outputs/function-calling-test-results-1757813148698.json — JSON data/schema
- backend/research-outputs/microsoft/DialoGPT-medium/enhanced-research-data.json — JSON data/schema
- backend/research-outputs/microsoft/DialoGPT-medium/enhanced-research-report.md — Markdown doc
- backend/research-outputs/openai/gpt-3.5-turbo/enhanced-research-data.json — JSON data/schema
- backend/research-outputs/openai/gpt-3.5-turbo/enhanced-research-report.md — Markdown doc
- backend/research-outputs/openai/gpt-oss-120b/enhanced-research-data.json — JSON data/schema
- backend/research-outputs/openai/gpt-oss-120b/enhanced-research-report.md — Markdown doc
- backend/research-outputs/openai/gpt-oss-20b/enhanced-research-data.json — JSON data/schema
- backend/research-outputs/openai/gpt-oss-20b/enhanced-research-report.md — Markdown doc
- backend/research/api.ts — TypeScript source
- backend/scripts/attribution-sweep.ts — TypeScript source
- backend/scripts/backfill-teacher-metadata.mjs — Node script
- backend/scripts/convert-beginner-lesson-to-notebook.ts — TypeScript source
- backend/scripts/demo-notebook-generation.ts — TypeScript source
- backend/scripts/run-alainkit-matrix.ts — TypeScript source
- backend/scripts/run-phase.ts — TypeScript source
- backend/scripts/test-beginner-lesson-local.ts — TypeScript source
- backend/scripts/test-research-gpt-oss-20b.ts — TypeScript source
- backend/storage/encore.service.ts — TypeScript source
- backend/storage/filesystem.ts — TypeScript source
- backend/storage/research-format.ts — TypeScript source
- backend/test-alain-phases.ts — TypeScript source
- backend/test-bert-research-alain-kit.ts — TypeScript source
- backend/test-bert-simple.ts — TypeScript source
- backend/test-function-calling-models.ts — TypeScript source
- backend/test-gpt-oss-120b.ts — TypeScript source
- backend/test-lm-studio-local.ts — TypeScript source
- backend/test-optimized-prompts.ts — TypeScript source
- backend/test-oss-function-calling.ts — TypeScript source
- backend/test-poe-connection.ts — TypeScript source
- backend/test-poe-direct.ts — TypeScript source
- backend/test-results-120b-lesson.json — JSON data/schema
- backend/test-results-120b-notebook.json — JSON data/schema
- backend/test-results-120b-research.json — JSON data/schema
- backend/test-teacher-model-comparison.ts — TypeScript source
- backend/tsconfig.json — TypeScript config
- backend/tsconfig.tsbuildinfo — TypeScript build info
- backend/tutorials/add_step.test.ts — TypeScript source
- backend/tutorials/add_step.ts — TypeScript source
- backend/tutorials/create.ts — TypeScript source
- backend/tutorials/db.ts — TypeScript source
- backend/tutorials/delete_step.test.ts — TypeScript source
- backend/tutorials/delete_step.ts — TypeScript source
- backend/tutorials/encore.service.ts — TypeScript source
- backend/tutorials/get.ts — TypeScript source
- backend/tutorials/get_step.ts — TypeScript source
- backend/tutorials/health.ts — TypeScript source
- backend/tutorials/import_lesson.ts — TypeScript source
- backend/tutorials/ingest.ts — TypeScript source
- backend/tutorials/list.ts — TypeScript source
- backend/tutorials/list_steps.ts — TypeScript source
- backend/tutorials/migrations/1_create_tables.up.sql — SQL
- backend/tutorials/migrations/2_add_model_maker.up.sql — SQL
- backend/tutorials/migrations/3_catalog.up.sql — SQL
- backend/tutorials/migrations/4_lessons_catalog.up.sql — SQL
- backend/tutorials/migrations/5_tutorial_versioning.up.sql — SQL
- backend/tutorials/progress.ts — TypeScript source
- backend/tutorials/publication.ts — TypeScript source
- backend/tutorials/reorder_steps.test.ts — TypeScript source
- backend/tutorials/reorder_steps.ts — TypeScript source
- backend/tutorials/seed.ts — TypeScript source
- backend/tutorials/update_step.test.ts — TypeScript source
- backend/tutorials/update_step.ts — TypeScript source
- backend/tutorials/validation.test.ts — TypeScript source
- backend/tutorials/validation.ts — TypeScript source
- backend/tutorials/versioning.ts — TypeScript source
- backend/utils/cors.ts — TypeScript source
- backend/utils/enhanced-research.ts — TypeScript source
- backend/utils/hf.test.ts — TypeScript source
- backend/utils/hf.ts — TypeScript source
- backend/utils/notebook-paths.ts — TypeScript source
- backend/utils/ratelimit.ts — TypeScript source
- backend/utils/research.ts — TypeScript source
- backend/vitest.config.ts — Vitest config
- backend/vitest.setup.ts — TypeScript source
- brand/ALAIN-Brand-Sheet-v1.0.md — Markdown doc
- brand/ALAIN-Brand-Style-Guide-v1.0.md — Markdown doc
- brand/alain-typography.css — File
- brand/examples/HeroHeader.tsx — React (TSX) component
- brand/tailwind.alain.config.snippet.js — JavaScript
- content/README.md — README
- content/lessons/poe/custom-content/2025-09-14/lesson_1757809449230_wbvj5ixus.json — JSON data/schema
- content/lessons/poe/custom-content/2025-09-14/lesson_1757809449230_wbvj5ixus.json.meta.json — JSON data/schema
- content/lessons/poe/custom-content/2025-09-14/lesson_1757809917552_8g8c2ywsb.json — JSON data/schema
- content/lessons/poe/custom-content/2025-09-14/lesson_1757809917552_8g8c2ywsb.json.meta.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757804021219_1tmdxkvwj.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757804021219_1tmdxkvwj.json.meta.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757805731541_nwtp21iia.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757805731541_nwtp21iia.json.meta.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757806682151_e50qyfsio.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757806682151_e50qyfsio.json.meta.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757807692296_d94xkqnqk.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757807692296_d94xkqnqk.json.meta.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809449373_au75ocupx.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809449373_au75ocupx.json.meta.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809917769_xaycwb6wr.json — JSON data/schema
- content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809917769_xaycwb6wr.json.meta.json — JSON data/schema
- content/notebooks/openai/gpt-oss-20b/getting-started-with-gpt-oss-20b.ipynb — Jupyter notebook
- content/notebooks/openai/gpt-oss-20b/gpt-oss-20b-quick-start-guide.ipynb — Jupyter notebook
- content/notebooks/openai/gpt-oss-20b/metadata.json — JSON data/schema
- content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809449234_gmwu4uikn.ipynb — Jupyter notebook
- content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809449234_gmwu4uikn.ipynb.meta.json — JSON data/schema
- content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809917554_29lh3vcua.ipynb — Jupyter notebook
- content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809917554_29lh3vcua.ipynb.meta.json — JSON data/schema
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757804021221_fem40q6ma.ipynb — Jupyter notebook
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757804021221_fem40q6ma.ipynb.meta.json — JSON data/schema
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757805731543_1xb6tju9r.ipynb — Jupyter notebook
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757805731543_1xb6tju9r.ipynb.meta.json — JSON data/schema
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757806682153_ie9wr234d.ipynb — Jupyter notebook
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757806682153_ie9wr234d.ipynb.meta.json — JSON data/schema
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757807692297_ymw31ispc.ipynb — Jupyter notebook
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757807692297_ymw31ispc.ipynb.meta.json — JSON data/schema
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809449375_3ph24h6ze.ipynb — Jupyter notebook
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809449375_3ph24h6ze.ipynb.meta.json — JSON data/schema
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809917771_tad92yezw.ipynb — Jupyter notebook
- content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809917771_tad92yezw.ipynb.meta.json — JSON data/schema
- content/research/openai/gpt-oss-20b/hf-files/README.md — README
- content/research/openai/gpt-oss-20b/hf-files/config.json — JSON data/schema
- content/research/openai/gpt-oss-20b/hf-files/generation_config.json — JSON data/schema
- content/research/openai/gpt-oss-20b/hf-files/model.safetensors.index.json — JSON data/schema
- content/research/openai/gpt-oss-20b/hf-files/original/config.json — JSON data/schema
- content/research/openai/gpt-oss-20b/hf-files/original/dtypes.json — JSON data/schema
- content/research/openai/gpt-oss-20b/hf-files/special_tokens_map.json — JSON data/schema
- content/research/openai/gpt-oss-20b/hf-files/tokenizer_config.json — JSON data/schema
- content/research/openai/gpt-oss-20b/huggingface-info.json — JSON data/schema
- content/research/openai/gpt-oss-20b/huggingface-info.md — Markdown doc
- content/research/openai/gpt-oss-20b/kaggle-content.md — Markdown doc
- content/research/openai/gpt-oss-20b/model-card.md — Markdown doc
- content/research/openai/gpt-oss-20b/openai-cookbook.json — JSON data/schema
- content/research/openai/gpt-oss-20b/openai-cookbook.md — Markdown doc
- content/research/openai/gpt-oss-20b/research-data.json — JSON data/schema
- content/research/openai/gpt-oss-20b/unsloth-content.json — JSON data/schema
- content/research/openai/gpt-oss-20b/unsloth-content.md — Markdown doc
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590368_jxdf9iryj.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590368_jxdf9iryj.json.meta.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590370_28dkdnm5n.ipynb — Jupyter notebook
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590370_28dkdnm5n.ipynb.meta.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629760_pczxk9jro.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629760_pczxk9jro.json.meta.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629761_mwroqx5af.ipynb — Jupyter notebook
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629761_mwroqx5af.ipynb.meta.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652150_hgf42wueu.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652150_hgf42wueu.json.meta.json — JSON data/schema
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652152_7x16iazq4.ipynb — Jupyter notebook
- data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652152_7x16iazq4.ipynb.meta.json — JSON data/schema
- docs/ACCURACY_CHECKLIST.md — Markdown doc
- docs/AI_MODEL_INFO_DISTRIBUTION_GUIDE.md — Markdown doc
- docs/NEW_UI_P0_NOTES.md — Markdown doc
- docs/NOTEBOOKS_AGGREGATOR.md — Markdown doc
- docs/README.md — README
- docs/REQUIREMENTS_UI_MVP.md — Markdown doc
- docs/SETUP_TOKENS.md — Markdown doc
- docs/TEACHER_RUNTIME_TOOLS.md — Markdown doc
- docs/ci-migration-notes.md — Markdown doc
- docs/debug/.gitkeep — File
- docs/debug/debug-response.txt — Text resource
- docs/demo-plan.md — Markdown doc
- docs/examples/README.md — README
- docs/examples/gpt-oss-20b_active_learning.ipynb — Jupyter notebook
- docs/gpt-oss/evaluation.md — Markdown doc
- docs/gpt-oss/fine-tuning.md — Markdown doc
- docs/gpt-oss/hf-to-active-learning-notebook.md — Markdown doc
- docs/gpt-oss/local-run-assembly.md — Markdown doc
- docs/gpt-oss/local-run.md — Markdown doc
- docs/gpt-oss/prompting.md — Markdown doc
- docs/gpt-oss/rag-recipes.md — Markdown doc
- docs/notebooks/colab-guide.md — Markdown doc
- docs/notebooks/data-privacy-and-secrets.md — Markdown doc
- docs/notebooks/jupyter-style-guide.md — Markdown doc
- docs/notebooks/notebook-best-practices.md — Markdown doc
- docs/notebooks/notebook-ci.md — Markdown doc
- docs/notebooks/notebook-inventory.json — JSON data/schema
- docs/notebooks/notebook-inventory.md — Markdown doc
- docs/notebooks/notebook-quality-checklist.md — Markdown doc
- docs/notebooks/observability-and-costs.md — Markdown doc
- docs/notebooks/reproducible-environments.md — Markdown doc
- docs/notebooks/snippets.md — Markdown doc
- docs/notebooks/testing-patterns.md — Markdown doc
- docs/notebooks/using-the-notebook-toolchain.md — Markdown doc
- docs/screenshots/README.md — README
- docs/templates/README.md — README
- docs/templates/gpt-oss_active_learning_template.ipynb — Jupyter notebook
- docs/templates/teaching_template.ipynb — Jupyter notebook
- env-config-example.txt — Text resource
- examples/README.md — README
- examples/poe/poe-openai-sdk-example.js — JavaScript
- examples/poe/poe-python-example.py — Python script
- examples/poe/test-poe-integration.js — JavaScript
- examples/poe/test-poe-models.js — JavaScript
- fix_notebook_kernel.py — Python script
- hackathon-notes/.gitkeep — File
- hackathon-notes/final-polish-todo.md — Markdown doc
- package-lock.json — npm lockfile
- package.json — Node package manifest
- prompts/alain-kit/HACKATHON_SUBMISSION.md — Markdown doc
- prompts/alain-kit/INDEX.md — Markdown doc
- prompts/alain-kit/PROMPT_EVALUATION_REPORT.md — Markdown doc
- prompts/alain-kit/README.md — README
- prompts/alain-kit/USER_GUIDE.md — Markdown doc
- prompts/alain-kit/VERSIONS.md — Markdown doc
- prompts/alain-kit/archive/develop/develop.harmony.backup.txt — Text resource
- prompts/alain-kit/archive/develop/develop.harmony.fixed.txt — Text resource
- prompts/alain-kit/archive/develop/develop.harmony.original.txt — Text resource
- prompts/alain-kit/archive/develop/develop.harmony.poe.txt — Text resource
- prompts/alain-kit/archive/develop/develop.harmony.simple.txt — Text resource
- prompts/alain-kit/cache.management.harmony.txt — Text resource
- prompts/alain-kit/design.harmony.txt — Text resource
- prompts/alain-kit/develop.harmony.txt — Text resource
- prompts/alain-kit/example-usage.js — JavaScript
- prompts/alain-kit/flattened/openai-compatible/design.online.v2025-09-13.txt — Text resource
- prompts/alain-kit/flattened/openai-compatible/develop.v2025-09-13.txt — Text resource
- prompts/alain-kit/flattened/openai-compatible/outline.online.v2025-09-14.txt — Text resource
- prompts/alain-kit/flattened/openai-compatible/research.online.v2025-09-13.txt — Text resource
- prompts/alain-kit/flattened/openai-compatible/section.online.v2025-09-14.txt — Text resource
- prompts/alain-kit/flattened/openai-compatible/validate.online.v2025-09-13.txt — Text resource
- prompts/alain-kit/flattened/poe/design.online.v2025-09-13.txt — Text resource
- prompts/alain-kit/flattened/poe/develop.v2025-09-13.txt — Text resource
- prompts/alain-kit/flattened/poe/outline.online.v2025-09-14.txt — Text resource
- prompts/alain-kit/flattened/poe/research.online.v2025-09-13.txt — Text resource
- prompts/alain-kit/flattened/poe/section.online.v2025-09-14.txt — Text resource
- prompts/alain-kit/flattened/poe/validate.online.v2025-09-13.txt — Text resource
- prompts/alain-kit/optimized/research.optimized.v1.txt — Text resource
- prompts/alain-kit/orchestrator.harmony.txt — Text resource
- prompts/alain-kit/orchestrator.offline.harmony.txt — Text resource
- prompts/alain-kit/outline-first/research.outline.v1.txt — Text resource
- prompts/alain-kit/research.harmony.txt — Text resource
- prompts/alain-kit/research.offline.harmony.txt — Text resource
- prompts/alain-kit/section-fill/research.section.v1.txt — Text resource
- prompts/alain-kit/util/gpt-oss_orchestration_notes.md — Markdown doc
- prompts/alain-kit/util/hf_extract.harmony.txt — Text resource
- prompts/alain-kit/util/json_repair.harmony.txt — Text resource
- prompts/alain-kit/validate.harmony.txt — Text resource
- pytest.ini — File
- requirements-dev.txt — Text resource
- requirements.txt — Text resource
- research-outputs/ALAIN_KIT_TEST_LOG_2025-09-13.md — Markdown doc
- research-outputs/EVALUATION_REPORT_2025-09-13.md — Markdown doc
- research-outputs/alain-kit-test-log.json — JSON data/schema
- research-outputs/chatgpt-experience-research/enhanced-research-data.json — JSON data/schema
- research-outputs/chatgpt-experience-research/enhanced-research-report.md — Markdown doc
- research-outputs/chatgpt-real-model-research/enhanced-research-data.json — JSON data/schema
- research-outputs/chatgpt-real-model-research/enhanced-research-report.md — Markdown doc
- research-outputs/corrected-gpt-oss-test-log.json — JSON data/schema
- research-outputs/enhanced-demo/enhanced-research-data.json — JSON data/schema
- research-outputs/enhanced-demo/enhanced-research-report.md — Markdown doc
- research-outputs/real-model-microsoft-CodeBERT-base/enhanced-research-data.json — JSON data/schema
- research-outputs/real-model-microsoft-CodeBERT-base/enhanced-research-report.md — Markdown doc
- research-outputs/real-model-microsoft-DialoGPT-medium/enhanced-research-data.json — JSON data/schema
- research-outputs/real-model-microsoft-DialoGPT-medium/enhanced-research-report.md — Markdown doc
- schemas/alain-lesson.schema.json — JSON data/schema
- scripts/dev_hosted.sh — Shell script
- scripts/dev_offline.sh — Shell script
- scripts/json_to_notebook.py — Python script
- scripts/notebook_linter.py — Python script
- scripts/notebook_review.py — Python script
- scripts/notebook_smoke.py — Python script
- scripts/smoke/hosted.sh — Shell script
- scripts/smoke/offline.sh — Shell script
- scripts/validate-lesson.js — JavaScript
- scripts/web_smoke_from_text.sh — Shell script
- test-alain-kit-simple.js — JavaScript
- test-mcq-prompts.ts — TypeScript source
- tests/notebooks_smoke/.gitkeep — File
- tests/notebooks_smoke/vitest — File
- tsconfig.json — TypeScript config
- vitest — File
- web/.gitignore — .gitignore
- web/README.md — README
- web/__tests__/api-parse.test.ts — TypeScript source
- web/__tests__/github-notebook.test.ts — TypeScript source
- web/__tests__/harmony.test.ts — TypeScript source
- web/__tests__/schemas.test.ts — TypeScript source
- web/app/admin/moderation/page.tsx — React (TSX) component
- web/app/admin/page.tsx — React (TSX) component
- web/app/api/adapt/route.ts — TypeScript source
- web/app/api/admin/moderation/[id]/approve/route.ts — TypeScript source
- web/app/api/admin/moderation/[id]/reject/route.ts — TypeScript source
- web/app/api/admin/notebooks/[id]/route.ts — TypeScript source
- web/app/api/admin/notebooks/upload/route.ts — TypeScript source
- web/app/api/admin/settings/github/route.ts — TypeScript source
- web/app/api/aggregator/index/route.ts — TypeScript source
- web/app/api/catalog/lessons/public/route.ts — TypeScript source
- web/app/api/catalog/lessons/publish/route.ts — TypeScript source
- web/app/api/catalog/notebooks/mine/route.ts — TypeScript source
- web/app/api/catalog/notebooks/public/route.ts — TypeScript source
- web/app/api/catalog/notebooks/publish/route.ts — TypeScript source
- web/app/api/content/index/route.ts — TypeScript source
- web/app/api/content/research/route.ts — TypeScript source
- web/app/api/exec/route.ts — TypeScript source
- web/app/api/execute/route.ts — TypeScript source
- web/app/api/export/colab/local/[id]/route.ts — TypeScript source
- web/app/api/files/download/route.ts — TypeScript source
- web/app/api/generate-from-text/route.ts — TypeScript source
- web/app/api/generate-lesson/route.ts — TypeScript source
- web/app/api/generate-local/route.ts — TypeScript source
- web/app/api/health/route.ts — TypeScript source
- web/app/api/hf/model/route.ts — TypeScript source
- web/app/api/library/pointer/route.ts — TypeScript source
- web/app/api/lmstudio/download/route.ts — TypeScript source
- web/app/api/lmstudio/options/[id]/route.ts — TypeScript source
- web/app/api/lmstudio/search/route.ts — TypeScript source
- web/app/api/notebooks/[id]/export/alain/route.ts — TypeScript source
- web/app/api/notebooks/[id]/publish-request/route.ts — TypeScript source
- web/app/api/notebooks/[id]/remix/route.ts — TypeScript source
- web/app/api/notebooks/[id]/route.ts — TypeScript source
- web/app/api/notebooks/featured/route.ts — TypeScript source
- web/app/api/notebooks/grade/route.ts — TypeScript source
- web/app/api/notebooks/ingest/route.ts — TypeScript source
- web/app/api/notebooks/remix/route.ts — TypeScript source
- web/app/api/notebooks/route.ts — TypeScript source
- web/app/api/notebooks/upload/route.ts — TypeScript source
- web/app/api/phases/route.ts — TypeScript source
- web/app/api/providers/models/route.ts — TypeScript source
- web/app/api/providers/ollama/show/route.ts — TypeScript source
- web/app/api/providers/ollama/tags/route.ts — TypeScript source
- web/app/api/providers/route.ts — TypeScript source
- web/app/api/providers/smoke/route.ts — TypeScript source
- web/app/api/repair-lesson/route.ts — TypeScript source
- web/app/api/research/route.ts — TypeScript source
- web/app/api/setup/route.ts — TypeScript source
- web/app/api/tutorials/[id]/progress/route.ts — TypeScript source
- web/app/api/tutorials/[id]/publish/route.ts — TypeScript source
- web/app/api/tutorials/[id]/route.ts — TypeScript source
- web/app/api/tutorials/local/[id]/route.ts — TypeScript source
- web/app/api/tutorials/public/route.ts — TypeScript source
- web/app/blueprint/page.tsx — React (TSX) component
- web/app/explore/lessons/page.tsx — React (TSX) component
- web/app/explore/notebooks/page.tsx — React (TSX) component
- web/app/generate/page.tsx — React (TSX) component
- web/app/globals.css — File
- web/app/hackathon-notes/generate/page.tsx — React (TSX) component
- web/app/hackathon-notes/settings/page.tsx — React (TSX) component
- web/app/hackathon-notes/tutorials/page.tsx — React (TSX) component
- web/app/health/page.tsx — React (TSX) component
- web/app/home/page.tsx — React (TSX) component
- web/app/layout.tsx — React (TSX) component
- web/app/lmstudio/page.tsx — React (TSX) component
- web/app/my/notebooks/page.tsx — React (TSX) component
- web/app/notebooks/[id]/edit/page.tsx — React (TSX) component
- web/app/notebooks/[id]/page.tsx — React (TSX) component
- web/app/notebooks/featured/page.tsx — React (TSX) component
- web/app/notebooks/page.tsx — React (TSX) component
- web/app/onboarding/page.tsx — React (TSX) component
- web/app/page.tsx — React (TSX) component
- web/app/phases/page.tsx — React (TSX) component
- web/app/research/page.tsx — React (TSX) component
- web/app/stream/page.tsx — React (TSX) component
- web/app/tutorials/[id]/page.tsx — React (TSX) component
- web/app/upload/page.tsx — React (TSX) component
- web/app/v1/generate/page.tsx — React (TSX) component
- web/components/Accordion.tsx — React (TSX) component
- web/components/BrandLogo.tsx — React (TSX) component
- web/components/Button.tsx — React (TSX) component
- web/components/Card.tsx — React (TSX) component
- web/components/CardGrid.tsx — React (TSX) component
- web/components/CodeEditor.tsx — React (TSX) component
- web/components/CopyButton.tsx — React (TSX) component
- web/components/EnvStatusBadge.tsx — React (TSX) component
- web/components/Footer.tsx — React (TSX) component
- web/components/GitHubOpenForm.tsx — React (TSX) component
- web/components/Hero.tsx — React (TSX) component
- web/components/JSRunner.ts — TypeScript source
- web/components/LocalRuntimeStatus.tsx — React (TSX) component
- web/components/LocalSetupHelper.tsx — React (TSX) component
- web/components/MarkCompleteButton.tsx — React (TSX) component
- web/components/MarkdownEditor.tsx — React (TSX) component
- web/components/MobileNav.tsx — React (TSX) component
- web/components/NavBar.tsx — React (TSX) component
- web/components/NotebookActions.tsx — React (TSX) component
- web/components/NotebookViewer.tsx — React (TSX) component
- web/components/OfflineBadge.tsx — React (TSX) component
- web/components/PreviewPanel.tsx — React (TSX) component
- web/components/PromptCell.tsx — React (TSX) component
- web/components/PyRunner.tsx — React (TSX) component
- web/components/StepNav.tsx — React (TSX) component
- web/components/StreamingOutput.tsx — React (TSX) component
- web/components/Toast.tsx — React (TSX) component
- web/components/TryPrompt.tsx — React (TSX) component
- web/data/featured-notebooks.json — JSON data/schema
- web/data/notebooks-index.json — JSON data/schema
- web/docs/ACCESSIBILITY-CHECKLIST.md — Markdown doc
- web/docs/BRAND_TOKENS.md — Markdown doc
- web/docs/DEVELOPER_GUIDE.md — Markdown doc
- web/docs/MIGRATION-NOTE.md — Markdown doc
- web/docs/OPERATIONS.md — Markdown doc
- web/docs/REFRESH-CLEANUP.md — Markdown doc
- web/docs/RUNBOOK.md — Markdown doc
- web/docs/clerk-account-portal-colors.md — Markdown doc
- web/e2e/generate.spec.ts — TypeScript source
- web/e2e/home.spec.ts — TypeScript source
- web/features/generate/GeneratePage.tsx — React (TSX) component
- web/features/onboarding-settings/OnboardingGate.tsx — React (TSX) component
- web/features/onboarding-settings/OnboardingStep.tsx — React (TSX) component
- web/features/onboarding-settings/OnboardingWizard.tsx — React (TSX) component
- web/features/onboarding-settings/README_OnboardingSettings.md — Markdown doc
- web/features/onboarding-settings/ResetOnboardingDialog.tsx — React (TSX) component
- web/features/onboarding-settings/SettingsPage.tsx — React (TSX) component
- web/features/onboarding-settings/__tests__/useOnboarding.test.ts — TypeScript source
- web/features/onboarding-settings/types.ts — TypeScript source
- web/features/onboarding-settings/useOnboarding.ts — TypeScript source
- web/features/onboarding-settings/useSettings.ts — TypeScript source
- web/features/research/ResearchPage.tsx — React (TSX) component
- web/lib/admin.ts — TypeScript source
- web/lib/api.ts — TypeScript source
- web/lib/auth.ts — TypeScript source
- web/lib/backend.ts — TypeScript source
- web/lib/github.ts — TypeScript source
- web/lib/githubRaw.ts — TypeScript source
- web/lib/harmony.ts — TypeScript source
- web/lib/kv.ts — TypeScript source
- web/lib/localTutorialStore.ts — TypeScript source
- web/lib/notebookExport.ts — TypeScript source
- web/lib/notebookStore.ts — TypeScript source
- web/lib/providers/aliases.ts — TypeScript source
- web/lib/providers/index.ts — TypeScript source
- web/lib/providers/openai.ts — TypeScript source
- web/lib/providers/poe.ts — TypeScript source
- web/lib/schemas.ts — TypeScript source
- web/lib/types.ts — TypeScript source
- web/middleware.ts — TypeScript source
- web/next-env.d.ts — TypeScript source
- web/package-lock.json — npm lockfile
- web/package.json — Node package manifest
- web/playwright.config.ts — Playwright config
- web/postcss.config.js — JavaScript
- web/public/brand/ALAIN_logo_primary_blue-bg.svg — Image asset
- web/public/brand/ALAIN_logo_primary_yellow-bg.svg — Image asset
- web/scripts/vercel_should_build.sh — Shell script
- web/tailwind.config.ts — TypeScript source
- web/tsconfig.json — TypeScript config
- web/types/monaco.d.ts — TypeScript source
- web/vercel.json — Vercel config
- web/vitest — File
- web/vitest.config.ts — Vitest config
