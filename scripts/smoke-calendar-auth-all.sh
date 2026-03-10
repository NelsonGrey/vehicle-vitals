#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  STAGING_FUNCTIONS_BASE_URL=https://us-central1-<staging-project>.cloudfunctions.net \
  STAGING_ID_TOKEN=<staging-firebase-id-token> \
  PRODUCTION_FUNCTIONS_BASE_URL=https://us-central1-<prod-project>.cloudfunctions.net \
  PRODUCTION_ID_TOKEN=<prod-firebase-id-token> \
  ./scripts/smoke-calendar-auth-all.sh

Required environment variables:
  STAGING_FUNCTIONS_BASE_URL
  STAGING_ID_TOKEN
  PRODUCTION_FUNCTIONS_BASE_URL
  PRODUCTION_ID_TOKEN

Optional environment variables:
  EXPECT_AUTH_REQUIRED   true|false (default: true)
  VEHICLE_VIN            17-char VIN (default: 1HGCM82633A123456)
  CALENDAR_TARGET        google|apple|ics (default: ics)
  TITLE                  Event title (default: Calendar Auth Smoke Test)
  DESCRIPTION            Event description (default: Smoke test event)
  START_AT               ISO timestamp for start
  END_AT                 ISO timestamp for end
  EVIDENCE_DIR           Directory for evidence logs (default: artifacts/smoke)
  EVIDENCE_LOG_FILE      Explicit evidence log file path (overrides EVIDENCE_DIR)

Outcome:
  Runs scripts/smoke-calendar-auth.sh against staging and production and prints
  a single pass/fail summary.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: $name is required" >&2
    usage
    exit 1
  fi
}

require_var STAGING_FUNCTIONS_BASE_URL
require_var STAGING_ID_TOKEN
require_var PRODUCTION_FUNCTIONS_BASE_URL
require_var PRODUCTION_ID_TOKEN

EXPECT_AUTH_REQUIRED="${EXPECT_AUTH_REQUIRED:-true}"
VEHICLE_VIN="${VEHICLE_VIN:-1HGCM82633A123456}"
CALENDAR_TARGET="${CALENDAR_TARGET:-ics}"
TITLE="${TITLE:-Calendar Auth Smoke Test}"
DESCRIPTION="${DESCRIPTION:-Smoke test event}"
START_AT="${START_AT:-}"
END_AT="${END_AT:-}"
EVIDENCE_DIR="${EVIDENCE_DIR:-artifacts/smoke}"
EVIDENCE_LOG_FILE="${EVIDENCE_LOG_FILE:-}"

timestamp() {
  date -u +%Y%m%dT%H%M%SZ
}

if [[ -z "$EVIDENCE_LOG_FILE" ]]; then
  mkdir -p "$EVIDENCE_DIR"
  EVIDENCE_LOG_FILE="$EVIDENCE_DIR/calendar-auth-smoke-$(timestamp).log"
else
  mkdir -p "$(dirname "$EVIDENCE_LOG_FILE")"
fi

exec > >(tee -a "$EVIDENCE_LOG_FILE") 2>&1

echo "Evidence log: $EVIDENCE_LOG_FILE"

run_env() {
  local label="$1"
  local base_url="$2"
  local id_token="$3"

  echo "========================================"
  echo "Running calendar auth smoke: $label"
  echo "Base URL: $base_url"
  echo "========================================"

  FUNCTIONS_BASE_URL="$base_url" \
  ID_TOKEN="$id_token" \
  EXPECT_AUTH_REQUIRED="$EXPECT_AUTH_REQUIRED" \
  VEHICLE_VIN="$VEHICLE_VIN" \
  CALENDAR_TARGET="$CALENDAR_TARGET" \
  TITLE="$TITLE" \
  DESCRIPTION="$DESCRIPTION" \
  START_AT="$START_AT" \
  END_AT="$END_AT" \
  ./scripts/smoke-calendar-auth.sh
}

run_env "staging" "$STAGING_FUNCTIONS_BASE_URL" "$STAGING_ID_TOKEN"
run_env "production" "$PRODUCTION_FUNCTIONS_BASE_URL" "$PRODUCTION_ID_TOKEN"

echo ""
echo "PASS: staging and production calendar auth smoke checks completed."
