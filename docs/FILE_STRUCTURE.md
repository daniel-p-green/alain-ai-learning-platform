# ALAIN AI Learning Platform — File Structure

Generated: 2025-09-16T02:32:16Z (UTC)
Scope: lists all git-tracked files and directories under 'alain-ai-learning-platform'. Excludes untracked dependencies and build artifacts (e.g., node_modules, .next).

## Directory Tree (git-tracked)

```text
alain-ai-learning-platform/
├── .github/
│   └── workflows/
├── __pycache__/
├── alain-ai-learning-platform/
│   └── hackathon-notes/
├── apps/
│   ├── backend/
│   │   ├── assessments/
│   │   ├── catalog/
│   │   ├── config/
│   │   ├── content/
│   │   │   └── research/
│   │   │       └── openai/
│   │   │           ├── gpt-oss-120b/
│   │   │           └── gpt-oss-20b/
│   │   ├── execution/
│   │   │   ├── prompts/
│   │   │   ├── providers/
│   │   │   └── spec/
│   │   ├── export/
│   │   ├── frontend/
│   │   │   └── dist/
│   │   ├── progress/
│   │   ├── research/
│   │   ├── research-outputs/
│   │   │   ├── bert-alain-kit-research/
│   │   │   ├── microsoft/
│   │   │   │   └── DialoGPT-medium/
│   │   │   └── openai/
│   │   │       ├── gpt-3.5-turbo/
│   │   │       ├── gpt-oss-120b/
│   │   │       └── gpt-oss-20b/
│   │   ├── scripts/
│   │   ├── storage/
│   │   ├── tutorials/
│   │   │   └── migrations/
│   │   ├── utils/
│   │   └── validation/
│   └── web/
│       ├── __tests__/
│       ├── app/
│       │   ├── admin/
│       │   │   └── moderation/
│       │   ├── api/
│       │   │   ├── adapt/
│       │   │   ├── admin/
│       │   │   │   ├── moderation/
│       │   │   │   │   └── [id]/
│       │   │   │   │       ├── approve/
│       │   │   │   │       └── reject/
│       │   │   │   ├── notebooks/
│       │   │   │   │   ├── [id]/
│       │   │   │   │   └── upload/
│       │   │   │   └── settings/
│       │   │   │       └── github/
│       │   │   ├── aggregator/
│       │   │   │   └── index/
│       │   │   ├── assessments/
│       │   │   │   └── validate/
│       │   │   ├── catalog/
│       │   │   │   ├── lessons/
│       │   │   │   │   ├── public/
│       │   │   │   │   └── publish/
│       │   │   │   └── notebooks/
│       │   │   │       ├── mine/
│       │   │   │       ├── public/
│       │   │   │       └── publish/
│       │   │   ├── content/
│       │   │   │   ├── index/
│       │   │   │   └── research/
│       │   │   ├── exec/
│       │   │   ├── execute/
│       │   │   ├── export/
│       │   │   │   └── colab/
│       │   │   │       └── local/
│       │   │   │           └── [id]/
│       │   │   ├── files/
│       │   │   │   └── download/
│       │   │   ├── generate/
│       │   │   │   └── bundle/
│       │   │   ├── generate-from-text/
│       │   │   ├── generate-lesson/
│       │   │   ├── generate-local/
│       │   │   ├── health/
│       │   │   │   └── web/
│       │   │   ├── hf/
│       │   │   │   └── model/
│       │   │   ├── library/
│       │   │   │   └── pointer/
│       │   │   ├── lmstudio/
│       │   │   │   ├── download/
│       │   │   │   ├── options/
│       │   │   │   │   └── [id]/
│       │   │   │   └── search/
│       │   │   ├── notebooks/
│       │   │   │   ├── [id]/
│       │   │   │   │   ├── export/
│       │   │   │   │   │   └── alain/
│       │   │   │   │   ├── publish-request/
│       │   │   │   │   └── remix/
│       │   │   │   ├── featured/
│       │   │   │   ├── grade/
│       │   │   │   ├── ingest/
│       │   │   │   ├── remix/
│       │   │   │   │   └── alain/
│       │   │   │   └── upload/
│       │   │   ├── phases/
│       │   │   ├── providers/
│       │   │   │   ├── models/
│       │   │   │   ├── ollama/
│       │   │   │   │   ├── show/
│       │   │   │   │   └── tags/
│       │   │   │   └── smoke/
│       │   │   ├── repair-lesson/
│       │   │   ├── research/
│       │   │   ├── setup/
│       │   │   └── tutorials/
│       │   │       ├── [id]/
│       │   │       │   ├── assessments/
│       │   │       │   ├── progress/
│       │   │       │   └── publish/
│       │   │       ├── local/
│       │   │       │   └── [id]/
│       │   │       └── public/
│       │   ├── generate/
│       │   │   └── outline-first/
│       │   ├── health/
│       │   ├── lessons/
│       │   ├── lmstudio/
│       │   ├── my/
│       │   │   └── notebooks/
│       │   ├── notebooks/
│       │   │   ├── [id]/
│       │   │   │   └── edit/
│       │   │   └── featured/
│       │   ├── onboarding/
│       │   ├── research/
│       │   ├── stream/
│       │   └── tutorials/
│       │       └── [id]/
│       ├── components/
│       ├── data/
│       ├── docs/
│       ├── e2e/
│       ├── features/
│       │   ├── generate/
│       │   ├── onboarding-settings/
│       │   │   └── __tests__/
│       │   └── research/
│       ├── lib/
│       │   └── providers/
│       ├── public/
│       │   ├── brand/
│       │   └── og/
│       ├── scripts/
│       └── types/
├── docs/
│   ├── debug/
│   ├── examples/
│   ├── gpt-oss/
│   ├── notebooks/
│   ├── screenshots/
│   └── templates/
├── notes/
│   └── hackathon/
├── packages/
│   ├── alain-kit/
│   │   ├── core/
│   │   ├── examples/
│   │   └── validation/
│   └── alain-kit-sdk/
│       ├── bin/
│       └── examples/
├── resources/
│   ├── brand/
│   │   └── examples/
│   ├── content/
│   │   ├── lessons/
│   │   │   └── poe/
│   │   │       ├── custom-content/
│   │   │       │   └── 2025-09-14/
│   │   │       └── gpt-oss-20b/
│   │   │           ├── 2025-09-13/
│   │   │           └── 2025-09-14/
│   │   ├── notebooks/
│   │   │   ├── openai/
│   │   │   │   └── gpt-oss-20b/
│   │   │   └── poe/
│   │   │       ├── custom-content/
│   │   │       │   └── beginner/
│   │   │       │       └── 2025-09-14/
│   │   │       └── gpt-oss-20b/
│   │   │           └── beginner/
│   │   │               ├── 2025-09-13/
│   │   │               └── 2025-09-14/
│   │   └── research/
│   │       └── openai/
│   │           └── gpt-oss-20b/
│   │               └── hf-files/
│   │                   └── original/
│   ├── data/
│   │   └── notebooks/
│   │       └── gpt-oss-20b/
│   │           └── beginner/
│   │               └── 2025-09-13/
│   ├── examples/
│   │   └── poe/
│   │       └── __pycache__/
│   ├── prompts/
│   │   └── alain-kit/
│   │       ├── archive/
│   │       │   └── develop/
│   │       ├── flattened/
│   │       │   ├── openai-compatible/
│   │       │   └── poe/
│   │       ├── optimized/
│   │       ├── outline-first/
│   │       ├── section-fill/
│   │       └── util/
│   ├── research-outputs/
│   │   ├── chatgpt-experience-research/
│   │   ├── chatgpt-real-model-research/
│   │   ├── enhanced-demo/
│   │   ├── real-model-microsoft-CodeBERT-base/
│   │   └── real-model-microsoft-DialoGPT-medium/
│   └── schemas/
├── scripts/
│   ├── __pycache__/
│   └── smoke/
└── tests/
    └── notebooks_smoke/
```

## Basic Directory Overview
Top-level and nested directories (git-tracked):

- .
- .github/workflows
- __pycache__
- alain-ai-learning-platform/hackathon-notes
- apps/backend
- apps/backend/assessments
- apps/backend/catalog
- apps/backend/config
- apps/backend/content/research/openai/gpt-oss-120b
- apps/backend/content/research/openai/gpt-oss-20b
- apps/backend/execution
- apps/backend/execution/prompts
- apps/backend/execution/providers
- apps/backend/execution/spec
- apps/backend/export
- apps/backend/frontend
- apps/backend/frontend/dist
- apps/backend/progress
- apps/backend/research
- apps/backend/research-outputs
- apps/backend/research-outputs/bert-alain-kit-research
- apps/backend/research-outputs/microsoft/DialoGPT-medium
- apps/backend/research-outputs/openai/gpt-3.5-turbo
- apps/backend/research-outputs/openai/gpt-oss-120b
- apps/backend/research-outputs/openai/gpt-oss-20b
- apps/backend/scripts
- apps/backend/storage
- apps/backend/tutorials
- apps/backend/tutorials/migrations
- apps/backend/utils
- apps/backend/validation
- apps/web
- apps/web/__tests__
- apps/web/app
- apps/web/app/admin
- apps/web/app/admin/moderation
- apps/web/app/api/adapt
- apps/web/app/api/admin/moderation/[id]/approve
- apps/web/app/api/admin/moderation/[id]/reject
- apps/web/app/api/admin/notebooks/[id]
- apps/web/app/api/admin/notebooks/upload
- apps/web/app/api/admin/settings/github
- apps/web/app/api/aggregator/index
- apps/web/app/api/assessments/validate
- apps/web/app/api/catalog/lessons/public
- apps/web/app/api/catalog/lessons/publish
- apps/web/app/api/catalog/notebooks/mine
- apps/web/app/api/catalog/notebooks/public
- apps/web/app/api/catalog/notebooks/publish
- apps/web/app/api/content/index
- apps/web/app/api/content/research
- apps/web/app/api/exec
- apps/web/app/api/execute
- apps/web/app/api/export/colab/local/[id]
- apps/web/app/api/files/download
- apps/web/app/api/generate-from-text
- apps/web/app/api/generate-lesson
- apps/web/app/api/generate-local
- apps/web/app/api/generate/bundle
- apps/web/app/api/health
- apps/web/app/api/health/web
- apps/web/app/api/hf/model
- apps/web/app/api/library/pointer
- apps/web/app/api/lmstudio/download
- apps/web/app/api/lmstudio/options/[id]
- apps/web/app/api/lmstudio/search
- apps/web/app/api/notebooks
- apps/web/app/api/notebooks/[id]
- apps/web/app/api/notebooks/[id]/export/alain
- apps/web/app/api/notebooks/[id]/publish-request
- apps/web/app/api/notebooks/[id]/remix
- apps/web/app/api/notebooks/featured
- apps/web/app/api/notebooks/grade
- apps/web/app/api/notebooks/ingest
- apps/web/app/api/notebooks/remix
- apps/web/app/api/notebooks/remix/alain
- apps/web/app/api/notebooks/upload
- apps/web/app/api/phases
- apps/web/app/api/providers
- apps/web/app/api/providers/models
- apps/web/app/api/providers/ollama/show
- apps/web/app/api/providers/ollama/tags
- apps/web/app/api/providers/smoke
- apps/web/app/api/repair-lesson
- apps/web/app/api/research
- apps/web/app/api/setup
- apps/web/app/api/tutorials/[id]
- apps/web/app/api/tutorials/[id]/assessments
- apps/web/app/api/tutorials/[id]/progress
- apps/web/app/api/tutorials/[id]/publish
- apps/web/app/api/tutorials/local/[id]
- apps/web/app/api/tutorials/public
- apps/web/app/generate
- apps/web/app/generate/outline-first
- apps/web/app/health
- apps/web/app/lessons
- apps/web/app/lmstudio
- apps/web/app/my/notebooks
- apps/web/app/notebooks
- apps/web/app/notebooks/[id]
- apps/web/app/notebooks/[id]/edit
- apps/web/app/notebooks/featured
- apps/web/app/onboarding
- apps/web/app/research
- apps/web/app/stream
- apps/web/app/tutorials/[id]
- apps/web/components
- apps/web/data
- apps/web/docs
- apps/web/e2e
- apps/web/features/generate
- apps/web/features/onboarding-settings
- apps/web/features/onboarding-settings/__tests__
- apps/web/features/research
- apps/web/lib
- apps/web/lib/providers
- apps/web/public
- apps/web/public/brand
- apps/web/public/og
- apps/web/scripts
- apps/web/types
- docs
- docs/debug
- docs/examples
- docs/gpt-oss
- docs/notebooks
- docs/screenshots
- docs/templates
- notes/hackathon
- packages/alain-kit
- packages/alain-kit-sdk
- packages/alain-kit-sdk/bin
- packages/alain-kit-sdk/examples
- packages/alain-kit/core
- packages/alain-kit/examples
- packages/alain-kit/validation
- resources/brand
- resources/brand/examples
- resources/content
- resources/content/lessons/poe/custom-content/2025-09-14
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13
- resources/content/lessons/poe/gpt-oss-20b/2025-09-14
- resources/content/notebooks
- resources/content/notebooks/openai/gpt-oss-20b
- resources/content/notebooks/poe/custom-content/beginner/2025-09-14
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14
- resources/content/research/openai/gpt-oss-20b
- resources/content/research/openai/gpt-oss-20b/hf-files
- resources/content/research/openai/gpt-oss-20b/hf-files/original
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13
- resources/examples
- resources/examples/poe
- resources/examples/poe/__pycache__
- resources/prompts/alain-kit
- resources/prompts/alain-kit/archive/develop
- resources/prompts/alain-kit/flattened/openai-compatible
- resources/prompts/alain-kit/flattened/poe
- resources/prompts/alain-kit/optimized
- resources/prompts/alain-kit/outline-first
- resources/prompts/alain-kit/section-fill
- resources/prompts/alain-kit/util
- resources/research-outputs
- resources/research-outputs/chatgpt-experience-research
- resources/research-outputs/chatgpt-real-model-research
- resources/research-outputs/enhanced-demo
- resources/research-outputs/real-model-microsoft-CodeBERT-base
- resources/research-outputs/real-model-microsoft-DialoGPT-medium
- resources/schemas
- scripts
- scripts/__pycache__
- scripts/smoke
- tests/notebooks_smoke

## Detailed File Listing (with brief descriptions)
Each entry is a file path relative to the repository root, annotated with a brief type description.

- .encoreignore — File
- .github/workflows/ci.yml — YAML config
- .github/workflows/web-tests.yml — YAML config
- .gitignore — .gitignore
- .pre-commit-config.yaml — YAML config
- ENHANCED_RESEARCH_INTEGRATION_GUIDE.md — Markdown doc
- LICENSE — License
- README.md — README
- TESTING_INSTRUCTIONS.md — Markdown doc
- __pycache__/fix_notebook_kernel.cpython-313.pyc — File
- alain-ai-learning-platform/hackathon-notes/alain-file-structure.md — Markdown doc
- apps/backend/.encoreignore — File
- apps/backend/.gitignore — .gitignore
- apps/backend/TESTING.md — Markdown doc
- apps/backend/alain-kit-research.ts — TypeScript source
- apps/backend/assessments/api.ts — TypeScript source
- apps/backend/assessments/encore.service.ts — TypeScript source
- apps/backend/assessments/logic.test.ts — TypeScript source
- apps/backend/assessments/logic.ts — TypeScript source
- apps/backend/auth.ts — TypeScript source
- apps/backend/catalog/api.ts — TypeScript source
- apps/backend/catalog/store.ts — TypeScript source
- apps/backend/config/env.ts — TypeScript source
- apps/backend/content/research/openai/gpt-oss-120b/huggingface-info.md — Markdown doc
- apps/backend/content/research/openai/gpt-oss-120b/model-card.md — Markdown doc
- apps/backend/content/research/openai/gpt-oss-120b/openai-cookbook.md — Markdown doc
- apps/backend/content/research/openai/gpt-oss-120b/research-data.json — JSON data/schema
- apps/backend/content/research/openai/gpt-oss-120b/unsloth-content.md — Markdown doc
- apps/backend/content/research/openai/gpt-oss-20b/huggingface-info.md — Markdown doc
- apps/backend/content/research/openai/gpt-oss-20b/model-card.md — Markdown doc
- apps/backend/content/research/openai/gpt-oss-20b/openai-cookbook.md — Markdown doc
- apps/backend/content/research/openai/gpt-oss-20b/research-data.json — JSON data/schema
- apps/backend/content/research/openai/gpt-oss-20b/unsloth-content.md — Markdown doc
- apps/backend/convert-to-notebook.ts — TypeScript source
- apps/backend/demo-gpt-oss-20b-tutorial.ipynb — Jupyter notebook
- apps/backend/encore.app — File
- apps/backend/execution/adapt.test.ts — TypeScript source
- apps/backend/execution/adapt.ts — TypeScript source
- apps/backend/execution/capabilities.ts — TypeScript source
- apps/backend/execution/encore.service.ts — TypeScript source
- apps/backend/execution/execute.ts — TypeScript source
- apps/backend/execution/generate_import.integration.test.ts — TypeScript source
- apps/backend/execution/health.ts — TypeScript source
- apps/backend/execution/lesson-generator.test.ts — TypeScript source
- apps/backend/execution/lesson-generator.ts — TypeScript source
- apps/backend/execution/lmstudio_repo.ts — TypeScript source
- apps/backend/execution/metrics.ts — TypeScript source
- apps/backend/execution/models.test.ts — TypeScript source
- apps/backend/execution/models.ts — TypeScript source
- apps/backend/execution/parse-model.ts — TypeScript source
- apps/backend/execution/poe-nodejs.ts — TypeScript source
- apps/backend/execution/prompts/loader.test.ts — TypeScript source
- apps/backend/execution/prompts/loader.ts — TypeScript source
- apps/backend/execution/providers/aliases.test.ts — TypeScript source
- apps/backend/execution/providers/aliases.ts — TypeScript source
- apps/backend/execution/providers/base.ts — TypeScript source
- apps/backend/execution/providers/index.ts — TypeScript source
- apps/backend/execution/providers/openai.ts — TypeScript source
- apps/backend/execution/providers/poe.ts — TypeScript source
- apps/backend/execution/repair.test.ts — TypeScript source
- apps/backend/execution/repair.ts — TypeScript source
- apps/backend/execution/setup.ts — TypeScript source
- apps/backend/execution/spec/lessonSchema.test.ts — TypeScript source
- apps/backend/execution/spec/lessonSchema.ts — TypeScript source
- apps/backend/execution/stream.ts — TypeScript source
- apps/backend/execution/teacher.routing.test.ts — TypeScript source
- apps/backend/execution/teacher.test.ts — TypeScript source
- apps/backend/execution/teacher.ts — TypeScript source
- apps/backend/export/colab.test.ts — TypeScript source
- apps/backend/export/colab.ts — TypeScript source
- apps/backend/export/encore.service.ts — TypeScript source
- apps/backend/export/notebook-attribution.test.ts — TypeScript source
- apps/backend/export/notebook.test.ts — TypeScript source
- apps/backend/export/notebook.ts — TypeScript source
- apps/backend/frontend/dist/index.html — File
- apps/backend/frontend/encore.service.ts — TypeScript source
- apps/backend/frontend/health.ts — TypeScript source
- apps/backend/package.json — Node package manifest
- apps/backend/progress/db.ts — TypeScript source
- apps/backend/progress/encore.service.ts — TypeScript source
- apps/backend/progress/get.ts — TypeScript source
- apps/backend/progress/health.ts — TypeScript source
- apps/backend/progress/stats.ts — TypeScript source
- apps/backend/progress/update.ts — TypeScript source
- apps/backend/research-outputs/ALAIN_KIT_FUNCTION_CALLING_ANALYSIS.md — Markdown doc
- apps/backend/research-outputs/bert-alain-kit-research/QUALITY_ASSESSMENT_REPORT.md — Markdown doc
- apps/backend/research-outputs/bert-alain-kit-research/bert-research-1757812793653.json — JSON data/schema
- apps/backend/research-outputs/bert-alain-kit-research/bert-research-1757813023109.json — JSON data/schema
- apps/backend/research-outputs/function-calling-test-results-1757813093769.json — JSON data/schema
- apps/backend/research-outputs/function-calling-test-results-1757813121011.json — JSON data/schema
- apps/backend/research-outputs/function-calling-test-results-1757813148698.json — JSON data/schema
- apps/backend/research-outputs/microsoft/DialoGPT-medium/enhanced-research-data.json — JSON data/schema
- apps/backend/research-outputs/microsoft/DialoGPT-medium/enhanced-research-report.md — Markdown doc
- apps/backend/research-outputs/openai/gpt-3.5-turbo/enhanced-research-data.json — JSON data/schema
- apps/backend/research-outputs/openai/gpt-3.5-turbo/enhanced-research-report.md — Markdown doc
- apps/backend/research-outputs/openai/gpt-oss-120b/enhanced-research-data.json — JSON data/schema
- apps/backend/research-outputs/openai/gpt-oss-120b/enhanced-research-report.md — Markdown doc
- apps/backend/research-outputs/openai/gpt-oss-20b/enhanced-research-data.json — JSON data/schema
- apps/backend/research-outputs/openai/gpt-oss-20b/enhanced-research-report.md — Markdown doc
- apps/backend/research/api.ts — TypeScript source
- apps/backend/scripts/attribution-sweep.ts — TypeScript source
- apps/backend/scripts/backfill-teacher-metadata.mjs — Node script
- apps/backend/scripts/convert-beginner-lesson-to-notebook.ts — TypeScript source
- apps/backend/scripts/demo-notebook-generation.ts — TypeScript source
- apps/backend/scripts/run-alainkit-matrix.ts — TypeScript source
- apps/backend/scripts/run-phase.ts — TypeScript source
- apps/backend/scripts/test-beginner-lesson-local.ts — TypeScript source
- apps/backend/scripts/test-research-gpt-oss-20b.ts — TypeScript source
- apps/backend/storage/encore.service.ts — TypeScript source
- apps/backend/storage/filesystem.ts — TypeScript source
- apps/backend/storage/research-format.ts — TypeScript source
- apps/backend/test-alain-phases.ts — TypeScript source
- apps/backend/test-bert-research-alain-kit.ts — TypeScript source
- apps/backend/test-bert-simple.ts — TypeScript source
- apps/backend/test-function-calling-models.ts — TypeScript source
- apps/backend/test-gpt-oss-120b.ts — TypeScript source
- apps/backend/test-lm-studio-local.ts — TypeScript source
- apps/backend/test-optimized-prompts.ts — TypeScript source
- apps/backend/test-oss-function-calling.ts — TypeScript source
- apps/backend/test-poe-connection.ts — TypeScript source
- apps/backend/test-poe-direct.ts — TypeScript source
- apps/backend/test-results-120b-lesson.json — JSON data/schema
- apps/backend/test-results-120b-notebook.json — JSON data/schema
- apps/backend/test-results-120b-research.json — JSON data/schema
- apps/backend/test-teacher-model-comparison.ts — TypeScript source
- apps/backend/tsconfig.json — TypeScript config
- apps/backend/tutorials/add_step.test.ts — TypeScript source
- apps/backend/tutorials/add_step.ts — TypeScript source
- apps/backend/tutorials/create.ts — TypeScript source
- apps/backend/tutorials/db.ts — TypeScript source
- apps/backend/tutorials/delete_step.test.ts — TypeScript source
- apps/backend/tutorials/delete_step.ts — TypeScript source
- apps/backend/tutorials/encore.service.ts — TypeScript source
- apps/backend/tutorials/get.ts — TypeScript source
- apps/backend/tutorials/get_step.ts — TypeScript source
- apps/backend/tutorials/health.ts — TypeScript source
- apps/backend/tutorials/import_lesson.ts — TypeScript source
- apps/backend/tutorials/ingest.ts — TypeScript source
- apps/backend/tutorials/list.ts — TypeScript source
- apps/backend/tutorials/list_steps.ts — TypeScript source
- apps/backend/tutorials/migrations/1_create_tables.up.sql — SQL
- apps/backend/tutorials/migrations/2_add_model_maker.up.sql — SQL
- apps/backend/tutorials/migrations/3_catalog.up.sql — SQL
- apps/backend/tutorials/migrations/4_lessons_catalog.up.sql — SQL
- apps/backend/tutorials/migrations/5_tutorial_versioning.up.sql — SQL
- apps/backend/tutorials/migrations/6_catalog_indexes.up.sql — SQL
- apps/backend/tutorials/progress.ts — TypeScript source
- apps/backend/tutorials/publication.ts — TypeScript source
- apps/backend/tutorials/reorder_steps.test.ts — TypeScript source
- apps/backend/tutorials/reorder_steps.ts — TypeScript source
- apps/backend/tutorials/seed.ts — TypeScript source
- apps/backend/tutorials/update_step.test.ts — TypeScript source
- apps/backend/tutorials/update_step.ts — TypeScript source
- apps/backend/tutorials/validation.test.ts — TypeScript source
- apps/backend/tutorials/validation.ts — TypeScript source
- apps/backend/tutorials/versioning.ts — TypeScript source
- apps/backend/utils/cors.ts — TypeScript source
- apps/backend/utils/enhanced-research.ts — TypeScript source
- apps/backend/utils/hf.test.ts — TypeScript source
- apps/backend/utils/hf.ts — TypeScript source
- apps/backend/utils/init-observability.ts — TypeScript source
- apps/backend/utils/notebook-paths.ts — TypeScript source
- apps/backend/utils/observability.ts — TypeScript source
- apps/backend/utils/ratelimit.ts — TypeScript source
- apps/backend/utils/research.ts — TypeScript source
- apps/backend/validation/colab-validator.test.ts — TypeScript source
- apps/backend/vitest.config.ts — Vitest config
- apps/backend/vitest.setup.ts — TypeScript source
- apps/web/.eslintrc.js — JavaScript
- apps/web/.gitignore — .gitignore
- apps/web/README.md — README
- apps/web/__tests__/api-parse.test.ts — TypeScript source
- apps/web/__tests__/github-notebook.test.ts — TypeScript source
- apps/web/__tests__/harmony.test.ts — TypeScript source
- apps/web/__tests__/schemas.test.ts — TypeScript source
- apps/web/app/admin/moderation/page.tsx — React (TSX) component
- apps/web/app/admin/page.tsx — React (TSX) component
- apps/web/app/api/adapt/route.ts — TypeScript source
- apps/web/app/api/admin/moderation/[id]/approve/route.ts — TypeScript source
- apps/web/app/api/admin/moderation/[id]/reject/route.ts — TypeScript source
- apps/web/app/api/admin/notebooks/[id]/route.ts — TypeScript source
- apps/web/app/api/admin/notebooks/upload/route.ts — TypeScript source
- apps/web/app/api/admin/settings/github/route.ts — TypeScript source
- apps/web/app/api/aggregator/index/route.ts — TypeScript source
- apps/web/app/api/assessments/validate/route.ts — TypeScript source
- apps/web/app/api/catalog/lessons/public/route.ts — TypeScript source
- apps/web/app/api/catalog/lessons/publish/route.ts — TypeScript source
- apps/web/app/api/catalog/notebooks/mine/route.ts — TypeScript source
- apps/web/app/api/catalog/notebooks/public/route.ts — TypeScript source
- apps/web/app/api/catalog/notebooks/publish/route.ts — TypeScript source
- apps/web/app/api/content/index/route.ts — TypeScript source
- apps/web/app/api/content/research/route.ts — TypeScript source
- apps/web/app/api/exec/route.ts — TypeScript source
- apps/web/app/api/execute/route.ts — TypeScript source
- apps/web/app/api/export/colab/local/[id]/route.ts — TypeScript source
- apps/web/app/api/files/download/route.ts — TypeScript source
- apps/web/app/api/generate-from-text/route.ts — TypeScript source
- apps/web/app/api/generate-lesson/route.ts — TypeScript source
- apps/web/app/api/generate-local/route.ts — TypeScript source
- apps/web/app/api/generate/bundle/route.ts — TypeScript source
- apps/web/app/api/health/route.ts — TypeScript source
- apps/web/app/api/health/web/route.ts — TypeScript source
- apps/web/app/api/hf/model/route.ts — TypeScript source
- apps/web/app/api/library/pointer/route.ts — TypeScript source
- apps/web/app/api/lmstudio/download/route.ts — TypeScript source
- apps/web/app/api/lmstudio/options/[id]/route.ts — TypeScript source
- apps/web/app/api/lmstudio/search/route.ts — TypeScript source
- apps/web/app/api/notebooks/[id]/export/alain/route.ts — TypeScript source
- apps/web/app/api/notebooks/[id]/publish-request/route.ts — TypeScript source
- apps/web/app/api/notebooks/[id]/remix/route.ts — TypeScript source
- apps/web/app/api/notebooks/[id]/route.ts — TypeScript source
- apps/web/app/api/notebooks/featured/route.ts — TypeScript source
- apps/web/app/api/notebooks/grade/route.ts — TypeScript source
- apps/web/app/api/notebooks/ingest/route.ts — TypeScript source
- apps/web/app/api/notebooks/remix/alain/route.ts — TypeScript source
- apps/web/app/api/notebooks/remix/route.ts — TypeScript source
- apps/web/app/api/notebooks/route.ts — TypeScript source
- apps/web/app/api/notebooks/upload/route.ts — TypeScript source
- apps/web/app/api/phases/route.ts — TypeScript source
- apps/web/app/api/providers/models/route.ts — TypeScript source
- apps/web/app/api/providers/ollama/show/route.ts — TypeScript source
- apps/web/app/api/providers/ollama/tags/route.ts — TypeScript source
- apps/web/app/api/providers/route.ts — TypeScript source
- apps/web/app/api/providers/smoke/route.ts — TypeScript source
- apps/web/app/api/repair-lesson/route.ts — TypeScript source
- apps/web/app/api/research/route.ts — TypeScript source
- apps/web/app/api/setup/route.ts — TypeScript source
- apps/web/app/api/tutorials/[id]/assessments/route.ts — TypeScript source
- apps/web/app/api/tutorials/[id]/progress/route.ts — TypeScript source
- apps/web/app/api/tutorials/[id]/publish/route.ts — TypeScript source
- apps/web/app/api/tutorials/[id]/route.ts — TypeScript source
- apps/web/app/api/tutorials/local/[id]/route.ts — TypeScript source
- apps/web/app/api/tutorials/public/route.ts — TypeScript source
- apps/web/app/generate/outline-first/page.tsx — React (TSX) component
- apps/web/app/generate/page.tsx — React (TSX) component
- apps/web/app/globals.css — File
- apps/web/app/health/page.tsx — React (TSX) component
- apps/web/app/layout.tsx — React (TSX) component
- apps/web/app/lessons/page.tsx — React (TSX) component
- apps/web/app/lmstudio/page.tsx — React (TSX) component
- apps/web/app/my/notebooks/page.tsx — React (TSX) component
- apps/web/app/notebooks/[id]/edit/page.tsx — React (TSX) component
- apps/web/app/notebooks/[id]/page.tsx — React (TSX) component
- apps/web/app/notebooks/featured/page.tsx — React (TSX) component
- apps/web/app/notebooks/page.tsx — React (TSX) component
- apps/web/app/onboarding/page.tsx — React (TSX) component
- apps/web/app/page.tsx — React (TSX) component
- apps/web/app/research/page.tsx — React (TSX) component
- apps/web/app/stream/page.tsx — React (TSX) component
- apps/web/app/tutorials/[id]/page.tsx — React (TSX) component
- apps/web/components/Accordion.tsx — React (TSX) component
- apps/web/components/BrandLogo.tsx — React (TSX) component
- apps/web/components/Button.tsx — React (TSX) component
- apps/web/components/Card.tsx — React (TSX) component
- apps/web/components/CardGrid.tsx — React (TSX) component
- apps/web/components/CodeEditor.tsx — React (TSX) component
- apps/web/components/CopyButton.tsx — React (TSX) component
- apps/web/components/EnvStatusBadge.tsx — React (TSX) component
- apps/web/components/Footer.tsx — React (TSX) component
- apps/web/components/GitHubOpenForm.tsx — React (TSX) component
- apps/web/components/Hero.tsx — React (TSX) component
- apps/web/components/JSRunner.ts — TypeScript source
- apps/web/components/LocalRuntimeStatus.tsx — React (TSX) component
- apps/web/components/LocalSetupHelper.tsx — React (TSX) component
- apps/web/components/MarkCompleteButton.tsx — React (TSX) component
- apps/web/components/MarkdownEditor.tsx — React (TSX) component
- apps/web/components/MobileNav.tsx — React (TSX) component
- apps/web/components/NavBar.tsx — React (TSX) component
- apps/web/components/NotebookActions.tsx — React (TSX) component
- apps/web/components/NotebookViewer.tsx — React (TSX) component
- apps/web/components/OfflineBadge.tsx — React (TSX) component
- apps/web/components/PreviewPanel.tsx — React (TSX) component
- apps/web/components/PromptCell.tsx — React (TSX) component
- apps/web/components/PyRunner.tsx — React (TSX) component
- apps/web/components/StepAssessments.tsx — React (TSX) component
- apps/web/components/StepNav.tsx — React (TSX) component
- apps/web/components/StepRunner.tsx — React (TSX) component
- apps/web/components/StreamingOutput.tsx — React (TSX) component
- apps/web/components/Toast.tsx — React (TSX) component
- apps/web/components/TryPrompt.tsx — React (TSX) component
- apps/web/data/featured-notebooks.json — JSON data/schema
- apps/web/data/notebooks-index.json — JSON data/schema
- apps/web/docs/ACCESSIBILITY-CHECKLIST.md — Markdown doc
- apps/web/docs/BRAND_TOKENS.md — Markdown doc
- apps/web/docs/DEVELOPER_GUIDE.md — Markdown doc
- apps/web/docs/MIGRATION-NOTE.md — Markdown doc
- apps/web/docs/OPERATIONS.md — Markdown doc
- apps/web/docs/REFRESH-CLEANUP.md — Markdown doc
- apps/web/docs/RUNBOOK.md — Markdown doc
- apps/web/docs/clerk-account-portal-colors.md — Markdown doc
- apps/web/e2e/footer.spec.ts — TypeScript source
- apps/web/e2e/generate.spec.ts — TypeScript source
- apps/web/e2e/home.spec.ts — TypeScript source
- apps/web/features/generate/GeneratePage.tsx — React (TSX) component
- apps/web/features/onboarding-settings/OnboardingGate.tsx — React (TSX) component
- apps/web/features/onboarding-settings/OnboardingStep.tsx — React (TSX) component
- apps/web/features/onboarding-settings/OnboardingWizard.tsx — React (TSX) component
- apps/web/features/onboarding-settings/README_OnboardingSettings.md — Markdown doc
- apps/web/features/onboarding-settings/ResetOnboardingDialog.tsx — React (TSX) component
- apps/web/features/onboarding-settings/SettingsPage.tsx — React (TSX) component
- apps/web/features/onboarding-settings/__tests__/useOnboarding.test.ts — TypeScript source
- apps/web/features/onboarding-settings/types.ts — TypeScript source
- apps/web/features/onboarding-settings/useOnboarding.ts — TypeScript source
- apps/web/features/onboarding-settings/useSettings.ts — TypeScript source
- apps/web/features/research/ResearchPage.tsx — React (TSX) component
- apps/web/lib/admin.ts — TypeScript source
- apps/web/lib/api.ts — TypeScript source
- apps/web/lib/auth.ts — TypeScript source
- apps/web/lib/backend.ts — TypeScript source
- apps/web/lib/github.ts — TypeScript source
- apps/web/lib/githubRaw.ts — TypeScript source
- apps/web/lib/harmony.ts — TypeScript source
- apps/web/lib/kv.ts — TypeScript source
- apps/web/lib/localTutorialStore.ts — TypeScript source
- apps/web/lib/notebookExport.ts — TypeScript source
- apps/web/lib/notebookStore.ts — TypeScript source
- apps/web/lib/providers/aliases.ts — TypeScript source
- apps/web/lib/providers/index.ts — TypeScript source
- apps/web/lib/providers/openai.ts — TypeScript source
- apps/web/lib/providers/poe.ts — TypeScript source
- apps/web/lib/schemas.ts — TypeScript source
- apps/web/lib/types.ts — TypeScript source
- apps/web/middleware.ts — TypeScript source
- apps/web/next-env.d.ts — TypeScript source
- apps/web/next.config.js — JavaScript
- apps/web/package-lock.json — npm lockfile
- apps/web/package.json — Node package manifest
- apps/web/playwright.config.ts — Playwright config
- apps/web/postcss.config.js — JavaScript
- apps/web/public/brand/ALAIN_logo_primary_blue-bg.svg — Image asset
- apps/web/public/brand/ALAIN_logo_primary_yellow-bg.svg — Image asset
- apps/web/public/humans.txt — Text resource
- apps/web/public/og/alain-box.jpg — Image asset
- apps/web/public/og/alain-box.png — Image asset
- apps/web/scripts/vercel_should_build.sh — Shell script
- apps/web/tailwind.config.ts — TypeScript source
- apps/web/tsconfig.json — TypeScript config
- apps/web/types/monaco.d.ts — TypeScript source
- apps/web/vercel.json — Vercel config
- apps/web/vitest — File
- apps/web/vitest.config.ts — Vitest config
- bun.lock — File
- docs/ACCURACY_CHECKLIST.md — Markdown doc
- docs/AI_MODEL_INFO_DISTRIBUTION_GUIDE.md — Markdown doc
- docs/FILE_STRUCTURE.md — Markdown doc
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
- fix_notebook_kernel.py — Python script
- notes/hackathon/.gitkeep — File
- notes/hackathon/final-polish-todo.md — Markdown doc
- package-lock.json — npm lockfile
- package.json — Node package manifest
- packages/alain-kit-sdk/README.md — README
- packages/alain-kit-sdk/bin/alain-kit.ts — CLI entry
- packages/alain-kit-sdk/examples/bench-run.ts — TypeScript source
- packages/alain-kit-sdk/examples/generate-prompting-guide.ts — TypeScript source
- packages/alain-kit-sdk/examples/usage-example.ts — TypeScript source
- packages/alain-kit-sdk/index.ts — TypeScript source
- packages/alain-kit-sdk/package.json — Node package manifest
- packages/alain-kit/README.md — README
- packages/alain-kit/core/json-utils.ts — TypeScript source
- packages/alain-kit/core/model-caps.ts — TypeScript source
- packages/alain-kit/core/notebook-builder.ts — TypeScript source
- packages/alain-kit/core/obs.ts — TypeScript source
- packages/alain-kit/core/outline-generator.ts — TypeScript source
- packages/alain-kit/core/providers.ts — TypeScript source
- packages/alain-kit/core/section-generator.ts — TypeScript source
- packages/alain-kit/examples/usage-example.ts — TypeScript source
- packages/alain-kit/package.json — Node package manifest
- packages/alain-kit/validation/colab-validator.ts — TypeScript source
- packages/alain-kit/validation/integration.ts — TypeScript source
- packages/alain-kit/validation/quality-validator.ts — TypeScript source
- pytest.ini — File
- requirements-dev.txt — Text resource
- requirements.txt — Text resource
- resources/brand/ALAIN-Brand-Sheet-v1.0.md — Markdown doc
- resources/brand/ALAIN-Brand-Style-Guide-v1.0.md — Markdown doc
- resources/brand/alain-typography.css — File
- resources/brand/examples/HeroHeader.tsx — React (TSX) component
- resources/brand/tailwind.alain.config.snippet.js — JavaScript
- resources/content/README.md — README
- resources/content/lessons/poe/custom-content/2025-09-14/lesson_1757809449230_wbvj5ixus.json — JSON data/schema
- resources/content/lessons/poe/custom-content/2025-09-14/lesson_1757809449230_wbvj5ixus.json.meta.json — JSON data/schema
- resources/content/lessons/poe/custom-content/2025-09-14/lesson_1757809917552_8g8c2ywsb.json — JSON data/schema
- resources/content/lessons/poe/custom-content/2025-09-14/lesson_1757809917552_8g8c2ywsb.json.meta.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757804021219_1tmdxkvwj.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757804021219_1tmdxkvwj.json.meta.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757805731541_nwtp21iia.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757805731541_nwtp21iia.json.meta.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757806682151_e50qyfsio.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757806682151_e50qyfsio.json.meta.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757807692296_d94xkqnqk.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-13/lesson_1757807692296_d94xkqnqk.json.meta.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809449373_au75ocupx.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809449373_au75ocupx.json.meta.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809917769_xaycwb6wr.json — JSON data/schema
- resources/content/lessons/poe/gpt-oss-20b/2025-09-14/lesson_1757809917769_xaycwb6wr.json.meta.json — JSON data/schema
- resources/content/notebooks/alternative-tinyllama-lesson-1757828955061.json — JSON data/schema
- resources/content/notebooks/colab-compatibility-report-1757830393747.md — Markdown doc
- resources/content/notebooks/colab-fixed-tinyllama-1757830393747.ipynb — Jupyter notebook
- resources/content/notebooks/colab-ready-tinyllama-1757830486773.ipynb — Jupyter notebook
- resources/content/notebooks/complete-tinyllama-notebook-1757829434887.ipynb — Jupyter notebook
- resources/content/notebooks/gpt-5_prompting_guide.ipynb — Jupyter notebook
- resources/content/notebooks/openai/gpt-oss-20b/getting-started-with-gpt-oss-20b.ipynb — Jupyter notebook
- resources/content/notebooks/openai/gpt-oss-20b/gpt-oss-20b-quick-start-guide.ipynb — Jupyter notebook
- resources/content/notebooks/openai/gpt-oss-20b/metadata.json — JSON data/schema
- resources/content/notebooks/outline-1757829167041.json — JSON data/schema
- resources/content/notebooks/outline-first-notebook-1757829167041.ipynb — Jupyter notebook
- resources/content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809449234_gmwu4uikn.ipynb — Jupyter notebook
- resources/content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809449234_gmwu4uikn.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809917554_29lh3vcua.ipynb — Jupyter notebook
- resources/content/notebooks/poe/custom-content/beginner/2025-09-14/custom-content_beginner_1757809917554_29lh3vcua.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757804021221_fem40q6ma.ipynb — Jupyter notebook
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757804021221_fem40q6ma.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757805731543_1xb6tju9r.ipynb — Jupyter notebook
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757805731543_1xb6tju9r.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757806682153_ie9wr234d.ipynb — Jupyter notebook
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757806682153_ie9wr234d.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757807692297_ymw31ispc.ipynb — Jupyter notebook
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757807692297_ymw31ispc.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809449375_3ph24h6ze.ipynb — Jupyter notebook
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809449375_3ph24h6ze.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809917771_tad92yezw.ipynb — Jupyter notebook
- resources/content/notebooks/poe/gpt-oss-20b/beginner/2025-09-14/gpt-oss-20b_beginner_1757809917771_tad92yezw.ipynb.meta.json — JSON data/schema
- resources/content/notebooks/quality-report-1757829458085.md — Markdown doc
- resources/content/notebooks/tinyllama-complete-lesson-1757818311765.json — JSON data/schema
- resources/content/notebooks/tinyllama-complete-notebook-1757818311765.ipynb — Jupyter notebook
- resources/content/research/openai/gpt-oss-20b/hf-files/README.md — README
- resources/content/research/openai/gpt-oss-20b/hf-files/config.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/hf-files/generation_config.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/hf-files/model.safetensors.index.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/hf-files/original/config.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/hf-files/original/dtypes.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/hf-files/special_tokens_map.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/hf-files/tokenizer_config.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/huggingface-info.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/huggingface-info.md — Markdown doc
- resources/content/research/openai/gpt-oss-20b/kaggle-content.md — Markdown doc
- resources/content/research/openai/gpt-oss-20b/model-card.md — Markdown doc
- resources/content/research/openai/gpt-oss-20b/openai-cookbook.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/openai-cookbook.md — Markdown doc
- resources/content/research/openai/gpt-oss-20b/research-data.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/unsloth-content.json — JSON data/schema
- resources/content/research/openai/gpt-oss-20b/unsloth-content.md — Markdown doc
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590368_jxdf9iryj.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590368_jxdf9iryj.json.meta.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590370_28dkdnm5n.ipynb — Jupyter notebook
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790590370_28dkdnm5n.ipynb.meta.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629760_pczxk9jro.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629760_pczxk9jro.json.meta.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629761_mwroqx5af.ipynb — Jupyter notebook
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790629761_mwroqx5af.ipynb.meta.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652150_hgf42wueu.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652150_hgf42wueu.json.meta.json — JSON data/schema
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652152_7x16iazq4.ipynb — Jupyter notebook
- resources/data/notebooks/gpt-oss-20b/beginner/2025-09-13/gpt-oss-20b_beginner_1757790652152_7x16iazq4.ipynb.meta.json — JSON data/schema
- resources/examples/README.md — README
- resources/examples/poe/__pycache__/poe-python-example.cpython-313.pyc — File
- resources/examples/poe/poe-openai-sdk-example.js — JavaScript
- resources/examples/poe/poe-python-example.py — Python script
- resources/examples/poe/test-poe-integration.js — JavaScript
- resources/examples/poe/test-poe-models.js — JavaScript
- resources/prompts/alain-kit/HACKATHON_SUBMISSION.md — Markdown doc
- resources/prompts/alain-kit/INDEX.md — Markdown doc
- resources/prompts/alain-kit/PROMPT_EVALUATION_REPORT.md — Markdown doc
- resources/prompts/alain-kit/README.md — README
- resources/prompts/alain-kit/USER_GUIDE.md — Markdown doc
- resources/prompts/alain-kit/VERSIONS.md — Markdown doc
- resources/prompts/alain-kit/archive/develop/develop.harmony.backup.txt — Text resource
- resources/prompts/alain-kit/archive/develop/develop.harmony.fixed.txt — Text resource
- resources/prompts/alain-kit/archive/develop/develop.harmony.original.txt — Text resource
- resources/prompts/alain-kit/archive/develop/develop.harmony.poe.txt — Text resource
- resources/prompts/alain-kit/archive/develop/develop.harmony.simple.txt — Text resource
- resources/prompts/alain-kit/cache.management.harmony.txt — Text resource
- resources/prompts/alain-kit/design.harmony.txt — Text resource
- resources/prompts/alain-kit/develop.harmony.txt — Text resource
- resources/prompts/alain-kit/example-usage.js — JavaScript
- resources/prompts/alain-kit/flattened/openai-compatible/design.online.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/flattened/openai-compatible/develop.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/flattened/openai-compatible/outline.online.v2025-09-14.txt — Text resource
- resources/prompts/alain-kit/flattened/openai-compatible/research.online.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/flattened/openai-compatible/section.online.v2025-09-14.txt — Text resource
- resources/prompts/alain-kit/flattened/openai-compatible/validate.online.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/flattened/poe/design.online.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/flattened/poe/develop.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/flattened/poe/outline.online.v2025-09-14.txt — Text resource
- resources/prompts/alain-kit/flattened/poe/research.online.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/flattened/poe/section.online.v2025-09-14.txt — Text resource
- resources/prompts/alain-kit/flattened/poe/validate.online.v2025-09-13.txt — Text resource
- resources/prompts/alain-kit/optimized/research.optimized.v1.txt — Text resource
- resources/prompts/alain-kit/orchestrator.harmony.txt — Text resource
- resources/prompts/alain-kit/orchestrator.offline.harmony.txt — Text resource
- resources/prompts/alain-kit/outline-first/research.outline.v1.txt — Text resource
- resources/prompts/alain-kit/research.harmony.txt — Text resource
- resources/prompts/alain-kit/research.offline.harmony.txt — Text resource
- resources/prompts/alain-kit/section-fill/research.section.v1.txt — Text resource
- resources/prompts/alain-kit/util/gpt-oss_orchestration_notes.md — Markdown doc
- resources/prompts/alain-kit/util/hf_extract.harmony.txt — Text resource
- resources/prompts/alain-kit/util/json_repair.harmony.txt — Text resource
- resources/prompts/alain-kit/validate.harmony.txt — Text resource
- resources/research-outputs/ALAIN_KIT_TEST_LOG_2025-09-13.md — Markdown doc
- resources/research-outputs/EVALUATION_REPORT_2025-09-13.md — Markdown doc
- resources/research-outputs/alain-kit-test-log.json — JSON data/schema
- resources/research-outputs/chatgpt-experience-research/enhanced-research-data.json — JSON data/schema
- resources/research-outputs/chatgpt-experience-research/enhanced-research-report.md — Markdown doc
- resources/research-outputs/chatgpt-real-model-research/enhanced-research-data.json — JSON data/schema
- resources/research-outputs/chatgpt-real-model-research/enhanced-research-report.md — Markdown doc
- resources/research-outputs/corrected-gpt-oss-test-log.json — JSON data/schema
- resources/research-outputs/enhanced-demo/enhanced-research-data.json — JSON data/schema
- resources/research-outputs/enhanced-demo/enhanced-research-report.md — Markdown doc
- resources/research-outputs/oai_gpt-oss_model_card.pdf — File
- resources/research-outputs/real-model-microsoft-CodeBERT-base/enhanced-research-data.json — JSON data/schema
- resources/research-outputs/real-model-microsoft-CodeBERT-base/enhanced-research-report.md — Markdown doc
- resources/research-outputs/real-model-microsoft-DialoGPT-medium/enhanced-research-data.json — JSON data/schema
- resources/research-outputs/real-model-microsoft-DialoGPT-medium/enhanced-research-report.md — Markdown doc
- resources/schemas/alain-lesson.schema.json — JSON data/schema
- scripts/__pycache__/json_to_notebook.cpython-313.pyc — File
- scripts/__pycache__/notebook_linter.cpython-313.pyc — File
- scripts/__pycache__/notebook_review.cpython-313.pyc — File
- scripts/__pycache__/notebook_smoke.cpython-313.pyc — File
- scripts/bench_consolidate.py — Python script
- scripts/dev_hosted.sh — Shell script
- scripts/dev_offline.sh — Shell script
- scripts/generate-file-structure.mjs — Node script
- scripts/json_to_notebook.py — Python script
- scripts/notebook_linter.py — Python script
- scripts/notebook_review.py — Python script
- scripts/notebook_smoke.py — Python script
- scripts/remix-cookbook-eli5.cjs — Node script
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
- vitest.config.ts — Vitest config
