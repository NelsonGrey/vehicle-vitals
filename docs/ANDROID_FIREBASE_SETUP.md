# Firebase Android Configuration for Vehicle-Vitals

**Status**: Active, pre-launch. Android is no longer on hold — signed
release builds run in CI, Play Developer API access is live, Android IAP is
wired with subscriptions created, and CI auto-publish is enabled. The Play
Store listing/compliance content is drafted but not yet submitted, and the
Android functions deploy is not yet live — Android has not shipped to the
Play Store the way iOS has shipped to the App Store.

## Where the real configuration lives

This doc previously hardcoded a snapshot of the Android `FirebaseOptions`
values (API key, App ID, client ID) as they stood at initial setup. Those
values have since rotated more than once (config refreshes, org migration —
see git history), so a hardcoded copy here silently goes stale. The live
values are always:

- `packages/mobile/android/app/google-services.{dev,staging,prod}.json`
  (+ the unsuffixed default used by the active build)
- `packages/mobile/config/{env}/android/...`
- `packages/mobile/lib/firebase_options.dart` (generated; do not hand-edit —
  regenerate via `firebase apps:sdkconfig ANDROID <appId> --project <project>`
  or the FlutterFire CLI)

To pull the current values for a given environment:

```bash
firebase apps:sdkconfig ANDROID <android-app-id> --project vehicle-vitals-{dev,staging,prod}
```

## Package name

`com.vehiclevitals.app.android`

## Firebase services in use

- Authentication
- Firestore
- Cloud Messaging
- Crashlytics

## Verifying the setup

```bash
npm run firebase:test-mobile
```

See `docs/ENVIRONMENT_SETUP.md` for the full per-environment picture and
`docs/DEVELOPER_GUIDE.md` for general mobile dev setup.
