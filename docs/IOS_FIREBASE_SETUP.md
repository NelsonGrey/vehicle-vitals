# Firebase iOS Configuration for Vehicle-Vitals

**Status**: Active. iOS is the primary shipping mobile platform (App Store
1.0 approved, September 2026).

## Where the real configuration lives

This doc previously hardcoded a snapshot of the iOS `FirebaseOptions` values
(API key, App ID, client ID) as they stood at initial setup. Those values
have since rotated more than once (config refreshes, org migration — see
git history), so a hardcoded copy here silently goes stale and is exactly
the kind of drift worth avoiding. The live values are always:

- `packages/mobile/ios/Runner/GoogleService-Info.{dev,staging,prod}.plist`
  (+ the unsuffixed default used by the active build)
- `packages/mobile/config/{env}/ios/...`
- `packages/mobile/lib/firebase_options.dart` (generated; do not hand-edit —
  regenerate via `firebase apps:sdkconfig IOS <appId> --project <project>`
  or the FlutterFire CLI)

To pull the current values for a given environment:

```bash
firebase apps:sdkconfig IOS <ios-app-id> --project vehicle-vitals-{dev,staging,prod}
```

## Bundle ID

`com.vehiclevitals.app.ios`

## Firebase services in use

- Authentication (email/password, Sign in with Apple, Google Sign-In)
- Firestore
- Cloud Messaging
- Crashlytics

## Verifying the setup

```bash
cd packages/mobile
flutter pub get
VV_FIREBASE_ENV=staging ./scripts/ios-restart-local.sh   # or dev/production
```

See `docs/ENVIRONMENT_SETUP.md` for the full per-environment picture and
`docs/DEVELOPER_GUIDE.md` for general mobile dev setup.
