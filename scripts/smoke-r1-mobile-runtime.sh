#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/smoke-r1-mobile-runtime.sh

Optional environment variables:
  EVIDENCE_DIR         Directory for evidence files (default: artifacts/smoke)
  EVIDENCE_LOG_FILE    Explicit log path (overrides EVIDENCE_DIR)
  MOBILE_DIR           Mobile package directory (default: packages/mobile)
  SKIP_ANALYZE         Set to 1 to skip flutter analyze
  SKIP_BUILD           Set to 1 to skip flutter build ios
  BUILD_DEVICE_ONLY    Set to 1 to add --config-only for build planning only

What this script does:
  1) Runs flutter analyze (unless skipped)
  2) Runs flutter build ios --release --no-codesign (unless skipped)
  3) Writes timestamped evidence logs under artifacts/smoke
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
require_cmd flutter

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="${EVIDENCE_DIR:-$ROOT_DIR/artifacts/smoke}"
EVIDENCE_LOG_FILE="${EVIDENCE_LOG_FILE:-}"
MOBILE_DIR="${MOBILE_DIR:-$ROOT_DIR/packages/mobile}"
SKIP_ANALYZE="${SKIP_ANALYZE:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
BUILD_DEVICE_ONLY="${BUILD_DEVICE_ONLY:-0}"

timestamp() {
  date -u +%Y%m%dT%H%M%SZ
}

if [[ -z "$EVIDENCE_LOG_FILE" ]]; then
  mkdir -p "$EVIDENCE_DIR"
  EVIDENCE_LOG_FILE="$EVIDENCE_DIR/r1-mobile-build-$(timestamp).log"
else
  mkdir -p "$(dirname "$EVIDENCE_LOG_FILE")"
fi

exec > >(tee -a "$EVIDENCE_LOG_FILE") 2>&1

echo "Evidence log: $EVIDENCE_LOG_FILE"
echo "Root dir: $ROOT_DIR"
echo "Mobile dir: $MOBILE_DIR"

if [[ ! -d "$MOBILE_DIR" ]]; then
  echo "ERROR: mobile directory not found: $MOBILE_DIR" >&2
  exit 1
fi

(
  cd "$MOBILE_DIR"

  if [[ "$SKIP_ANALYZE" != "1" ]]; then
    echo "[Step 1/2] Running flutter analyze"
    flutter analyze
    echo "[Step 1/2] Completed"
  else
    echo "[Step 1/2] Skipped flutter analyze"
  fi

  if [[ "$SKIP_BUILD" != "1" ]]; then
    echo "[Step 2/2] Running flutter build ios --release --no-codesign"

    build_args=(build ios --release --no-codesign)
    if [[ "$BUILD_DEVICE_ONLY" == "1" ]]; then
      build_args+=(--config-only)
      echo "Using --config-only mode"
    fi

    flutter "${build_args[@]}"
    echo "[Step 2/2] Completed"
  else
    echo "[Step 2/2] Skipped flutter build ios"
  fi
)

echo "PASS: R1 mobile runtime smoke run completed"
