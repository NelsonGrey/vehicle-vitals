#!/usr/bin/env bash
set -euo pipefail

CMD=${1:-build}
MODE=${2:-production}

# Vite process env overrides .env files. Clear shell-level overrides so
# .env.<mode> values are deterministic for web builds/dev server.
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

case "$CMD" in
  dev)
    exec vite --mode "$MODE"
    ;;
  build)
    exec vite build --mode "$MODE"
    ;;
  preview)
    exec vite preview --mode "$MODE"
    ;;
  *)
    echo "Invalid command: $CMD" >&2
    echo "Usage: ./scripts/vite-sanitized-env.sh <dev|build|preview> [mode]" >&2
    exit 1
    ;;
esac
