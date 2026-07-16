#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_ENV="${1:-development}"

case "$TARGET_ENV" in
  production)
    BASE_URL="https://vehicle-vitals-prod.web.app"
    ;;
  staging)
    BASE_URL="https://vehicle-vitals-staging.web.app"
    ;;
  development|demonstration)
    BASE_URL="https://vehicle-vitals-dev.web.app"
    ;;
  *)
    echo "Unsupported environment: $TARGET_ENV"
    echo "Usage: ./scripts/run-uat-tests.sh [development|demonstration|staging|production]"
    exit 1
    ;;
esac

cd "$REPO_ROOT/packages/web"
echo "[uat] Running chromium UAT against BASE_URL=$BASE_URL"
BASE_URL="$BASE_URL" npm run test:uat:chromium

echo "[uat] Chromium UAT passed"
