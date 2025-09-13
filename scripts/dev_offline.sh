#!/usr/bin/env bash
set -euo pipefail

export OFFLINE_MODE=${OFFLINE_MODE:-1}
export TEACHER_PROVIDER=${TEACHER_PROVIDER:-openai-compatible}
export OPENAI_BASE_URL=${OPENAI_BASE_URL:-http://localhost:11434/v1}
export OPENAI_API_KEY=${OPENAI_API_KEY:-ollama}
export DEMO_ALLOW_UNAUTH=${DEMO_ALLOW_UNAUTH:-1}

echo "[dev_offline] OFFLINE_MODE=$OFFLINE_MODE"
echo "[dev_offline] TEACHER_PROVIDER=$TEACHER_PROVIDER"
echo "[dev_offline] OPENAI_BASE_URL=$OPENAI_BASE_URL"
echo "[dev_offline] OPENAI_API_KEY=$OPENAI_API_KEY"
echo "[dev_offline] DEMO_ALLOW_UNAUTH=$DEMO_ALLOW_UNAUTH"

(
  cd backend
  encore run
) &
BACK_PID=$!

(
  cd web
  npm run dev
) &
WEB_PID=$!

trap 'kill $BACK_PID $WEB_PID 2>/dev/null || true' INT TERM EXIT

wait -n $BACK_PID $WEB_PID || true

