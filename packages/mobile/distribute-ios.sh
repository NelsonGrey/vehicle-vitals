#!/bin/bash

# Firebase App Distribution Script for iOS
# Usage: ./distribute-ios.sh [debug|release] [release-notes]

set -e

BUILD_TYPE=${1:-debug}
RELEASE_NOTES=${2:-"Automated build from CI/CD"}

echo "🚀 Building and distributing iOS app..."
echo "Build type: $BUILD_TYPE"
echo "Release notes: $RELEASE_NOTES"

# Navigate to mobile directory
cd "$(dirname "$0")/.."

# Determine environment (default to development for manual builds)
ENVIRONMENT=${ENVIRONMENT:-development}

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

# Check if Fastlane is installed
if ! command -v fastlane &> /dev/null; then
    echo "� Installing Fastlane..."
    gem install fastlane
fi

# Install Fastlane plugins
echo "🔌 Installing Fastlane plugins..."
cd ios
bundle install 2>/dev/null || echo "No Gemfile found, installing firebase plugin directly..."
fastlane add_plugin firebase_app_distribution

# Run Fastlane distribution
echo "🏃 Running Fastlane distribution..."
if [ "$BUILD_TYPE" = "release" ]; then
    fastlane ios release release_notes:"$RELEASE_NOTES"
else
    fastlane ios debug release_notes:"$RELEASE_NOTES"
fi

echo "🎉 iOS app distributed successfully!"
echo "📱 Testers will receive notifications via email"