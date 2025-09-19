# Tool Surface Design

Defines the callable interfaces that replace free-form text generation. Each tool is presented to Harmony via `SystemContent.with_tools(...)` and exposed to external agents through MCP.

## 1. Shared Conventions
- All tools respond with JSON objects (`response_format = json_object`) that include `status` (`"ok" | "error"`) and optional `messages` array for warnings.
- Tool errors MUST set `status = "error"` and include `error_code` + `error_message` so the orchestrator can decide whether to retry or abort.
- Notebook state is maintained server-side; tool responses may return identifiers or snapshots but SHOULD avoid echoing large blobs unless necessary.
- Cell indices are 0-based in the final notebook order; section numbers remain 1-based to match the outline contract.

## 2. Tool Catalog

### 2.1 `notebook.add_dependency`
Registers a runtime requirement and returns the canonical dependency manifest entry.

**Input schema:**
```json
{
  "type": "object",
  "required": ["package", "version", "manager"],
  "properties": {
    "package": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "pattern": "^([0-9]+\.)*[0-9]+(-[A-Za-z0-9]+)?$" },
    "manager": { "type": "string", "enum": ["pip", "conda", "apt"] },
    "import_check": { "type": "string", "description": "Python import statement to verify install" },
    "notes": { "type": "string", "description": "Short justification surfaced in setup markdown" }
  }
}
```

**Response payload:**
```json
{
  "status": "ok",
  "dependency_id": "pip::torch@2.4.0",
  "manifest_position": 1
}
```

### 2.2 `notebook.emit_markdown_step`
Adds a markdown cell for the active section and returns metadata for validators.

**Input schema:**
```json
{
  "type": "object",
  "required": ["section_number", "title", "body", "callouts", "estimated_tokens"],
  "properties": {
    "section_number": { "type": "integer", "minimum": 1 },
    "title": { "type": "string", "pattern": "^Step [0-9]+: .+" },
    "body": { "type": "string", "minLength": 300 },
    "callouts": {
      "type": "array",
      "minItems": 3,
      "items": {
        "type": "object",
        "required": ["type", "message"],
        "properties": {
          "type": { "type": "string", "enum": ["tip", "warning", "note"] },
          "message": { "type": "string", "minLength": 50 }
        }
      }
    },
    "prerequisites_check": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "next_section_hint": { "type": "string", "minLength": 50 },
    "estimated_tokens": { "type": "integer", "minimum": 600, "maximum": 2200 }
  }
}
```

**Response payload:**
```json
{
  "status": "ok",
  "cell_index": 5,
  "markdown_ratio_hint": 0.58
}
```

### 2.3 `notebook.emit_code_cell`
Appends a runnable code cell associated with a section.

**Input schema:**
```json
{
  "type": "object",
  "required": ["section_number", "code", "language"],
  "properties": {
    "section_number": { "type": "integer", "minimum": 1 },
    "code": { "type": "string", "minLength": 120 },
    "language": { "type": "string", "enum": ["python"] },
    "narration": { "type": "string", "description": "Short preceding markdown snippet" },
    "expected_output": { "type": "string", "description": "Summary of expected result" }
  }
}
```

**Response payload:**
```json
{
  "status": "ok",
  "cell_index": 6,
  "runnable": true
}
```

### 2.4 `notebook.record_assessment`
Adds MCQ or coding assessments and updates summary metadata.

**Input schema:**
```json
{
  "type": "object",
  "required": ["section_number", "questions"],
  "properties": {
    "section_number": { "type": "integer", "minimum": 1 },
    "questions": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["prompt", "options", "correct_index", "explanation"],
        "properties": {
          "prompt": { "type": "string", "minLength": 80 },
          "options": {
            "type": "array",
            "minItems": 3,
            "items": { "type": "string", "minLength": 10 }
          },
          "correct_index": { "type": "integer", "minimum": 0 },
          "explanation": { "type": "string", "minLength": 60 }
        }
      }
    }
  }
}
```

**Response payload:**
```json
{
  "status": "ok",
  "assessment_cell_indices": [12, 13]
}
```

### 2.5 `notebook.finalize`
Completes notebook assembly, injects summary/metadata cells, and returns artifact identifiers.

**Input schema:**
```json
{
  "type": "object",
  "required": ["outline_summary", "reading_time_minutes"],
  "properties": {
    "outline_summary": { "type": "string", "minLength": 200 },
    "next_steps": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "references": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "reading_time_minutes": { "type": "number", "minimum": 5, "maximum": 90 },
    "markdown_ratio_target": { "type": "number", "minimum": 0.3, "maximum": 0.8 }
  }
}
```

**Response payload:**
```json
{
  "status": "ok",
  "notebook_path": "/tmp/alain-kit-20250115/notebook.ipynb",
  "section_counts": {
    "markdown": 18,
    "code": 12
  }
}
```

### 2.6 `validator.run_quality`
Executes the existing quality validator and echoes the native schema for observability.

**Input schema:**
```json
{
  "type": "object",
  "required": ["notebook_path"],
  "properties": {
    "notebook_path": { "type": "string" }
  }
}
```

**Response payload:**
```json
{
  "status": "ok",
  "metrics": {
    "qualityScore": 92,
    "stepCount": 8,
    "markdownRatio": 0.55,
    "estimatedTokens": 3200,
    "estimatedReadingTime": 16,
    "hasRequiredSections": true,
    "meetsStandards": true
  }
}
```

### 2.7 `validator.run_colab`
Runs the Colab compatibility check and returns issues/fixes.

**Input schema:** identical to `validator.run_quality`.

**Response payload:**
```json
{
  "status": "ok",
  "isCompatible": true,
  "issues": [],
  "fixedNotebookPath": "/tmp/alain-kit-20250115/notebook.colab.ipynb"
}
```

## 3. Tool Instructions (Harmony Developer Text)
- **General guidance:** “Always call `notebook.add_dependency` before referencing a package in code. All sections must include both markdown explanations and runnable code. Use `notebook.finalize` exactly once per run.”
- **Validator guidance:** “If `validator.run_quality` returns `meetsStandards = false`, revise the offending sections before proceeding. If Colab issues persist after auto-fix, halt generation and request human review.”
- **Error handling:** instruct the model to avoid retry loops; after two consecutive `status = "error"` responses for the same tool, escalate to the orchestrator.

## 4. Open Questions for Reviewers
1. Are additional tool hooks needed for research ingestion (e.g., `fetch_model_card`)?
2. Should assessments be attached to the final summary section or embedded per-step?
3. Do we need an explicit tool for logging manual review triggers (`notebook.flag_for_review`)?

Feedback from notebook + validation owners will finalize the schemas before we implement Harmony stubs.
