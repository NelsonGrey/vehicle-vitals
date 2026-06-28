#!/usr/bin/env bash
# Migrates Firebase app registrations from com.nelsongrey.vehiclevitals to com.vehiclevitals
# across all three projects (dev, staging, prod) for iOS and Android.
#
# Steps per project:
#   1. Create new app with updated bundle/package ID
#   2. Download updated GoogleService-Info.plist (iOS) or google-services.json (Android)
#   3. Archive (remove) the old app registration via the Firebase Management API

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

NEW_IOS_BUNDLE="com.vehiclevitals.app.ios"
NEW_ANDROID_PACKAGE="com.vehiclevitals.app.android"

PROJECT_PROD="vehicle-vitals-prod"
PROJECT_STAGING="vehicle-vitals-staging"
PROJECT_DEV="vehicle-vitals-dev"

OLD_IOS_PROD="1:489413148337:ios:b55d0b37718e299368ac90"
OLD_ANDROID_PROD="1:489413148337:android:0ed732a4b8cd462068ac90"
OLD_IOS_STAGING="1:364854499099:ios:23e8551a7ba7195447a5be"
OLD_IOS_DEV="1:919227980868:ios:6aa6e20c5110778ab5f011"

ACCESS_TOKEN="$(gcloud auth print-access-token)"

firebase_delete_app() {
  local project="$1"
  local app_id="$2"
  local platform="$3"

  local resource_type
  case "$platform" in
    ios) resource_type="iosApps" ;;
    android) resource_type="androidApps" ;;
  esac

  echo "  Removing old $platform app $app_id from $project..."
  curl -s -X PATCH \
    "https://firebase.googleapis.com/v1beta1/projects/${project}/${resource_type}/${app_id}?updateMask=state" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"state":"DELETED"}' | python3 -c "
import sys, json
r = json.load(sys.stdin)
if r.get('done') or r.get('name'):
    print('  ✓ Archived')
else:
    print('  Response:', json.dumps(r, indent=2))
"
}

echo "=== Migrating iOS: $PROJECT_PROD ==="
echo "  Creating $NEW_IOS_BUNDLE..."
NEW_APP_ID=$(firebase apps:create IOS "Vehicle Vitals" \
  --bundle-id "$NEW_IOS_BUNDLE" \
  --project "$PROJECT_PROD" \
  --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['appId'])")
echo "  New app ID: $NEW_APP_ID"
echo "  Downloading GoogleService-Info.plist..."
firebase apps:sdkconfig IOS "$NEW_APP_ID" \
  --project "$PROJECT_PROD" \
  --out "$REPO_ROOT/packages/mobile/config/production/ios/GoogleService-Info.plist" \
  --non-interactive 2>/dev/null
echo "  ✓ Saved to packages/mobile/config/production/ios/GoogleService-Info.plist"
firebase_delete_app "$PROJECT_PROD" "$OLD_IOS_PROD" "ios"

echo ""
echo "=== Migrating Android: $PROJECT_PROD ==="
echo "  Creating $NEW_ANDROID_PACKAGE..."
NEW_APP_ID=$(firebase apps:create ANDROID "Vehicle Vitals" \
  --package-name "$NEW_ANDROID_PACKAGE" \
  --project "$PROJECT_PROD" \
  --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['appId'])")
echo "  New app ID: $NEW_APP_ID"
echo "  Downloading google-services.json..."
firebase apps:sdkconfig ANDROID "$NEW_APP_ID" \
  --project "$PROJECT_PROD" \
  --out "$REPO_ROOT/packages/mobile/android/app/google-services.json" \
  --non-interactive 2>/dev/null
echo "  ✓ Saved to packages/mobile/android/app/google-services.json"
firebase_delete_app "$PROJECT_PROD" "$OLD_ANDROID_PROD" "android"

echo ""
echo "=== Migrating iOS: $PROJECT_STAGING ==="
echo "  Creating $NEW_IOS_BUNDLE..."
NEW_APP_ID=$(firebase apps:create IOS "Vehicle Vitals" \
  --bundle-id "$NEW_IOS_BUNDLE" \
  --project "$PROJECT_STAGING" \
  --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['appId'])")
echo "  New app ID: $NEW_APP_ID"
echo "  Downloading GoogleService-Info.plist..."
firebase apps:sdkconfig IOS "$NEW_APP_ID" \
  --project "$PROJECT_STAGING" \
  --out "$REPO_ROOT/packages/mobile/config/staging/ios/GoogleService-Info.plist" \
  --non-interactive 2>/dev/null
echo "  ✓ Saved to packages/mobile/config/staging/ios/GoogleService-Info.plist"
firebase_delete_app "$PROJECT_STAGING" "$OLD_IOS_STAGING" "ios"

echo ""
echo "=== Migrating iOS: $PROJECT_DEV ==="
echo "  Creating $NEW_IOS_BUNDLE..."
NEW_APP_ID=$(firebase apps:create IOS "Vehicle Vitals" \
  --bundle-id "$NEW_IOS_BUNDLE" \
  --project "$PROJECT_DEV" \
  --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['appId'])")
echo "  New app ID: $NEW_APP_ID"
echo "  Downloading GoogleService-Info.plist..."
firebase apps:sdkconfig IOS "$NEW_APP_ID" \
  --project "$PROJECT_DEV" \
  --out "$REPO_ROOT/packages/mobile/config/development/ios/GoogleService-Info.plist" \
  --non-interactive 2>/dev/null
echo "  ✓ Saved to packages/mobile/config/development/ios/GoogleService-Info.plist"
firebase_delete_app "$PROJECT_DEV" "$OLD_IOS_DEV" "ios"

echo ""
echo "=== Copying prod plist to ios/Runner/ variants ==="
cp "$REPO_ROOT/packages/mobile/config/production/ios/GoogleService-Info.plist" \
   "$REPO_ROOT/packages/mobile/ios/Runner/GoogleService-Info.prod.plist"
cp "$REPO_ROOT/packages/mobile/config/staging/ios/GoogleService-Info.plist" \
   "$REPO_ROOT/packages/mobile/ios/Runner/GoogleService-Info.staging.plist"
cp "$REPO_ROOT/packages/mobile/config/development/ios/GoogleService-Info.plist" \
   "$REPO_ROOT/packages/mobile/ios/Runner/GoogleService-Info.dev.plist"
echo "  ✓ Runner plists updated"

echo ""
echo "=== All done ==="
echo "Next steps:"
echo "  1. Review the downloaded plist/json files"
echo "  2. Update firebase_options.dart if any app IDs changed (run 'flutterfire configure')"
echo "  3. Regenerate provisioning profiles for the new iOS bundle ID"
