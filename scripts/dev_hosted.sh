#!/usr/bin/env bash
set -euo pipefail

export OFFLINE_MODE=${OFFLINE_MODE:-0}
export TEACHER_PROVIDER=${TEACHER_PROVIDER:-poe}

echo "[dev_hosted] OFFLINE_MODE=$OFFLINE_MODE"
echo "[dev_hosted] TEACHER_PROVIDER=$TEACHER_PROVIDER"
if [[ -z "${POE_API_KEY:-}" ]]; then
  echo "[dev_hosted] Warning: POE_API_KEY not set. Hosted teacher may be unavailable." >&2
fi

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

