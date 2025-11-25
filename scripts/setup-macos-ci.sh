#!/bin/bash
# 🚀 Vehicle Vitals - macOS CI Setup for Zero-Touch iOS Builds
# This script configures macOS runners to avoid keychain dialogs and interactive prompts

set -e

echo "🍎 Setting up macOS environment for zero-touch iOS builds..."

# Unlock the default keychain to avoid prompts
if [ -n "$MATCH_PASSWORD" ]; then
    echo "🔓 Unlocking keychain..."
    security unlock-keychain -p "$MATCH_PASSWORD" login.keychain 2>/dev/null || true
fi

# Create temporary keychain for Fastlane if it doesn't exist
if [ -n "$MATCH_PASSWORD" ]; then
    echo "🔑 Setting up Fastlane keychain..."
    security create-keychain -p "$MATCH_PASSWORD" fastlane_tmp_keychain 2>/dev/null || true
    security unlock-keychain -p "$MATCH_PASSWORD" fastlane_tmp_keychain 2>/dev/null || true
    security set-keychain-settings -t 3600 -l fastlane_tmp_keychain 2>/dev/null || true
fi

# Disable keychain prompts for codesign
echo "🚫 Disabling keychain prompts..."
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$MATCH_PASSWORD" fastlane_tmp_keychain 2>/dev/null || true

# Configure git to avoid interactive prompts
echo "🔧 Configuring git..."
git config --global user.name "Vehicle Vitals CI"
git config --global user.email "ci@vehicle-vitals.com"
git config --global core.askpass ""
git config --global credential.helper ""

# Set environment variables to disable interactive prompts
export FASTLANE_SKIP_UPDATE_CHECK=1
export FASTLANE_HIDE_CHANGELOG=1
export FASTLANE_DISABLE_COLORS=0
export CI=true
export FASTLANE_CI=true

echo "✅ macOS environment configured for zero-touch operations"
echo "🔒 Keychain dialogs should no longer appear"</content>
<parameter name="filePath">/Users/marknelson/Circus/Repositories/vehicle-vitals/scripts/setup-macos-ci.sh