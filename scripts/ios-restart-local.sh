#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE_DIR="$REPO_ROOT/packages/mobile"
DEVICE_ID="${VV_IOS_DEVICE_ID:-00008020-00060DAE0C69002E}"
FIREBASE_ENV="${VV_FIREBASE_ENV:-production}"
RUN_MODE="${VV_IOS_RUN_MODE:-debug}"
LOCK_DIR="${TMPDIR:-/tmp}/vehicle-vitals-ios-run-${DEVICE_ID}.lock"
LOCK_PID_FILE="$LOCK_DIR/pid"

acquire_lock() {
	if mkdir "$LOCK_DIR" 2>/dev/null; then
		echo "$$" > "$LOCK_PID_FILE"
		return 0
	fi

	local existing_pid=""
	if [[ -f "$LOCK_PID_FILE" ]]; then
		existing_pid="$(cat "$LOCK_PID_FILE" 2>/dev/null || true)"
	fi

	if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
		echo "Another iOS launch is already in progress for device $DEVICE_ID (pid $existing_pid)."
		echo "Run ./scripts/ios-stop-local.sh first, then retry."
		exit 1
	fi

	# Stale lock recovery.
	rm -rf "$LOCK_DIR"
	mkdir "$LOCK_DIR"
	echo "$$" > "$LOCK_PID_FILE"
}

release_lock() {
	rm -rf "$LOCK_DIR" 2>/dev/null || true
}

acquire_lock
trap release_lock EXIT INT TERM

"$REPO_ROOT/scripts/ios-stop-local.sh"

cd "$MOBILE_DIR"

mode_arg=""
case "$RUN_MODE" in
	debug)
		mode_arg=""
		;;
	profile)
		mode_arg="--profile"
		;;
	release)
		mode_arg="--release"
		;;
	*)
		echo "Unsupported VV_IOS_RUN_MODE: $RUN_MODE (use debug|profile|release)"
		exit 1
		;;
esac

if [[ -n "$mode_arg" ]]; then
	exec flutter run "$mode_arg" -d "$DEVICE_ID" --dart-define=VV_FIREBASE_ENV="$FIREBASE_ENV"
else
	exec flutter run -d "$DEVICE_ID" --dart-define=VV_FIREBASE_ENV="$FIREBASE_ENV"
fi
