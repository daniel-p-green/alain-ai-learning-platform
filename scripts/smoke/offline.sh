#!/usr/bin/env bash
set -euo pipefail

# Simple offline smoke: requires backend on :4000 with OFFLINE_MODE=1 and OPENAI_* set to local endpoint
BASE_URL="${BASE_URL:-http://localhost:4000}"
MODEL="${MODEL:-GPT-OSS-20B}"
HF_URL="${HF_URL:-openai/gpt-oss-20b}"

echo "[smoke:offline] POST $BASE_URL/lessons/generate (provider=openai-compatible, model=$MODEL, hf=$HF_URL, OFFLINE_MODE=1)"
AUTH=()
if [ -n "${BACKEND_TOKEN:-}" ]; then AUTH=(-H "Authorization: Bearer $BACKEND_TOKEN"); else echo "[smoke] Hint: set BACKEND_TOKEN or run backend with DEMO_ALLOW_UNAUTH=1"; fi
resp=$(curl -s -X POST "$BASE_URL/lessons/generate" \
  -H 'Content-Type: application/json' \
  -H 'X-Demo-Bypass: 1' "${AUTH[@]}" \
  -d "{\"hfUrl\":\"$HF_URL\",\"difficulty\":\"beginner\",\"teacherModel\":\"$MODEL\",\"includeAssessment\":true,\"provider\":\"openai-compatible\"}")
ok=$(echo "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let j=JSON.parse(s);console.log(j.success?"ok":"fail")}catch{console.log("fail")}})')
echo "$resp"
test "$ok" = "ok" || { echo "Offline smoke failed" >&2; exit 1; }
echo "[smoke:offline] PASS"
