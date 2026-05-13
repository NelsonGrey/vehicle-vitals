#!/usr/bin/env bash
set -euo pipefail

# Generates a staging -> production promotion readiness report.
# Non-destructive: reads git/GitHub metadata only.

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required"
  exit 1
fi

mkdir -p artifacts/release
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="artifacts/release/staging-to-production-readiness-${TS}.md"

# Ensure fresh refs.
git fetch origin develop staging production >/dev/null 2>&1 || true

AHEAD_BEHIND="$(git rev-list --left-right --count origin/production...origin/staging 2>/dev/null || echo '0 0')"
PROD_AHEAD="$(echo "$AHEAD_BEHIND" | awk '{print $1}')"
STAGING_AHEAD="$(echo "$AHEAD_BEHIND" | awk '{print $2}')"

DEV_STAGING_COUNTS="$(git rev-list --left-right --count origin/staging...origin/develop 2>/dev/null || echo '0 0')"
STAGING_AHEAD_OF_DEV="$(echo "$DEV_STAGING_COUNTS" | awk '{print $1}')"
DEV_AHEAD_OF_STAGING="$(echo "$DEV_STAGING_COUNTS" | awk '{print $2}')"

LATEST_STAGING_RUN_ID="$(TERM=dumb GH_FORCE_TTY=0 GH_PAGER=cat gh api "repos/mnelson3/vehicle-vitals/actions/runs?branch=staging&per_page=1" --jq '.workflow_runs[0].id' 2>/dev/null || true)"
LATEST_STAGING_RUN_STATUS="$(TERM=dumb GH_FORCE_TTY=0 GH_PAGER=cat gh api "repos/mnelson3/vehicle-vitals/actions/runs?branch=staging&per_page=1" --jq '.workflow_runs[0].status' 2>/dev/null || true)"
LATEST_STAGING_RUN_CONCLUSION="$(TERM=dumb GH_FORCE_TTY=0 GH_PAGER=cat gh api "repos/mnelson3/vehicle-vitals/actions/runs?branch=staging&per_page=1" --jq '.workflow_runs[0].conclusion // ""' 2>/dev/null || true)"

if [[ -z "${LATEST_STAGING_RUN_ID:-}" || "${LATEST_STAGING_RUN_ID}" == "null" ]]; then
  LATEST_STAGING_RUN_ID=""
fi
if [[ -z "${LATEST_STAGING_RUN_STATUS:-}" || "${LATEST_STAGING_RUN_STATUS}" == "null" ]]; then
  LATEST_STAGING_RUN_STATUS="unknown"
fi
if [[ -z "${LATEST_STAGING_RUN_CONCLUSION:-}" || "${LATEST_STAGING_RUN_CONCLUSION}" == "null" ]]; then
  LATEST_STAGING_RUN_CONCLUSION="unknown"
fi

REQUIRED_PROD_SECRETS=(
  FIREBASE_TOKEN
  FIREBASE_PROJECT_PROD
  VITE_FIREBASE_API_KEY_PRODUCTION
  VITE_FIREBASE_AUTH_DOMAIN_PRODUCTION
  VITE_FIREBASE_PROJECT_ID_PRODUCTION
  VITE_FIREBASE_STORAGE_BUCKET_PRODUCTION
  VITE_FIREBASE_MESSAGING_SENDER_ID_PRODUCTION
  VITE_FIREBASE_APP_ID_PRODUCTION
)

SECRETS_QUERY_OK=1
ALL_SECRETS="$(gh secret list --limit 2000 2>/dev/null | awk '{print $1}')" || SECRETS_QUERY_OK=0
MISSING_SECRETS=()
if [[ $SECRETS_QUERY_OK -eq 1 ]]; then
  for s in "${REQUIRED_PROD_SECRETS[@]}"; do
    if ! echo "$ALL_SECRETS" | grep -qx "$s"; then
      MISSING_SECRETS+=("$s")
    fi
  done
fi

GO_NO_GO="GO"
REASONS=()

if [[ "${LATEST_STAGING_RUN_CONCLUSION:-}" != "success" ]]; then
  GO_NO_GO="NO-GO"
  REASONS+=("Latest staging workflow is not successful")
fi

if [[ $SECRETS_QUERY_OK -eq 0 ]]; then
  GO_NO_GO="NO-GO"
  REASONS+=("Unable to query repository secrets (insufficient gh permissions or auth)")
elif [[ ${#MISSING_SECRETS[@]} -gt 0 ]]; then
  GO_NO_GO="NO-GO"
  REASONS+=("Missing required production secret names")
fi

cat > "$OUT" <<EOF
# Staging -> Production Readiness Report

Generated (UTC): $(date -u)

## Branch Divergence

- production ahead of staging: ${PROD_AHEAD}
- staging ahead of production: ${STAGING_AHEAD}
- staging ahead of develop: ${STAGING_AHEAD_OF_DEV}
- develop ahead of staging: ${DEV_AHEAD_OF_STAGING}

## Latest Staging Workflow

- run id: ${LATEST_STAGING_RUN_ID:-unknown}
- status: ${LATEST_STAGING_RUN_STATUS:-unknown}
- conclusion: ${LATEST_STAGING_RUN_CONCLUSION:-unknown}

EOF

if [[ -n "${LATEST_STAGING_RUN_ID:-}" ]]; then
  echo "### Failed Jobs in Latest Staging Run" >> "$OUT"
  echo >> "$OUT"
  TERM=dumb GH_FORCE_TTY=0 GH_PAGER=cat gh api "repos/mnelson3/vehicle-vitals/actions/runs/${LATEST_STAGING_RUN_ID}/jobs" \
    --jq '.jobs[] | select(.conclusion=="failure") | "- \(.name) (id: \(.id))"' >> "$OUT" 2>/dev/null || true
  echo >> "$OUT"
fi

{
  echo "## Commit Delta (develop..staging)"
  echo
  echo '```text'
  git log --oneline origin/develop..origin/staging | head -n 30 || true
  echo '```'
  echo
  echo "## Commit Delta (staging..develop)"
  echo
  echo '```text'
  git log --oneline origin/staging..origin/develop | head -n 30 || true
  echo '```'
  echo
  echo "## Changed Files Summary (develop...staging)"
  echo
  echo '```text'
  git diff --name-only origin/develop...origin/staging | head -n 120 || true
  echo '```'
  echo
  echo "## Production Secret Name Presence"
  echo
  if [[ $SECRETS_QUERY_OK -eq 0 ]]; then
    echo "- Unable to query secrets via gh CLI in this environment."
  else
    for s in "${REQUIRED_PROD_SECRETS[@]}"; do
      if echo "$ALL_SECRETS" | grep -qx "$s"; then
        echo "- [x] $s"
      else
        echo "- [ ] $s"
      fi
    done
  fi
  echo
  echo "## Promotion Decision"
  echo
  echo "- Result: **${GO_NO_GO}**"
  if [[ ${#REASONS[@]} -gt 0 ]]; then
    echo "- Blocking reasons:"
    for r in "${REASONS[@]}"; do
      echo "  - $r"
    done
  else
    echo "- No blocking issues detected by this automated check."
  fi
} >> "$OUT"

echo "Readiness report written to: $OUT"
