#!/usr/bin/env bash
set -euo pipefail

OWNER="${1:-mnelson3}"
REPO="${2:-vehicle-vitals}"
BRANCHES=(develop staging main)

count_alerts() {
  local endpoint="$1"
  gh api "repos/${OWNER}/${REPO}/${endpoint}?state=open&per_page=100" --paginate --jq 'length' \
    | awk '{s+=$1} END {print s+0}'
}

echo "== Security Alert Snapshot =="
echo "Dependabot(open): $(count_alerts "dependabot/alerts")"
echo "CodeScanning(open): $(count_alerts "code-scanning/alerts")"
echo "SecretScanning(open): $(count_alerts "secret-scanning/alerts")"

echo
echo "== Dismissed Alert Summary =="
echo "CodeScanning(dismissed by reason):"
gh api "repos/${OWNER}/${REPO}/code-scanning/alerts?state=dismissed&per_page=100" --paginate --jq '.[].dismissed_reason' \
  | sort | uniq -c || true

echo "Dependabot(dismissed by reason):"
gh api "repos/${OWNER}/${REPO}/dependabot/alerts?state=dismissed&per_page=100" --paginate --jq '.[].dismissed_reason' \
  | sort | uniq -c || true

echo
echo "== Branch Protection Snapshot =="
for branch in "${BRANCHES[@]}"; do
  echo "-- ${branch} --"
  gh api "repos/${OWNER}/${REPO}/branches/${branch}/protection" \
    --jq '{required_status_checks,required_pull_request_reviews,enforce_admins,required_linear_history,allow_force_pushes,allow_deletions,required_conversation_resolution}'
  gh api "repos/${OWNER}/${REPO}/branches/${branch}/protection/required_signatures" \
    --jq '{required_signed_commits:.enabled}'
  echo
done

echo "== Repository Security Features =="
gh api "repos/${OWNER}/${REPO}" --jq '.security_and_analysis'

echo
echo "Audit complete."
