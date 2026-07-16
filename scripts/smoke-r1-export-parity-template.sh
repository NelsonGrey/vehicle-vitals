#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/smoke-r1-export-parity-template.sh

Optional environment variables:
  EVIDENCE_DIR         Directory for report output (default: artifacts/smoke)
  REPORT_FILE          Explicit report file path
  FIXTURE_NAME         Shared fixture identifier (default: r1-shared-fixture)

What this does:
  Generates a timestamped markdown template for export parity signoff evidence.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

EVIDENCE_DIR="${EVIDENCE_DIR:-artifacts/smoke}"
REPORT_FILE="${REPORT_FILE:-}"
FIXTURE_NAME="${FIXTURE_NAME:-r1-shared-fixture}"

timestamp() {
  date -u +%Y%m%dT%H%M%SZ
}

if [[ -z "$REPORT_FILE" ]]; then
  mkdir -p "$EVIDENCE_DIR"
  REPORT_FILE="$EVIDENCE_DIR/r1-export-parity-report-$(timestamp).md"
else
  mkdir -p "$(dirname "$REPORT_FILE")"
fi

cat > "$REPORT_FILE" <<EOF
# R1 Export Parity Report

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Fixture: $FIXTURE_NAME

## Inputs

- Web CSV: artifacts/smoke/r1-export-web-csv-<timestamp>.csv
- Mobile CSV: artifacts/smoke/r1-export-mobile-csv-<timestamp>.csv
- Web PDF: artifacts/smoke/r1-export-web-pdf-<timestamp>.pdf
- Mobile PDF: artifacts/smoke/r1-export-mobile-pdf-<timestamp>.pdf

## CSV Comparison

- Field order parity: TODO
- Field coverage parity: TODO
- Value parity (sampled rows): TODO
- Differences accepted: TODO

## PDF Comparison

- Core section parity: TODO
- Required field parity: TODO
- Differences accepted: TODO

## Signoff

- QA owner: TODO
- Date: TODO
- Result: TODO (Pass/Fail)
- Notes: TODO
EOF

echo "Created parity report template: $REPORT_FILE"
