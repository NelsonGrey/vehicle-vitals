#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/smoke-r1-mobile-acceptance-template.sh

Optional environment variables:
  EVIDENCE_DIR           Directory for evidence output (default: artifacts/smoke)
  ACCEPTANCE_FILE        Explicit acceptance file path
  BACKEND_TRAFFIC_FILE   Explicit backend traffic file path

What this script does:
  Generates timestamped templates for:
  - mobile acceptance execution notes
  - backend traffic validation notes
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

EVIDENCE_DIR="${EVIDENCE_DIR:-artifacts/smoke}"
ACCEPTANCE_FILE="${ACCEPTANCE_FILE:-}"
BACKEND_TRAFFIC_FILE="${BACKEND_TRAFFIC_FILE:-}"

timestamp() {
  date -u +%Y%m%dT%H%M%SZ
}

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

cat > "$ACCEPTANCE_FILE" <<EOF
R1 Mobile Acceptance Log
Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

Checklist:
[ ] Auth sign-in or sign-up
[ ] Add vehicle
[ ] Maintenance CRUD
[ ] Reminder actions
[ ] Export flow

Result Summary:
- Status: TODO (Pass/Fail)
- Tester: TODO
- Device/Simulator: TODO
- Notes: TODO
EOF

cat > "$BACKEND_TRAFFIC_FILE" <<EOF
R1 Mobile Backend Traffic Log
Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

Capture points:
- Firestore writes observed: TODO
- Functions invocations observed: TODO
- Auth events observed: TODO

Result Summary:
- Status: TODO (Pass/Fail)
- Reviewer: TODO
- Notes: TODO
EOF

echo "Created acceptance template: $ACCEPTANCE_FILE"
echo "Created backend traffic template: $BACKEND_TRAFFIC_FILE"
