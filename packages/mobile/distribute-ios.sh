#!/bin/bash

# iOS Distribution Script (Firebase App Distribution or TestFlight)
# Usage: ./distribute-ios.sh [debug|release|testflight] [release-notes]

set -e

BUILD_TYPE=${1:-debug}
RELEASE_NOTES=${2:-"Automated build from CI/CD"}

echo "🚀 Building and distributing iOS app..."
echo "Build type: $BUILD_TYPE"
echo "Release notes: $RELEASE_NOTES"

# Navigate to mobile directory
cd "$(dirname "$0")"

# Determine environment (default to development for manual builds)
ENVIRONMENT=${ENVIRONMENT:-development}
ENVIRONMENT=$(echo "$ENVIRONMENT" | tr '[:upper:]' '[:lower:]')

case "$ENVIRONMENT" in
    prod)
        ENVIRONMENT="production"
        ;;
    stage)
        ENVIRONMENT="staging"
        ;;
    dev)
        ENVIRONMENT="development"
        ;;
esac

case "$ENVIRONMENT" in
    development|staging|production)
        ;;
    *)
        echo "❌ Invalid ENVIRONMENT: $ENVIRONMENT"
        echo "Supported values: development, staging, production"
        exit 1
        ;;
esac

echo "🌍 Building for environment: $ENVIRONMENT"

# Copy appropriate Firebase config
echo "📋 Copying Firebase config for $ENVIRONMENT..."
if [ -f "config/$ENVIRONMENT/ios/GoogleService-Info.plist" ]; then
    cp "config/$ENVIRONMENT/ios/GoogleService-Info.plist" "ios/Runner/"
    echo "✅ Copied GoogleService-Info.plist for $ENVIRONMENT"
else
    echo "❌ GoogleService-Info.plist not found for $ENVIRONMENT environment"
    echo "Please download it from Firebase Console and place it in config/$ENVIRONMENT/ios/"
    exit 1
fi

case "$ENVIRONMENT" in
    development)
        EXPECTED_FIREBASE_PROJECT_ID="vehicle-vitals-dev"
        ;;
    staging)
        EXPECTED_FIREBASE_PROJECT_ID="vehicle-vitals-staging"
        ;;
    production)
        EXPECTED_FIREBASE_PROJECT_ID="vehicle-vitals-prod"
        ;;
esac

ACTUAL_FIREBASE_PROJECT_ID=$(/usr/libexec/PlistBuddy -c "Print :PROJECT_ID" "ios/Runner/GoogleService-Info.plist" 2>/dev/null || true)

if [ -z "$ACTUAL_FIREBASE_PROJECT_ID" ]; then
    echo "❌ Could not read PROJECT_ID from ios/Runner/GoogleService-Info.plist"
    exit 1
fi

if [ "$ACTUAL_FIREBASE_PROJECT_ID" != "$EXPECTED_FIREBASE_PROJECT_ID" ]; then
    echo "❌ Firebase iOS config mismatch detected"
    echo "Expected PROJECT_ID: $EXPECTED_FIREBASE_PROJECT_ID"
    echo "Actual PROJECT_ID:   $ACTUAL_FIREBASE_PROJECT_ID"
    echo "Fix config/$ENVIRONMENT/ios/GoogleService-Info.plist before distribution."
    exit 1
fi

echo "✅ Firebase PROJECT_ID validated: $ACTUAL_FIREBASE_PROJECT_ID"

# Ensure Fastlane/Flutter Dart defines use the same Firebase environment as plist copy.
export FIREBASE_ENV="$ENVIRONMENT"
echo "✅ FIREBASE_ENV exported as $FIREBASE_ENV"

# Inject production AdMob App ID into Info.plist if provided
if [ -n "$ADMOB_IOS_APP_ID" ]; then
    echo "📣 Injecting production AdMob App ID..."
    /usr/libexec/PlistBuddy -c "Set :GADApplicationIdentifier $ADMOB_IOS_APP_ID" ios/Runner/Info.plist
    echo "✅ AdMob App ID set to production"
else
    echo "⚠️  ADMOB_IOS_APP_ID not set — test AdMob App ID will be used"
fi

# Export AdMob unit IDs as environment variables for Fastlane to consume
export ADMOB_BANNER_UNIT_ID="${ADMOB_BANNER_UNIT_ID:-}"
export ADMOB_INTERSTITIAL_UNIT_ID="${ADMOB_INTERSTITIAL_UNIT_ID:-}"
export ADMOB_REWARDED_UNIT_ID="${ADMOB_REWARDED_UNIT_ID:-}"

# Export release notes for Fastlane lane
export RELEASE_NOTES="$RELEASE_NOTES"

# Check if Fastlane is installed
if ! command -v fastlane &> /dev/null; then
    echo "💎 Installing Fastlane..."
    gem install fastlane
fi

# Install Fastlane plugins
echo "🔌 Installing Fastlane plugins..."
cd ios
bundle install 2>/dev/null || echo "No Gemfile found, installing plugins directly..."
if [ "$BUILD_TYPE" != "testflight" ]; then
    fastlane add_plugin firebase_app_distribution
fi

# Run appropriate distribution
echo "🏃 Running distribution..."
if [ "$BUILD_TYPE" = "testflight" ]; then
    echo "📱 Deploying to TestFlight..."
    fastlane ios beta
    echo "🎉 iOS app uploaded to TestFlight successfully!"
    echo "📱 Beta testers will receive notifications via TestFlight app"
elif [ "$BUILD_TYPE" = "release" ]; then
    fastlane ios beta
    echo "🎉 iOS app distributed to production testers!"
else
    echo "⚠️  Only 'testflight' build type is currently supported for iOS. Skipping distribution."
    echo "✅ Run with: ENVIRONMENT=production ./distribute-ios.sh testflight"
fi