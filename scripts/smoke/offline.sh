#!/usr/bin/env bash
set -euo pipefail

# Enhanced offline smoke: tests lesson generation + offline saving for GPT-OSS-20B
# Requires backend on :4000 with OFFLINE_MODE=1 and OPENAI_* set to local endpoint
BASE_URL="${BASE_URL:-http://localhost:4000}"
MODEL="${MODEL:-GPT-OSS-20B}"
HF_URL="${HF_URL:-https://huggingface.co/openai/gpt-oss-20b}"
CACHE_DIR="${CACHE_DIR:-$HOME/.alain/cache/offline-smoke}"
mkdir -p "$CACHE_DIR"

echo "[smoke:offline] Starting offline smoke test for $MODEL ($HF_URL)"
echo "[smoke:offline] CACHE_DIR=$CACHE_DIR"
echo "[smoke:offline] POST $BASE_URL/lessons/generate (provider=openai-compatible, model=$MODEL, hf=$HF_URL, OFFLINE_MODE=1)"
AUTH=()
if [ -n "${BACKEND_TOKEN:-}" ]; then AUTH=(-H "Authorization: Bearer $BACKEND_TOKEN"); else echo "[smoke] Hint: set BACKEND_TOKEN or run backend with DEMO_ALLOW_UNAUTH=1"; fi
resp=$(curl -s -X POST "$BASE_URL/lessons/generate" \
  -H 'Content-Type: application/json' \
  -H 'X-Demo-Bypass: 1' "${AUTH[@]}" \
  -d "{\"hfUrl\":\"$HF_URL\",\"difficulty\":\"beginner\",\"teacherModel\":\"$MODEL\",\"includeAssessment\":true,\"provider\":\"openai-compatible\"}")
ok=$(echo "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let j=JSON.parse(s);console.log(j.success?"ok":"fail")}catch{console.log("fail")}})')

if [ "$ok" != "ok" ]; then
  echo "$resp"
  echo "[smoke:offline] FAIL: Lesson generation failed" >&2
  exit 1
fi

# Save the successful response to cache
timestamp=$(date +%Y%m%d_%H%M%S)
cache_file="$CACHE_DIR/lesson_${MODEL,,}_${timestamp}.json"
echo "$resp" | jq . > "$cache_file"

echo "[smoke:offline] PASS: Lesson generated and saved to $cache_file"

# Verify the saved file exists and is valid JSON
if ! jq -e . "$cache_file" >/dev/null 2>&1; then
  echo "[smoke:offline] WARN: Cached lesson is not valid JSON" >&2
  exit 1
fi

echo "[smoke:offline] Verified: Cached lesson is valid JSON"
exit 0
