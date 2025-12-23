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
  # Clean up both the legacy randomized keychains and the fixed-name keychain.
  for fixed in "$HOME/Library/Keychains/fastlane_tmp_keychain.keychain-db" \
              "$HOME/Library/Keychains/fastlane_tmp_keychain-db" \
              "$HOME/Library/Keychains/fastlane_tmp_keychain" \
              "$HOME/Library/Keychains/fastlane_tmp_keychain.keychain"; do
    if [ -f "$fixed" ]; then
      security delete-keychain "$fixed" 2>/dev/null || true
    fi
  done

  if security list-keychains -d user 2>/dev/null | grep -q "fastlane_tmp_"; then
    security list-keychains -d user 2>/dev/null | grep "fastlane_tmp_" | while read -r kc; do
      kc_path=$(echo "$kc" | tr -d '"' | xargs)
      if [ -n "$kc_path" ] && [[ "$kc_path" == *fastlane_tmp_* ]]; then
        security delete-keychain "$kc_path" 2>/dev/null || true
      fi
    done
  fi
fi

KC_BASENAME="fastlane_tmp_keychain"
KC_NAME="$KC_BASENAME.keychain-db"
KC_PATH="$HOME/Library/Keychains/$KC_NAME"

# NOTE: Avoid using a `tr </dev/urandom | head` pipeline here.
# On some macOS runner setups, `tr` can get stuck and never terminates,
# which stalls the entire GitHub Actions job.
# Use MATCH_PASSWORD as the keychain password when available, because Fastlane
# is configured to reference it as the keychain_password.
KC_PASS="${MATCH_PASSWORD:-}"
if [ -z "${KC_PASS}" ]; then
  if command -v python3 >/dev/null 2>&1; then
    KC_PASS=$(python3 - <<'PY'
import secrets
import string

alphabet = string.ascii_letters + string.digits
print(''.join(secrets.choice(alphabet) for _ in range(24)))
PY
)
  else
    KC_PASS=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24 || echo "fastlane-pass")
  fi
fi

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
  if [ -n "$trimmed" ] && [ -f "$trimmed" ]; then
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
    security delete-keychain "$KC_PATH" 2>/dev/null || true
    rm -f "$KC_PATH" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[ephemeral-keychain] Configuring temporary keychain"
# NOTE: We temporarily set the ephemeral keychain as the default during the
# Fastlane run. When Fastlane needs to generate a new certificate (e.g., after
# match_nuke), the private key generation can otherwise land in the login
# keychain, leaving the certificate in the ephemeral keychain without its
# matching private key ("no local code signing identities found").
security unlock-keychain -p "$KC_PASS" "$KC_PATH" 2>/dev/null
security set-keychain-settings -lut 7200 "$KC_PATH" 2>/dev/null

# Ensure the temporary keychain is in the search list so tools like
# `security find-identity` and `codesign` can locate identities/keys.
# IMPORTANT: In CI, avoid adding the entire ~/Library/Keychains directory to the
# search list (it can cause `match` to decide items are already installed and
# skip importing into the ephemeral keychain). However, keep the user's default
# keychain (usually login.keychain-db) available so trust/intermediate certs
# (e.g., WWDR) installed there are visible during identity validation.
KEYCHAIN_ARGS=("$KC_PATH")
if [ -n "${ORIG_DEFAULT_KC:-}" ] && [ -f "$ORIG_DEFAULT_KC" ] && [ "$ORIG_DEFAULT_KC" != "$KC_PATH" ]; then
  KEYCHAIN_ARGS+=("$ORIG_DEFAULT_KC")
fi
security list-keychains -d user -s "${KEYCHAIN_ARGS[@]}" 2>/dev/null || true

# Set ephemeral as default just for this script's lifetime (restored in cleanup).
# This MUST succeed, otherwise `match` can generate the private key in the login
# keychain while importing the certificate into the ephemeral keychain, which
# results in "0 valid identities".
if ! security default-keychain -d user -s "$KC_PATH" 2>/dev/null; then
  echo "[ephemeral-keychain] ERROR: Failed to set default keychain to $KC_PATH"
  exit 4
fi

DEFAULT_KC_NOW=$(security default-keychain -d user 2>/dev/null | tr -d '"' | xargs || true)
if [ -n "$DEFAULT_KC_NOW" ] && [ "$DEFAULT_KC_NOW" != "$KC_PATH" ]; then
  echo "[ephemeral-keychain] ERROR: Default keychain did not switch to ephemeral"
  echo "[ephemeral-keychain] Expected: $KC_PATH"
  echo "[ephemeral-keychain] Actual:   $DEFAULT_KC_NOW"
  exit 4
fi

echo "[ephemeral-keychain] Keychain preflight"
security default-keychain -d user 2>/dev/null || true
security list-keychains -d user 2>/dev/null || true
security show-keychain-info "$KC_PATH" 2>/dev/null || true

if [ -n "${CERT_P12_PATH:-}" ]; then
  if [ ! -f "$CERT_P12_PATH" ]; then
    echo "[ephemeral-keychain] ERROR: CERT_P12_PATH set but file not found: $CERT_P12_PATH"
    exit 3
  fi

  echo "[ephemeral-keychain] Importing certificate into temporary keychain"
  security import "$CERT_P12_PATH" -k "$KC_PATH" -P "${CERT_P12_PASSWORD:-}" -T /usr/bin/codesign -T /usr/bin/security 2>/dev/null || true
  security set-key-partition-list -S apple-tool:,apple: -s -k "$KC_PASS" "$KC_PATH" 2>/dev/null || true
fi

export MATCH_KEYCHAIN_NAME="$KC_PATH"
export MATCH_KEYCHAIN_PASSWORD="$KC_PASS"
export MATCH_KEYCHAIN_PATH="$KC_PATH"

if [ -n "${GITHUB_ENV:-}" ] && [ -w "$GITHUB_ENV" ]; then
  echo "MATCH_KEYCHAIN_NAME=$KC_PATH" >> "$GITHUB_ENV"
  echo "MATCH_KEYCHAIN_PASSWORD=$KC_PASS" >> "$GITHUB_ENV"
  echo "MATCH_KEYCHAIN_PATH=$KC_PATH" >> "$GITHUB_ENV"
fi

echo "[ephemeral-keychain] Running command: $FASTLANE_CMD"
set -x
set +e
eval "$FASTLANE_CMD"
CMD_STATUS=$?
set -e
set +x

if [ "${CMD_STATUS:-1}" -ne 0 ]; then
  echo "[ephemeral-keychain] Command failed (exit ${CMD_STATUS}); collecting keychain diagnostics"
  security find-identity -v -p codesigning "$KC_PATH" 2>/dev/null || true
  security find-certificate -a -c "Apple Distribution" -Z "$KC_PATH" 2>/dev/null || true
  security find-certificate -a -c "Apple Worldwide Developer Relations" -Z "$KC_PATH" 2>/dev/null || true
fi

echo "[ephemeral-keychain] Command finished; cleanup via EXIT trap"

exit "$CMD_STATUS"
