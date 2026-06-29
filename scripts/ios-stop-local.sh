#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE_DIR="$REPO_ROOT/packages/mobile"
WORKSPACE_PATH="$MOBILE_DIR/ios/Runner.xcworkspace"
DEVICE_ID="${VV_IOS_DEVICE_ID:-00008020-00060DAE0C69002E}"

kill_matching_pids() {
  local pattern="$1"
  local pids
  pids="$(pgrep -f "$pattern" || true)"
  if [[ -n "$pids" ]]; then
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      kill "$pid" 2>/dev/null || true
    done <<< "$pids"
  fi
}

# Kill only flutter runs launched from this repo/mobile workspace.
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  pid="${line%% *}"
  cmd="${line#* }"
  if [[ "$cmd" == *"$MOBILE_DIR"* ]] && [[ "$cmd" == *"flutter run"* ]]; then
    kill "$pid" 2>/dev/null || true
  fi
done < <(pgrep -fal "flutter run" || true)

# Kill xcodebuild jobs tied to this workspace or this exact device UDID.
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  pid="${line%% *}"
  cmd="${line#* }"
  if [[ "$cmd" == *"$WORKSPACE_PATH"* ]] || [[ "$cmd" == *"destination id=$DEVICE_ID"* ]]; then
    kill "$pid" 2>/dev/null || true
  fi
done < <(pgrep -fal "xcodebuild" || true)

# Give processes a moment, then force kill stragglers in this workspace only.
sleep 1
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  pid="${line%% *}"
  cmd="${line#* }"
  if [[ "$cmd" == *"$MOBILE_DIR"* ]] && [[ "$cmd" == *"flutter run"* ]]; then
    kill -9 "$pid" 2>/dev/null || true
  fi
done < <(pgrep -fal "flutter run" || true)

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  pid="${line%% *}"
  cmd="${line#* }"
  if [[ "$cmd" == *"$WORKSPACE_PATH"* ]] || [[ "$cmd" == *"destination id=$DEVICE_ID"* ]]; then
    kill -9 "$pid" 2>/dev/null || true
  fi
done < <(pgrep -fal "xcodebuild" || true)

echo "Stopped local iOS flutter/xcodebuild processes for $MOBILE_DIR (device $DEVICE_ID)."
