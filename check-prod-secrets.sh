#!/bin/bash

# Check which production secrets are already set
echo "🔍 Checking current production secrets..."
echo ""

# List of expected production secrets
secrets=(
    "VITE_FIREBASE_API_KEY_PRODUCTION"
    "VITE_FIREBASE_AUTH_DOMAIN_PRODUCTION"
    "VITE_FIREBASE_PROJECT_ID_PRODUCTION"
    "VITE_FIREBASE_STORAGE_BUCKET_PRODUCTION"
    "VITE_FIREBASE_MESSAGING_SENDER_ID_PRODUCTION"
    "VITE_FIREBASE_APP_ID_PRODUCTION"
    "VITE_FIREBASE_MEASUREMENT_ID_PRODUCTION"
    "VITE_DEBUG_PRODUCTION"
    "VITE_SHOW_COMING_SOON_PRODUCTION"
    "VITE_ANALYTICS_ID_PRODUCTION"
    "VITE_SENTRY_DSN_PRODUCTION"
    "VITE_ADSENSE_CLIENT"
    "VITE_ADSENSE_SLOT"
    "VITE_ENABLE_DEBUG_TOOLS_PRODUCTION"
    "VITE_ENABLE_ANALYTICS_PRODUCTION"
    "VITE_ENABLE_ERROR_REPORTING_PRODUCTION"
    "FIREBASE_SERVICE_ACCOUNT_PRODUCTION"
    "FIREBASE_TOKEN"
    "VITE_ACCESS_PASSWORD_STAGING"
    "VITE_ACCESS_PASSWORD_DEVELOPMENT"
)

echo "Expected production secrets:"
echo "=============================="

for secret in "${secrets[@]}"; do
    if gh secret list | grep -q "^${secret}"; then
        echo "✅ ${secret}"
    else
        echo "❌ ${secret} - MISSING"
    fi
done

echo ""
echo "Run './setup-prod-secrets.sh' to set missing secrets"
echo "Or follow PROD_SETUP_GUIDE.md for manual setup"