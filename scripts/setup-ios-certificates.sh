#!/bin/bash
# Setup iOS Certificates for Vehicle-Vitals using Fastlane Match

set -e

echo "🔐 Vehicle-Vitals iOS Certificate Setup"
echo "======================================="

# Check prerequisites
if ! command -v fastlane >/dev/null 2>&1; then
    echo "❌ Fastlane not found. Install with: brew install fastlane"
    exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
    echo "❌ GitHub CLI not found. Install with: brew install gh"
    exit 1
fi

# Check if authenticated with GitHub
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ Not authenticated with GitHub CLI. Run: gh auth login"
    exit 1
fi

cd packages/mobile/ios

echo "🔑 Generating GitHub Personal Access Token..."
echo "Please create a new Personal Access Token at:"
echo "https://github.com/settings/tokens"
echo ""
echo "Required scopes:"
echo "- repo (Full control of private repositories)"
echo ""
read -p "Enter your GitHub Personal Access Token: " -s GITHUB_TOKEN
echo ""

# Set the MATCH_GIT_URL environment variable
MATCH_URL="https://oauth2:${GITHUB_TOKEN}@github.com/mnelson3/vehicle-vitals-certificates.git"
export MATCH_GIT_URL="$MATCH_URL"

echo "📝 Please provide your Apple Developer credentials:"
echo "(These will be used for certificate generation)"
echo ""
read -p "Apple ID (email): " FASTLANE_APPLE_ID
read -p "Apple Developer Team ID: " FASTLANE_TEAM_ID
read -p "App Store Connect Team ID (usually same as above): " FASTLANE_ITC_TEAM_ID
echo ""

# Export the Apple credentials
export FASTLANE_APPLE_ID
export FASTLANE_TEAM_ID
export FASTLANE_ITC_TEAM_ID

echo "🔧 Initializing Fastlane Match..."
fastlane match init

echo "📱 Generating Development certificates..."
fastlane match development

echo "🏪 Generating App Store certificates..."
fastlane match appstore

echo "✅ Certificate setup complete!"
echo ""
echo "🔒 Important: Add the following to your CI/CD secrets:"
echo "   MATCH_GIT_URL: $MATCH_URL"
echo "   MATCH_PASSWORD: (the password you set during match init)"
echo ""
echo "📖 See docs/IOS_CERTIFICATE_SETUP_GUIDE.md for more details"
