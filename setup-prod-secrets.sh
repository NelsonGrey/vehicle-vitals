#!/bin/bash

# Vehicle Vitals - Complete Production Environment Setup
# This script sets up all required GitHub secrets for production deployment

set -e

echo "🚀 Setting up complete PROD environment for Vehicle Vitals..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    echo -e "${BLUE}Setting ${secret_name}...${NC}"
    echo "${secret_value}" | gh secret set "${secret_name}" --body-file -
    echo -e "${GREEN}✅ ${secret_name} set${NC}"
    if [ -n "$description" ]; then
        echo "   ${description}"
    fi
    echo ""
}

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed or not authenticated${NC}"
    echo "Please install GitHub CLI and run 'gh auth login' first"
    exit 1
fi

# Check if we're in the right repository
if ! gh repo view --json name | grep -q "vehicle-vitals"; then
    echo -e "${RED}❌ Not in the correct repository${NC}"
    echo "Please run this script from the vehicle-vitals repository"
    exit 1
fi

echo -e "${YELLOW}📋 Setting up Firebase Configuration Secrets...${NC}"

# Firebase Configuration
set_secret "VITE_FIREBASE_API_KEY_PRODUCTION" "AIzaSyDE99EAoGniEwCLfu4llmv_NsSjbwr-ZRE" "Firebase API Key for production"
set_secret "VITE_FIREBASE_AUTH_DOMAIN_PRODUCTION" "vehicle-vitals-prod.firebaseapp.com" "Firebase Auth domain"
set_secret "VITE_FIREBASE_PROJECT_ID_PRODUCTION" "vehicle-vitals-prod" "Firebase project ID"
set_secret "VITE_FIREBASE_STORAGE_BUCKET_PRODUCTION" "vehicle-vitals-prod.appspot.com" "Firebase storage bucket"
set_secret "VITE_FIREBASE_MESSAGING_SENDER_ID_PRODUCTION" "489413148337" "Firebase messaging sender ID"
set_secret "VITE_FIREBASE_APP_ID_PRODUCTION" "1:489413148337:web:9b4e97350073a22968ac90" "Firebase app ID"
set_secret "VITE_FIREBASE_MEASUREMENT_ID_PRODUCTION" "G-32PCGDSNT9" "Google Analytics measurement ID"

echo -e "${YELLOW}📋 Setting up Environment & Feature Flags...${NC}"

# Environment settings
set_secret "VITE_DEBUG_PRODUCTION" "false" "Disable debug mode in production"
set_secret "VITE_SHOW_COMING_SOON_PRODUCTION" "true" "Show coming soon page instead of full app"

echo -e "${YELLOW}📋 Setting up Analytics & Monitoring...${NC}"

# Analytics & Monitoring (placeholders - you'll need to set actual values)
set_secret "VITE_ANALYTICS_ID_PRODUCTION" "G-32PCGDSNT9" "Google Analytics ID"
set_secret "VITE_SENTRY_DSN_PRODUCTION" "" "Sentry DSN for error reporting (leave empty if not using)"

echo -e "${YELLOW}📋 Setting up Ad Configuration...${NC}"

# Ad configuration
set_secret "VITE_ADSENSE_CLIENT" "ca-pub-5198775482699756" "AdSense publisher ID"
set_secret "VITE_ADSENSE_SLOT" "1234567890" "AdSense ad slot ID (placeholder)"

echo -e "${YELLOW}📋 Setting up Environment Access Control...${NC}"

# Environment access passwords (change these defaults!)
set_secret "VITE_ACCESS_PASSWORD_STAGING" "staging2025" "Password for staging environment access"
set_secret "VITE_ACCESS_PASSWORD_DEVELOPMENT" "dev2025" "Password for development environment access"

echo -e "${YELLOW}📋 Setting up Firebase Service Account...${NC}"

# Firebase service account for deployment (this needs to be set separately)
echo -e "${BLUE}Note: FIREBASE_SERVICE_ACCOUNT_PRODUCTION needs to be set separately${NC}"
echo "You'll need to create a Firebase service account key and set it as a secret"
echo "See: https://firebase.google.com/docs/admin/setup#initialize-sdk"
echo ""

echo -e "${YELLOW}📋 Setting up Firebase Token (for manual deployments)...${NC}"

# Firebase token for manual deployments
echo -e "${BLUE}Note: FIREBASE_TOKEN needs to be set for manual deployments${NC}"
echo "Run 'firebase login:ci' and set the token as FIREBASE_TOKEN secret"
echo ""

echo -e "${GREEN}🎉 Production environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set FIREBASE_SERVICE_ACCOUNT_PRODUCTION secret with service account JSON"
echo "2. Set FIREBASE_TOKEN secret with 'firebase login:ci' token"
echo "3. Update VITE_SENTRY_DSN_PRODUCTION with actual Sentry DSN if using error reporting"
echo "4. Update VITE_ADSENSE_SLOT with actual AdSense slot ID"
echo "5. Trigger a production deployment:"
echo "   gh workflow run ci-cd-pipeline.yml -f environment=PRODUCTION"
echo ""
echo -e "${BLUE}Production URL: https://vehicle-vitals-prod.web.app${NC}"