# Backend Testing

This repo includes two kinds of backend tests:

- Pure TS unit tests (no DB/runtime): export notebook builder, schema validation, utilities.
- DB/runtime-dependent tests (tutorials CRUD and step reordering): require the Encore runtime library.

## Run pure tests

```bash
cd alain-ai-learning-platform/backend
bunx vitest run --include "**/{export,execution,utils}/**/*.test.ts"

Examples:
- Provider aliasing and mapping: `backend/execution/providers/aliases.test.ts`
- Teacher routing guard (120B → Poe): `backend/execution/teacher.routing.test.ts`
```

## Run all tests (with Encore runtime)

1) Ensure the Encore runtime library is available in node_modules/encore.dev.
2) Export the path in ENCORE_RUNTIME_LIB.

Example (macOS/Linux):

```bash
export ENCORE_RUNTIME_LIB="$(node -e "console.log(require.resolve('encore.dev/dist/internal/runtime/napi/encore-runtime.node'))")"
cd alain-ai-learning-platform/backend
bunx vitest run
```

If the resolve fails, locate the file manually under node_modules/encore.dev/dist/internal/runtime/napi/encore-runtime.node and set ENCORE_RUNTIME_LIB to the absolute path.
