#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"
echo "[unit] Running web unit tests"
npm run test:unit --workspace=@vehicle-vitals/web

echo "[unit] Running mobile unit tests"
cd "$REPO_ROOT/packages/mobile"
flutter test

echo "[unit] All unit test suites passed"
