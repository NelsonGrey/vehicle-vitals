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
  VITE_MODE \
  VITE_SHOW_COMING_SOON \
  VITE_FUNCTIONS_BASE_URL \
  VITE_API_BASE_URL \
  VITE_FIREBASE_API_KEY \
  VITE_FIREBASE_AUTH_DOMAIN \
  VITE_FIREBASE_PROJECT_ID \
  VITE_FIREBASE_STORAGE_BUCKET \
  VITE_FIREBASE_MESSAGING_SENDER_ID \
  VITE_FIREBASE_APP_ID \
  VITE_FIREBASE_MEASUREMENT_ID \
  VITE_DEBUG \
  VITE_ANALYTICS_ID \
  VITE_SENTRY_DSN \
  VITE_ENABLE_DEBUG_TOOLS \
  VITE_ENABLE_ANALYTICS \
  VITE_ENABLE_ERROR_REPORTING \
  VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS \
  VITE_ENABLE_ADS \
  VITE_ADSENSE_CLIENT \
  VITE_ADSENSE_SLOT \
  VITE_ACCESS_PASSWORD_STAGING \
  VITE_ACCESS_PASSWORD_DEVELOPMENT
  do
  unset "$var_name" || true
done

npm --workspace=@vehicle-vitals/web run "$WEB_BUILD_SCRIPT"
