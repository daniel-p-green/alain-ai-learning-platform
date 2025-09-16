#!/usr/bin/env bash
set -euo pipefail

# Force a Vercel build for /web (avoids monorepo skip heuristics during rapid iteration)
echo "Forcing Vercel build for /web"
exit 1
