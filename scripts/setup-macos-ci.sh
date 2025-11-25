#!/bin/bash
# 🚀 Vehicle Vitals - macOS CI Setup for Zero-Touch iOS Builds
# This script configures macOS runners to avoid keychain dialogs and interactive prompts

set -e

echo "🍎 Setting up macOS environment for zero-touch iOS builds..."

# Debug: Check current user and environment
echo "👤 Current user: $(whoami)"
echo "🏠 Home directory: $HOME"
echo "🔑 Keychains available:"
security list-keychains 2>/dev/null || echo "Unable to list keychains"

# Unlock the default keychain to avoid prompts
if [ -n "$MATCH_PASSWORD" ]; then
    echo "🔓 Unlocking keychain..."
    security unlock-keychain -p "$MATCH_PASSWORD" login.keychain 2>/dev/null || true
fi

# Create temporary keychain for Fastlane if it doesn't exist
if [ -n "$MATCH_PASSWORD" ]; then
    echo "🔑 Setting up Fastlane keychain..."
    
    # Delete existing keychain if it exists to ensure clean state
    security delete-keychain fastlane_tmp_keychain 2>/dev/null || true
    
    security create-keychain -p "$MATCH_PASSWORD" fastlane_tmp_keychain 2>/dev/null || true
    security unlock-keychain -p "$MATCH_PASSWORD" fastlane_tmp_keychain 2>/dev/null || true
    security set-keychain-settings -t 3600 -l fastlane_tmp_keychain 2>/dev/null || true
    
    # Set the fastlane keychain as the default and add to search list
    security default-keychain -s fastlane_tmp_keychain 2>/dev/null || true
    security list-keychains -s fastlane_tmp_keychain login.keychain 2>/dev/null || true
    
    # Import certificates to the keychain (if any exist)
    if [ -d "ios/certs" ]; then
        echo "📜 Importing certificates..."
        for cert in ios/certs/*.cer ios/certs/*.p12; do
            if [ -f "$cert" ]; then
                security import "$cert" -k fastlane_tmp_keychain -P "$MATCH_PASSWORD" 2>/dev/null || true
            fi
        done
    fi
else
    echo "⚠️  MATCH_PASSWORD not set, skipping keychain setup"
fi

# Disable keychain prompts for codesign
echo "🚫 Disabling keychain prompts..."
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$MATCH_PASSWORD" fastlane_tmp_keychain 2>/dev/null || true

# Also disable prompts for the login keychain
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$MATCH_PASSWORD" login.keychain 2>/dev/null || true

# Additional security settings to prevent dialogs
echo "🔐 Configuring additional security settings..."
# Allow codesign to access keychain without prompts
security set-key-partition-list -S apple: -k "$MATCH_PASSWORD" fastlane_tmp_keychain 2>/dev/null || true
security set-key-partition-list -S apple: -k "$MATCH_PASSWORD" login.keychain 2>/dev/null || true

# Set codesign to use the keychain
export CODESIGN_ALLOCATE="/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/codesign_allocate"

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

# Additional environment variables to prevent keychain dialogs
export CSC_KEY_PASSWORD="$MATCH_PASSWORD"
export CSC_LINK=""
export KEYCHAIN_PASSWORD="$MATCH_PASSWORD"
export MATCH_KEYCHAIN_NAME="fastlane_tmp_keychain"
export MATCH_KEYCHAIN_PASSWORD="$MATCH_PASSWORD"

echo "✅ macOS environment configured for zero-touch operations"
echo "🔒 Keychain dialogs should no longer appear"

# Final verification
echo "🔍 Verifying keychain setup..."
security default-keychain 2>/dev/null || echo "No default keychain set"
security list-keychains 2>/dev/null | head -5 || echo "Unable to verify keychains"