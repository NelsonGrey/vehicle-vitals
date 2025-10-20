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
cd "$(dirname "$0")"

# Determine environment (default to development for manual builds)
ENVIRONMENT=${ENVIRONMENT:-development}

echo "🌍 Building for environment: $ENVIRONMENT"

# Copy appropriate Firebase config
echo "📋 Copying Firebase config for $ENVIRONMENT..."
if [ -f "config/$ENVIRONMENT/android/google-services.json" ]; then
    cp "config/$ENVIRONMENT/android/google-services.json" "android/app/"
    echo "✅ Copied google-services.json for $ENVIRONMENT"
else
    echo "❌ google-services.json not found for $ENVIRONMENT environment"
    echo "Please download it from Firebase Console and place it in config/$ENVIRONMENT/android/"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Build Android APK
echo "🔨 Building Android APK ($BUILD_TYPE)..."
if [ "$BUILD_TYPE" = "release" ]; then
    # Build with AdMob configuration for production
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$ADMOB_BANNER_UNIT_ID" ]; then
        flutter build apk --release --target-platform android-arm64 \
          --dart-define=ADMOB_BANNER_UNIT_ID="$ADMOB_BANNER_UNIT_ID" \
          --dart-define=ADMOB_INTERSTITIAL_UNIT_ID="$ADMOB_INTERSTITIAL_UNIT_ID" \
          --dart-define=ADMOB_REWARDED_UNIT_ID="$ADMOB_REWARDED_UNIT_ID"
    else
        flutter build apk --release --target-platform android-arm64
    fi
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

# Check if we should skip distribution (for local testing)
if [ "$SKIP_DISTRIBUTION" = "true" ]; then
    echo "⏭️  Skipping Firebase App Distribution (SKIP_DISTRIBUTION=true)"
    echo "✅ Android app built successfully!"
    echo "📱 APK available at: build/app/outputs/flutter-apk/app-$BUILD_TYPE.apk"
    exit 0
fi

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