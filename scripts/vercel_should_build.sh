#!/usr/bin/env bash
set -euo pipefail

# Decide whether to proceed with a Vercel build for a monorepo.
# Exit 0 to SKIP the build, exit 1 to PROCEED with the build.

# Current and previous commit SHAs (best effort across providers)
CUR=${VERCEL_GIT_COMMIT_SHA:-}
PREV=${VERCEL_GIT_PREVIOUS_COMMIT_SHA:-}

if [[ -z "$CUR" ]]; then
  CUR=$(git rev-parse HEAD)
fi
if [[ -z "$PREV" ]]; then
  # Fallback: previous commit on the same branch
  PREV=$(git rev-parse "$CUR^" 2>/dev/null || true)
fi

if [[ -z "$PREV" ]]; then
  echo "No previous commit found; proceeding with build"
  exit 1
fi

echo "Comparing changes between $PREV..$CUR"
CHANGED=$(git diff --name-only "$PREV" "$CUR")
echo "$CHANGED" | sed 's/^/ - /'

# Paths that should trigger a rebuild of the web app
PATTERN='^(
  web/|
  package.json|
  package-lock.json|
  pnpm-lock.yaml|
  bun.lockb|
  turbo.json|
  tsconfig\\.json|
  tsconfig\\.base\\.json|
  tailwind\\.config\\.(js|ts)|
  postcss\\.config\\.(js|ts)|
  env\\.web\\.example|
  .vercelignore|
  vercel\\.json
)$'

if echo "$CHANGED" | grep -Eq "$PATTERN"; then
  echo "Detected changes affecting web build; proceeding"
  exit 1
fi

echo "No relevant changes for web; skipping build"
exit 0

