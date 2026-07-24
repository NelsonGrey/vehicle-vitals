# Firebase iOS Configuration for Vehicle-Vitals

Last verified: July 20, 2026

The Flutter iOS project supports development, staging, and production Firebase
projects. This document intentionally omits API keys, app IDs, OAuth client IDs,
and other configuration values.

## Source Locations

- `packages/mobile/lib/firebase_options.dart`: platform/environment options.
- `packages/mobile/ios/Runner/GoogleService-Info.plist`: active local Runner
  plist.
- `packages/mobile/ios/Runner/GoogleService-Info.dev.plist`.
- `packages/mobile/ios/Runner/GoogleService-Info.staging.plist`.
- `packages/mobile/ios/Runner/GoogleService-Info.prod.plist`.
- `packages/mobile/config/{environment}/ios/`: optional gitignored CI inputs.

The current bundle ID is governed by the Xcode project and signing setup. Verify
it in source and App Store Connect rather than copying a value from a dated
document.

## CI Selection

When iOS is enabled, the `build-ios` job in `master-pipeline.yml`:

1. derives the target environment;
2. selects `config/{environment}/ios/GoogleService-Info.plist` or the tracked
   Runner fallback;
3. reads and validates `PROJECT_ID` against the expected Firebase project;
4. copies the selected plist into the Runner target;
5. performs the signed Fastlane/TestFlight build.

iOS automation is currently disabled in `.cicd/projects/vehicle-vitals.yml`, so
the presence of configuration files does not prove a current build or App Store
status.

## Local Validation

```bash
cd packages/mobile
flutter pub get
flutter analyze
flutter test
flutter run -d ios
```

For compilation without signing:

```bash
flutter build ios --release --no-codesign
```

Validate Firebase Auth, Firestore personal/org paths, callable Functions,
Storage, Messaging/Crashlytics, Apple sign-in, purchases/restores, support,
privacy, and deletion on the exact release build before distribution.

Do not run `flutterfire configure` or `flutter create` over the project without
reviewing the multi-environment and Xcode files they may replace.
