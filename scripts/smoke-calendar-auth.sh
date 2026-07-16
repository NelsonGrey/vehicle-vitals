#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  FUNCTIONS_BASE_URL=https://us-central1-<project>.cloudfunctions.net \
  ID_TOKEN=<firebase-id-token> \
  ./scripts/smoke-calendar-auth.sh

Required environment variables:
  FUNCTIONS_BASE_URL   Base URL for Functions (no trailing slash required)
  ID_TOKEN             Firebase Auth ID token for a signed-in user

Optional environment variables:
  EXPECT_AUTH_REQUIRED   true|false (default: true)
  VEHICLE_VIN            17-char VIN (default: 1HGCM82633A123456)
  CALENDAR_TARGET        google|apple|ics (default: ics)
  TITLE                  Event title (default: Calendar Auth Smoke Test)
  DESCRIPTION            Event description (default: Smoke test event)
  START_AT               ISO timestamp for start (default: now + 1 day, UTC)
  END_AT                 ISO timestamp for end (default: start + 1 hour, UTC)

What this verifies:
  1) Anonymous HTTP request behavior when auth is required.
  2) Authenticated HTTP request is accepted by auth guard (not 401).

Notes:
  - This script validates HTTP fallback auth behavior for createCalendarEvent.
  - A non-401 authenticated result can still be 503/501 if feature/provider flags
    are disabled in the target environment.
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: required command not found: $1" >&2
    exit 1
  }
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_cmd curl
require_cmd date

FUNCTIONS_BASE_URL="${FUNCTIONS_BASE_URL:-}"
ID_TOKEN="${ID_TOKEN:-}"
EXPECT_AUTH_REQUIRED="${EXPECT_AUTH_REQUIRED:-true}"
VEHICLE_VIN="${VEHICLE_VIN:-1HGCM82633A123456}"
CALENDAR_TARGET="${CALENDAR_TARGET:-ics}"
TITLE="${TITLE:-Calendar Auth Smoke Test}"
DESCRIPTION="${DESCRIPTION:-Smoke test event}"

if [[ -z "$FUNCTIONS_BASE_URL" ]]; then
  echo "ERROR: FUNCTIONS_BASE_URL is required" >&2
  usage
  exit 1
fi

if [[ -z "$ID_TOKEN" ]]; then
  echo "ERROR: ID_TOKEN is required" >&2
  usage
  exit 1
fi

if [[ ${#VEHICLE_VIN} -ne 17 ]]; then
  echo "ERROR: VEHICLE_VIN must be 17 characters" >&2
  exit 1
fi

START_AT="${START_AT:-$(date -u -v+1d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+1 day' +%Y-%m-%dT%H:%M:%SZ)}"
END_AT="${END_AT:-$(date -u -j -f %Y-%m-%dT%H:%M:%SZ "$START_AT" -v+1H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "$START_AT + 1 hour" +%Y-%m-%dT%H:%M:%SZ)}"

BASE="${FUNCTIONS_BASE_URL%/}"
URL="$BASE/createCalendarEvent"

payload=$(cat <<JSON
{
  "vehicleVin": "$VEHICLE_VIN",
  "title": "$TITLE",
  "description": "$DESCRIPTION",
  "startAt": "$START_AT",
  "endAt": "$END_AT",
  "target": "$CALENDAR_TARGET"
}
JSON
)

tmp1=$(mktemp)
tmp2=$(mktemp)
trap 'rm -f "$tmp1" "$tmp2"' EXIT

echo "[1/2] Anonymous request -> $URL"
status_anon=$(curl -sS -o "$tmp1" -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -X POST "$URL" \
  -d "$payload")

echo "Anonymous status: $status_anon"
echo "Anonymous body:"
cat "$tmp1"
echo

if [[ "$EXPECT_AUTH_REQUIRED" == "true" ]]; then
  if [[ "$status_anon" != "401" ]]; then
    echo "FAIL: expected anonymous status 401 when EXPECT_AUTH_REQUIRED=true" >&2
    exit 1
  fi
else
  if [[ "$status_anon" == "401" ]]; then
    echo "FAIL: expected anonymous status not to be 401 when EXPECT_AUTH_REQUIRED=false" >&2
    exit 1
  fi
fi

echo "[2/2] Authenticated request -> $URL"
status_auth=$(curl -sS -o "$tmp2" -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -X POST "$URL" \
  -d "$payload")

echo "Authenticated status: $status_auth"
echo "Authenticated body:"
cat "$tmp2"
echo

if [[ "$status_auth" == "401" ]]; then
  echo "FAIL: authenticated request returned 401 (token invalid or auth guard rejected token)" >&2
  exit 1
fi

echo "PASS: HTTP auth behavior validated for createCalendarEvent (anonymous/authenticated guard checks)."
