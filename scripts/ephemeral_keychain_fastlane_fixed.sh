#!/usr/bin/env bash
set -euo pipefail

################################################################################
# Ephemeral keychain helper for Fastlane (robust version)
# - Creates a temporary keychain
# - Optionally imports a P12 into that keychain
# - Sets MATCH_KEYCHAIN_NAME and MATCH_KEYCHAIN_PASSWORD env exports for Fastlane
# - Runs the provided command string
# - Restores the original keychain and deletes the temporary keychain on exit
################################################################################

if [ "$#" -lt 1 ]; then
  echo "Usage: CERT_P12_PATH=path CERT_P12_PASSWORD=pw $0 \"fastlane command\""
  exit 2
fi

FASTLANE_CMD="$1"

# If not in CI, run directly (avoids surprising local keychain changes)
if [ -z "${CI:-}" ] && [ -z "${GITHUB_ACTIONS:-}" ]; then
  echo "[ephemeral-keychain] Not running in CI; executing command directly"
  set -x
  eval "$FASTLANE_CMD"
  set +x
  exit 0
fi

echo "[ephemeral-keychain] Running in CI; using ephemeral keychain"

# Best-effort cleanup of leftover ephemeral keychains from previous runs
if command -v security >/dev/null 2>&1; then
  if security list-keychains -d user 2>/dev/null | grep -q "fastlane_tmp_"; then
    security list-keychains -d user 2>/dev/null | grep "fastlane_tmp_" | while read -r kc; do
      kc_path=$(echo "$kc" | tr -d '"' | xargs)
      if [ -n "$kc_path" ] && [[ "$kc_path" == *fastlane_tmp_* ]]; then
        security delete-keychain "$kc_path" 2>/dev/null || true
      fi
    done
  fi
fi

KC_NAME="fastlane_tmp_$(date +%s)_$$.keychain-db"
KC_PATH="$HOME/Library/Keychains/$KC_NAME"
KC_PASS=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24 || echo "fastlane-pass")

echo "[ephemeral-keychain] Creating temporary keychain: $KC_NAME"
security create-keychain -p "$KC_PASS" "$KC_PATH"

ORIG_DEFAULT_KC=$(security default-keychain -d user 2>/dev/null | tr -d '"' | xargs || true)
if [ -z "${ORIG_DEFAULT_KC:-}" ]; then
  echo "[ephemeral-keychain] WARNING: Unable to determine original default keychain"
fi

# Capture original keychain list so we can restore it
ORIG_KEYCHAIN_LIST=()
while IFS= read -r item; do
  trimmed=$(echo "$item" | tr -d '"' | xargs)
  if [ -n "$trimmed" ]; then
    ORIG_KEYCHAIN_LIST+=("$trimmed")
  fi
done < <(security list-keychains -d user 2>/dev/null || true)

cleanup() {
  set +e
  echo "[ephemeral-keychain] Cleaning up"

  if [ -n "${ORIG_DEFAULT_KC:-}" ] && [ -f "$ORIG_DEFAULT_KC" ]; then
    security default-keychain -s "$ORIG_DEFAULT_KC" 2>/dev/null || true
  fi

  if [ ${#ORIG_KEYCHAIN_LIST[@]} -gt 0 ]; then
    security list-keychains -d user -s "${ORIG_KEYCHAIN_LIST[@]}" 2>/dev/null || true
  fi

  if [ -n "${KC_PATH:-}" ] && [ -f "$KC_PATH" ] && [[ "$KC_PATH" != *login.keychain* ]]; then
    security delete-keychain "$KC_PATH" 2>/dev/null || rm -f "$KC_PATH" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[ephemeral-keychain] Configuring temporary keychain"
security default-keychain -s "$KC_PATH" 2>/dev/null || true
security unlock-keychain -p "$KC_PASS" "$KC_PATH" 2>/dev/null || true
security set-keychain-settings -lut 7200 "$KC_PATH" 2>/dev/null || true

if [ -n "${CERT_P12_PATH:-}" ]; then
  if [ ! -f "$CERT_P12_PATH" ]; then
    echo "[ephemeral-keychain] ERROR: CERT_P12_PATH set but file not found: $CERT_P12_PATH"
    exit 3
  fi

  echo "[ephemeral-keychain] Importing certificate into temporary keychain"
  security import "$CERT_P12_PATH" -k "$KC_PATH" -P "${CERT_P12_PASSWORD:-}" -T /usr/bin/codesign -T /usr/bin/security 2>/dev/null || true
  security set-key-partition-list -S apple-tool:,apple: -s -k "$KC_PASS" "$KC_PATH" 2>/dev/null || true
fi

export MATCH_KEYCHAIN_NAME="$KC_NAME"
export MATCH_KEYCHAIN_PASSWORD="$KC_PASS"

if [ -n "${GITHUB_ENV:-}" ] && [ -w "$GITHUB_ENV" ]; then
  echo "MATCH_KEYCHAIN_NAME=$KC_NAME" >> "$GITHUB_ENV"
  echo "MATCH_KEYCHAIN_PASSWORD=$KC_PASS" >> "$GITHUB_ENV"
  echo "MATCH_KEYCHAIN_PATH=$KC_PATH" >> "$GITHUB_ENV"
fi

echo "[ephemeral-keychain] Running command: $FASTLANE_CMD"
set -x
eval "$FASTLANE_CMD"
set +x

echo "[ephemeral-keychain] Command finished; cleanup via EXIT trap"

exit 0
