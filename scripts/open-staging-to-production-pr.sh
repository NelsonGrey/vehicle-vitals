#!/usr/bin/env bash
set -euo pipefail

# Guided helper for staging -> production promotion PRs.
# Default mode is dry-run. Use --create-pr to actually open the PR.

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

CREATE_PR=0
if [[ "${1:-}" == "--create-pr" ]]; then
  CREATE_PR=1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required"
  exit 1
fi

if [[ ! -x scripts/staging-production-readiness-report.sh ]]; then
  chmod +x scripts/staging-production-readiness-report.sh
fi

# Always refresh readiness data first.
bash scripts/staging-production-readiness-report.sh >/dev/null

LATEST_REPORT="$(ls -1t artifacts/release/staging-to-production-readiness-*.md 2>/dev/null | head -n1 || true)"
if [[ -z "$LATEST_REPORT" ]]; then
  echo "Unable to find readiness report under artifacts/release/."
  exit 1
fi

DECISION_LINE="$(grep -E '^- Result: \*\*' "$LATEST_REPORT" || true)"
if [[ -z "$DECISION_LINE" ]]; then
  echo "Could not parse promotion decision from $LATEST_REPORT"
  exit 1
fi

if echo "$DECISION_LINE" | grep -q '\*\*NO-GO\*\*'; then
  echo "Promotion blocked by readiness report: $LATEST_REPORT"
  echo "$DECISION_LINE"
  echo "Resolve blockers before creating PR."
  exit 1
fi

if ! echo "$DECISION_LINE" | grep -q '\*\*GO\*\*'; then
  echo "Unexpected decision format in readiness report: $DECISION_LINE"
  exit 1
fi

# Build PR message content.
TS="$(date -u +%Y%m%dT%H%M%SZ)"
BODY_FILE="artifacts/release/staging-to-production-pr-body-${TS}.md"
PRODUCTION_BRANCH="${PRODUCTION_BRANCH:-main}"

STAGING_SHA="$(git rev-parse origin/staging)"
PROD_SHA="$(git rev-parse "origin/${PRODUCTION_BRANCH}" 2>/dev/null || echo unknown)"

{
  echo "## Summary"
  echo
  echo "Promote validated staging changes to production."
  echo
  echo "## Readiness Source"
  echo
  echo "- Report: ${LATEST_REPORT}"
  echo "- Decision: GO"
  echo
  echo "## Branch State"
  echo
  echo "- staging: ${STAGING_SHA}"
  echo "- ${PRODUCTION_BRANCH}: ${PROD_SHA}"
  echo
  echo "## Included Commits (${PRODUCTION_BRANCH}..staging)"
  echo
  echo '```text'
  git log --oneline "origin/${PRODUCTION_BRANCH}..origin/staging" | head -n 80 || true
  echo '```'
  echo
  echo "## Changed Files (${PRODUCTION_BRANCH}...staging)"
  echo
  echo '```text'
  git diff --name-only "origin/${PRODUCTION_BRANCH}...origin/staging" | head -n 200 || true
  echo '```'
  echo
  echo "## Notes"
  echo
  echo "- Setup/config and code promotion only."
  echo "- No live environment data migration."
} > "$BODY_FILE"

echo "Prepared PR body: $BODY_FILE"

author_open_pr() {
  gh pr create \
    --base "$PRODUCTION_BRANCH" \
    --head staging \
    --title "Promote staging to ${PRODUCTION_BRANCH} (${TS})" \
    --body-file "$BODY_FILE"
}

if [[ $CREATE_PR -eq 1 ]]; then
  echo "Creating PR from staging -> production..."
  author_open_pr
else
  echo "Dry-run complete."
  echo "To create PR now, run:"
  echo "  bash scripts/open-staging-to-production-pr.sh --create-pr"
fi
