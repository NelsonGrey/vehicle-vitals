#!/bin/bash

set -euo pipefail

MODE=${1:-production}

case "$MODE" in
  production)
    WEB_BUILD_SCRIPT="build"
    ;;
  staging)
    WEB_BUILD_SCRIPT="build:staging"
    ;;
  development)
    WEB_BUILD_SCRIPT="build:development"
    ;;
  *)
    echo "Invalid mode: $MODE"
    echo "Valid options: production, staging, development"
    exit 1
    ;;
esac

# Vite gives process env precedence over .env files. Clear shell-level overrides
# so environment-specific .env files drive Firebase/AdSense config deterministically.
for var_name in \
  VITE_ENVIRONMENT \
  VITE_FUNCTIONS_BASE_URL \
  VITE_FIREBASE_API_KEY \
  VITE_FIREBASE_AUTH_DOMAIN \
  VITE_FIREBASE_PROJECT_ID \
  VITE_FIREBASE_STORAGE_BUCKET \
  VITE_FIREBASE_MESSAGING_SENDER_ID \
  VITE_FIREBASE_APP_ID \
  VITE_FIREBASE_MEASUREMENT_ID \
  VITE_ENABLE_ADS \
  VITE_ADSENSE_CLIENT \
  VITE_ADSENSE_SLOT
  do
  unset "$var_name" || true
done

npm --workspace=@vehicle-vitals/web run "$WEB_BUILD_SCRIPT"
