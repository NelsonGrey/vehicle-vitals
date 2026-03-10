#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  FIREBASE_API_KEY=<web-api-key> \
  FIREBASE_EMAIL=<user-email> \
  FIREBASE_PASSWORD=<user-password> \
  ./scripts/generate-firebase-id-token.sh

Required environment variables:
  FIREBASE_API_KEY   Firebase Web API key for the target project
  FIREBASE_EMAIL     Test user email
  FIREBASE_PASSWORD  Test user password

Optional environment variables:
  OUTPUT_FORMAT      raw|export (default: raw)

Output:
  - raw: prints only the ID token
  - export: prints shell-ready line: ID_TOKEN=<token>
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

require_cmd curl
require_cmd sed

FIREBASE_API_KEY="${FIREBASE_API_KEY:-}"
FIREBASE_EMAIL="${FIREBASE_EMAIL:-}"
FIREBASE_PASSWORD="${FIREBASE_PASSWORD:-}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-raw}"

if [[ -z "$FIREBASE_API_KEY" || -z "$FIREBASE_EMAIL" || -z "$FIREBASE_PASSWORD" ]]; then
  echo "ERROR: FIREBASE_API_KEY, FIREBASE_EMAIL, and FIREBASE_PASSWORD are required" >&2
  usage
  exit 1
fi

URL="https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}"

payload=$(cat <<JSON
{
  "email": "$FIREBASE_EMAIL",
  "password": "$FIREBASE_PASSWORD",
  "returnSecureToken": true
}
JSON
)

response=$(curl -sS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$payload")

id_token=$(printf '%s' "$response" | sed -n 's/.*"idToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

if [[ -z "$id_token" ]]; then
  error_message=$(printf '%s' "$response" | sed -n 's/.*"message"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
  if [[ -z "$error_message" ]]; then
    error_message="Unable to parse idToken from Firebase response"
  fi
  echo "ERROR: failed to generate Firebase ID token: $error_message" >&2
  exit 1
fi

if [[ "$OUTPUT_FORMAT" == "export" ]]; then
  printf 'ID_TOKEN=%s\n' "$id_token"
else
  printf '%s\n' "$id_token"
fi
