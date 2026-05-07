#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/smoke-r1-reminder-reliability.sh

Optional environment variables:
  EVIDENCE_DIR             Directory for evidence files (default: artifacts/smoke)
  EVIDENCE_LOG_FILE        Explicit log path (overrides EVIDENCE_DIR)
  FUNCTIONS_BASE_URL       Base URL for deployed functions, e.g. https://us-central1-<project>.cloudfunctions.net
  ID_TOKEN                 Identity token for authenticated manual send request
                           (Cloud invoker token via gcloud auth print-identity-token)
  REMINDER_EMAIL           Recipient email for manual send check (default: qa@example.com)
  REMINDER_VIN             VIN for manual send payload (default: 1HGCM82633A123456)

What this script does:
  1) Runs functions integration endpoints tests and logs output.
  2) Optionally calls sendMaintenanceReminder HTTP endpoint when FUNCTIONS_BASE_URL and ID_TOKEN are provided.
  3) Writes timestamped evidence logs under artifacts/smoke.

Notes:
  - Scheduled sweep reliability is validated via integration tests in this script.
  - If HTTP variables are not provided, manual send HTTP check is skipped with a warning.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: required command not found: $1" >&2
    exit 1
  }
}

require_cmd date
require_cmd tee

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="${EVIDENCE_DIR:-$ROOT_DIR/artifacts/smoke}"
EVIDENCE_LOG_FILE="${EVIDENCE_LOG_FILE:-}"
FUNCTIONS_BASE_URL="${FUNCTIONS_BASE_URL:-}"
ID_TOKEN="${ID_TOKEN:-}"
REMINDER_EMAIL="${REMINDER_EMAIL:-qa@example.com}"
REMINDER_VIN="${REMINDER_VIN:-1HGCM82633A123456}"

timestamp() {
  date -u +%Y%m%dT%H%M%SZ
}

if [[ -z "$EVIDENCE_LOG_FILE" ]]; then
  mkdir -p "$EVIDENCE_DIR"
  EVIDENCE_LOG_FILE="$EVIDENCE_DIR/r1-reminder-reliability-$(timestamp).log"
else
  mkdir -p "$(dirname "$EVIDENCE_LOG_FILE")"
fi

exec > >(tee -a "$EVIDENCE_LOG_FILE") 2>&1

echo "Evidence log: $EVIDENCE_LOG_FILE"
echo "Root dir: $ROOT_DIR"

echo "[Step 1/2] Running functions integration endpoints tests"
(
  cd "$ROOT_DIR/packages/functions"
  # Some functions modules require Firebase env keys at import time (storage trigger setup).
  export GCLOUD_PROJECT="${GCLOUD_PROJECT:-demo-project}"
  if [[ -z "${FIREBASE_CONFIG:-}" ]]; then
    export FIREBASE_CONFIG='{"projectId":"demo-project","storageBucket":"demo-project.appspot.com"}'
  fi
  npm run build
  node --test --test-name-pattern "(sendMaintenanceReminder|deriveUpcomingMaintenanceItems|runMaintenanceReminder)" test/integration.endpoints.test.js
)

echo "[Step 1/2] Completed"

if [[ -n "$FUNCTIONS_BASE_URL" ]]; then
  require_cmd curl

  if [[ -z "$ID_TOKEN" ]]; then
    if command -v gcloud >/dev/null 2>&1; then
      ID_TOKEN="$(gcloud auth print-identity-token 2>/dev/null || true)"
      if [[ -n "$ID_TOKEN" ]]; then
        echo "[Step 2/2] Acquired invoker identity token from gcloud"
      fi
    fi
  fi

  if [[ -z "$ID_TOKEN" ]]; then
    echo "[Step 2/2] Skipped manual send HTTP check (no ID_TOKEN and unable to auto-acquire via gcloud)"
    echo "PASS: R1 reminder reliability smoke run completed"
    exit 0
  fi

  URL="${FUNCTIONS_BASE_URL%/}/sendMaintenanceReminder"
  echo "[Step 2/2] Running authenticated manual send HTTP check -> $URL"

  payload=$(cat <<JSON
{
  "email": "$REMINDER_EMAIL",
  "vehicle": {
    "make": "Honda",
    "model": "Accord",
    "year": 2023,
    "vin": "$REMINDER_VIN"
  },
  "maintenanceItems": [
    {
      "title": "Oil Change",
      "dueDate": "Within 14 days"
    }
  ]
}
JSON
)

  tmp_resp=$(mktemp)
  trap 'rm -f "$tmp_resp"' EXIT

  status=$(curl -sS -o "$tmp_resp" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -X POST "$URL" \
    -d "$payload")

  echo "Manual send HTTP status: $status"
  echo "Manual send HTTP response:"
  cat "$tmp_resp"
  echo

  if [[ "$status" -ge 400 ]]; then
    echo "FAIL: manual send HTTP check failed with status $status" >&2
    exit 1
  fi

  echo "[Step 2/2] Completed"
else
  echo "[Step 2/2] Skipped manual send HTTP check (FUNCTIONS_BASE_URL not provided)"
fi

echo "PASS: R1 reminder reliability smoke run completed"
