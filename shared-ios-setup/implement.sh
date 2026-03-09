#!/bin/bash

# iOS Setup Implementation Script
# This script applies the shared iOS configuration for this repository.

set -e

PROJECT_NAME="$1"

if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: $0 <project-name>"
    echo "Available projects: vehicle-vitals"
    exit 1
fi

PROJECT_DIR="/Users/marknelson/Circus/Repositories/$PROJECT_NAME"
SHARED_DIR="$PROJECT_DIR/shared-ios-setup"
FASTLANE_DIR="$PROJECT_DIR/packages/mobile/ios/fastlane"

if [ ! -d "$SHARED_DIR" ]; then
    echo "❌ Shared iOS setup not found for $PROJECT_NAME"
    exit 1
fi

echo "🚀 Implementing shared iOS setup for $PROJECT_NAME..."

# Backup existing fastlane configuration
if [ -d "$FASTLANE_DIR" ]; then
    echo "📦 Backing up existing Fastlane configuration..."
    cp -r "$FASTLANE_DIR" "$FASTLANE_DIR.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy the shared configuration
echo "📋 Copying shared Fastlane configuration..."
mkdir -p "$FASTLANE_DIR"
cp "$SHARED_DIR/fastlane/Fastfile" "$FASTLANE_DIR/"
cp "$SHARED_DIR/fastlane/Appfile" "$FASTLANE_DIR/"
cp "$SHARED_DIR/fastlane/Matchfile" "$FASTLANE_DIR/"
cp "$SHARED_DIR/fastlane/exportOptions.plist" "$FASTLANE_DIR/"

echo "✅ iOS setup implemented successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Review the copied files in $FASTLANE_DIR"
echo "2. Test locally: cd $FASTLANE_DIR && bundle exec fastlane build_release"
echo "3. Update your CI/CD workflows to use the new lanes"
echo "4. Ensure all required environment variables are set"
echo ""
echo "🔧 Required environment variables:"
echo "- APP_STORE_CONNECT_KEY, APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID"
echo "- FASTLANE_APPLE_ID, FASTLANE_TEAM_ID, FASTLANE_ITC_TEAM_ID"
echo "- MATCH_GIT_URL, MATCH_PASSWORD"
echo "- BETA_FEEDBACK_EMAIL, RELEASE_NOTES"