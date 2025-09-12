#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:3000}

echo "[smoke] POST /api/generate-from-text?fallback=1"
OUT=$(curl -s -X POST "$BASE/api/generate-from-text?fallback=1" -H "Content-Type: application/json" -d '{"textContent":"ALAIN smoke test: create a tiny lesson with two steps."}')
echo "$OUT" | jq -r '.success, .tutorialId, .preview.title'

ID=$(echo "$OUT" | jq -r '.tutorialId')
if [[ "$ID" == local-* ]]; then
  echo "[smoke] GET /api/tutorials/local/$ID"
  curl -s "$BASE/api/tutorials/local/$ID" | jq -r '.title, .steps[0].title'
  echo "[smoke] GET /api/export/colab/local/$ID"
  curl -s "$BASE/api/export/colab/local/$ID" | jq -r '.nbformat, .cells[0].cell_type'
else
  echo "[smoke] Backend tutorial imported (id=$ID)"
fi

echo "[smoke] OK"

