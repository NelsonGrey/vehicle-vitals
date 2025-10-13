#!/bin/bash

# Firebase App Distribution Script for Android
# Usage: ./distribute-android.sh [debug|release] [release-notes]

set -e

BUILD_TYPE=${1:-debug}
RELEASE_NOTES=${2:-"Automated build from CI/CD"}

echo "🚀 Building and distributing Android app..."
echo "Build type: $BUILD_TYPE"
echo "Release notes: $RELEASE_NOTES"

# Navigate to mobile directory
cd "$(dirname "$0")/.."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Build Android APK
echo "🔨 Building Android APK ($BUILD_TYPE)..."
if [ "$BUILD_TYPE" = "release" ]; then
    flutter build apk --release --target-platform android-arm64
else
    flutter build apk --debug --target-platform android-arm64
fi

# Check if APK was created
APK_PATH="build/app/outputs/flutter-apk/app-$BUILD_TYPE.apk"
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at $APK_PATH"
    exit 1
fi

echo "✅ APK built successfully: $APK_PATH"

# Set environment variables for Firebase App Distribution
export RELEASE_NOTES="$RELEASE_NOTES"

# Distribute using Gradle task
echo "📤 Distributing to Firebase App Distribution..."
cd android
if [ "$BUILD_TYPE" = "release" ]; then
    ./gradlew appDistributionUploadRelease
else
    ./gradlew appDistributionUploadDebug
fi

echo "🎉 Android app distributed successfully!"
echo "📱 Testers will receive notifications via email"