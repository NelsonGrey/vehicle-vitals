#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/smoke-r1-mobile-acceptance-capture.sh

Purpose:
  Capture auditable R1 Gate 2 mobile acceptance and backend evidence after a
  real device or simulator run. This script does not automate app interaction.
  It records operator observations and marks the gate PASS only when every
  required acceptance and backend proof field is explicitly passing.

Optional environment variables:
  EVIDENCE_DIR                 Directory for evidence output (default: artifacts/smoke)
  ACCEPTANCE_FILE              Explicit acceptance file path
  BACKEND_TRAFFIC_FILE         Explicit backend traffic file path
  DEVICE_NAME                  Device/simulator name (default: HADES)
  TESTER                       Acceptance tester name (default: TODO)
  REVIEWER                     Backend reviewer name (default: TODO)
  BUILD_EVIDENCE               Build evidence path
  LAUNCH_EVIDENCE              Launch evidence path
  FIREBASE_PROJECT             Firebase project observed
  ACCEPTANCE_NOTES             Free-form acceptance notes
  BACKEND_NOTES                Free-form backend notes
  SCREENSHOT_EVIDENCE          Screenshot/recording artifact paths or links
  FUNCTIONS_LOG_REF            Functions log reference or link
  FIRESTORE_EVIDENCE_REF       Firestore evidence reference or link
  AUTH_EVENT_REF               Auth event evidence reference or link

Required PASS fields:
  AUTH_RESULT                  PASS when auth sign-in/sign-up was verified
  VEHICLE_CRUD_RESULT          PASS when vehicle create/edit/list/delete was verified
  MAINTENANCE_CRUD_RESULT      PASS when maintenance create/edit/list/delete was verified
  REMINDER_ACTIONS_RESULT      PASS when reminder actions were verified
  EXPORT_RESULT                PASS when export generated and was readable
  FIRESTORE_WRITES_OBSERVED    YES/PASS when Firestore writes were observed
  FUNCTIONS_INVOCATIONS_OBSERVED YES/PASS when Functions invocations were observed
  AUTH_EVENTS_OBSERVED         YES/PASS when Auth events were observed

Optional control:
  REQUIRE_PASS=1               Exit non-zero if any required field is not PASS/YES

Accepted positive values: PASS, YES, TRUE, 1.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

timestamp() {
  date -u +%Y%m%dT%H%M%SZ
}

iso_timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

positive() {
  case "${1:-}" in
    PASS|pass|Pass|YES|yes|Yes|TRUE|true|True|1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

status_label() {
  if positive "${1:-}"; then
    printf 'PASS'
  else
    printf 'BLOCKED'
  fi
}

EVIDENCE_DIR="${EVIDENCE_DIR:-artifacts/smoke}"
ACCEPTANCE_FILE="${ACCEPTANCE_FILE:-}"
BACKEND_TRAFFIC_FILE="${BACKEND_TRAFFIC_FILE:-}"
DEVICE_NAME="${DEVICE_NAME:-HADES}"
TESTER="${TESTER:-TODO}"
REVIEWER="${REVIEWER:-TODO}"
BUILD_EVIDENCE="${BUILD_EVIDENCE:-artifacts/smoke/r1-mobile-build-20260615T154819Z.log}"
LAUNCH_EVIDENCE="${LAUNCH_EVIDENCE:-artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log}"
FIREBASE_PROJECT="${FIREBASE_PROJECT:-TODO}"
ACCEPTANCE_NOTES="${ACCEPTANCE_NOTES:-TODO}"
BACKEND_NOTES="${BACKEND_NOTES:-TODO}"
SCREENSHOT_EVIDENCE="${SCREENSHOT_EVIDENCE:-TODO}"
FUNCTIONS_LOG_REF="${FUNCTIONS_LOG_REF:-TODO}"
FIRESTORE_EVIDENCE_REF="${FIRESTORE_EVIDENCE_REF:-TODO}"
AUTH_EVENT_REF="${AUTH_EVENT_REF:-TODO}"
REQUIRE_PASS="${REQUIRE_PASS:-0}"

AUTH_RESULT="${AUTH_RESULT:-}"
VEHICLE_CRUD_RESULT="${VEHICLE_CRUD_RESULT:-}"
MAINTENANCE_CRUD_RESULT="${MAINTENANCE_CRUD_RESULT:-}"
REMINDER_ACTIONS_RESULT="${REMINDER_ACTIONS_RESULT:-}"
EXPORT_RESULT="${EXPORT_RESULT:-}"
FIRESTORE_WRITES_OBSERVED="${FIRESTORE_WRITES_OBSERVED:-}"
FUNCTIONS_INVOCATIONS_OBSERVED="${FUNCTIONS_INVOCATIONS_OBSERVED:-}"
AUTH_EVENTS_OBSERVED="${AUTH_EVENTS_OBSERVED:-}"

stamp="$(timestamp)"
mkdir -p "$EVIDENCE_DIR"

if [[ -z "$ACCEPTANCE_FILE" ]]; then
  ACCEPTANCE_FILE="$EVIDENCE_DIR/r1-mobile-acceptance-$stamp.log"
else
  mkdir -p "$(dirname "$ACCEPTANCE_FILE")"
fi

if [[ -z "$BACKEND_TRAFFIC_FILE" ]]; then
  BACKEND_TRAFFIC_FILE="$EVIDENCE_DIR/r1-mobile-backend-traffic-$stamp.log"
else
  mkdir -p "$(dirname "$BACKEND_TRAFFIC_FILE")"
fi

acceptance_pass=1
for value in \
  "$AUTH_RESULT" \
  "$VEHICLE_CRUD_RESULT" \
  "$MAINTENANCE_CRUD_RESULT" \
  "$REMINDER_ACTIONS_RESULT" \
  "$EXPORT_RESULT"; do
  if ! positive "$value"; then
    acceptance_pass=0
  fi
done

backend_pass=1
for value in \
  "$FIRESTORE_WRITES_OBSERVED" \
  "$FUNCTIONS_INVOCATIONS_OBSERVED" \
  "$AUTH_EVENTS_OBSERVED"; do
  if ! positive "$value"; then
    backend_pass=0
  fi
done

overall_status="BLOCKED"
if [[ "$acceptance_pass" -eq 1 && "$backend_pass" -eq 1 ]]; then
  overall_status="PASS"
fi

cat > "$ACCEPTANCE_FILE" <<EOF
R1 Mobile Acceptance Log
Generated: $(iso_timestamp)

Build Evidence: $BUILD_EVIDENCE
Launch Evidence: $LAUNCH_EVIDENCE
Device/Simulator: $DEVICE_NAME

Checklist:
[$(status_label "$AUTH_RESULT")] Auth sign-in or sign-up
[$(status_label "$VEHICLE_CRUD_RESULT")] Vehicle create/edit/list/delete
[$(status_label "$MAINTENANCE_CRUD_RESULT")] Maintenance create/edit/list/delete
[$(status_label "$REMINDER_ACTIONS_RESULT")] Reminder actions
[$(status_label "$EXPORT_RESULT")] Export flow generates readable output

Visual Evidence:
- Screenshots/recordings: $SCREENSHOT_EVIDENCE

Result Summary:
- Status: $overall_status
- Tester: $TESTER
- Notes: $ACCEPTANCE_NOTES
EOF

cat > "$BACKEND_TRAFFIC_FILE" <<EOF
R1 Mobile Backend Traffic Log
Generated: $(iso_timestamp)

Firebase Project: $FIREBASE_PROJECT

Capture points:
- Firestore writes observed: $(status_label "$FIRESTORE_WRITES_OBSERVED")
- Functions invocations observed: $(status_label "$FUNCTIONS_INVOCATIONS_OBSERVED")
- Auth events observed: $(status_label "$AUTH_EVENTS_OBSERVED")

Evidence references:
- Firestore evidence: $FIRESTORE_EVIDENCE_REF
- Functions logs: $FUNCTIONS_LOG_REF
- Auth events: $AUTH_EVENT_REF

Result Summary:
- Status: $overall_status
- Reviewer: $REVIEWER
- Notes: $BACKEND_NOTES
EOF

echo "Created acceptance evidence: $ACCEPTANCE_FILE"
echo "Created backend traffic evidence: $BACKEND_TRAFFIC_FILE"
echo "Gate 2 capture status: $overall_status"

if [[ "$overall_status" != "PASS" && "$REQUIRE_PASS" == "1" ]]; then
  echo "FAIL: Gate 2 capture is not PASS. Complete all required acceptance and backend proof fields." >&2
  exit 1
fi
