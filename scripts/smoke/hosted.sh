#!/usr/bin/env bash
set -euo pipefail

# Simple hosted smoke: requires backend on :4000 and POE provider configured
BASE_URL="${BASE_URL:-http://localhost:4000}"
MODEL="${MODEL:-GPT-OSS-20B}"
HF_URL="${HF_URL:-openai/gpt-oss-20b}"

echo "[smoke:hosted] POST $BASE_URL/lessons/generate (provider=poe, model=$MODEL, hf=$HF_URL)"
AUTH=()
if [ -n "${BACKEND_TOKEN:-}" ]; then AUTH=(-H "Authorization: Bearer $BACKEND_TOKEN"); else echo "[smoke] Hint: set BACKEND_TOKEN to avoid auth failures"; fi
resp=$(curl -s -X POST "$BASE_URL/lessons/generate" \
  -H 'Content-Type: application/json' "${AUTH[@]}" \
  -d "{\"hfUrl\":\"$HF_URL\",\"difficulty\":\"beginner\",\"teacherModel\":\"$MODEL\",\"includeAssessment\":true,\"provider\":\"poe\"}")
ok=$(echo "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let j=JSON.parse(s);console.log(j.success?"ok":"fail")}catch{console.log("fail")}})')
echo "$resp"
test "$ok" = "ok" || { echo "Hosted smoke failed" >&2; exit 1; }
echo "[smoke:hosted] PASS"
