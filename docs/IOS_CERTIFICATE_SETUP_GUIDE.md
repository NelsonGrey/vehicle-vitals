# iOS Signing and TestFlight Setup

Last reviewed: July 20, 2026

Vehicle Vitals currently uses automatic Xcode signing plus an App Store Connect
API key in the Fastlane `beta` lane. Older Match and standalone
`ios-distribution.yml` instructions have been retired.

Automated iOS execution is disabled in `.cicd/projects/vehicle-vitals.yml`.
Re-enable it only for an intentional staging or production build/upload.

## Executable Sources

- Bundle ID and signing settings:
  `packages/mobile/ios/Runner.xcodeproj/project.pbxproj`
- App Store app identifier: `packages/mobile/ios/fastlane/Appfile`
- Signed build and TestFlight upload: `packages/mobile/ios/fastlane/Fastfile`
- GitHub job and secret injection:
  `.github/workflows/master-pipeline.yml`, job `build-ios`
- Firebase plist selection: `IOS_FIREBASE_SETUP.md`

The current iOS bundle ID is `com.vehiclevitals.app.ios`.

## Required Repository Secrets

- `FASTLANE_TEAM_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY`

The workflow passes the target environment as `FIREBASE_ENV`. The Fastlane lane
accepts a raw or base64-encoded App Store Connect private key and creates only a
temporary key file during the run.

Never commit the `.p8` key, print it in logs, place it in a `VITE_*` variable,
or paste it into documentation. Use the least-privileged App Store Connect role
that supports the intended upload and rotate a key immediately if exposed.

## Creating the App Store Connect API Key

1. In App Store Connect, open Users and Access and the current Integrations/API
   keys area.
2. Create a team API key with the minimum needed access.
3. Record the key ID and issuer ID.
4. Download the `.p8` file once and store it in the repository Actions secrets
   as `APP_STORE_CONNECT_KEY`.
5. Store the other identifiers using the exact names above.

Use `ASC_PRIVATE_KEY_SETUP.md` as the short secret-entry reference.

## Local Unsigned Validation

From `packages/mobile`:

```bash
flutter pub get
flutter analyze
flutter test
flutter build ios --release --no-codesign
```

This validates compilation but not distribution signing, entitlements, the
App Store record, or purchase products.

## Intentional Signed Upload

Before enabling the target:

1. Verify the selected Firebase plist project ID matches staging or production.
2. Verify the bundle ID, Apple team, version, and build number.
3. Verify App Store privacy, purchase products, review metadata, export
   compliance, and deletion/support flows.
4. Verify the four repository secrets exist without printing their values.
5. Set `targets.ios.enabled: true` in
   `.cicd/projects/vehicle-vitals.yml` in the release change.
6. Run the normal protected branch pipeline. The iOS job is eligible only for
   staging or production `build_all`/`build_and_deploy` contexts after the
   quality gate.

The job runs, from `packages/mobile/ios`:

```bash
FIREBASE_ENV="$TARGET_ENV" bundle exec fastlane beta
```

The lane validates the plist project, applies automatic signing, produces
`builds/Vehicle-Vitals.ipa`, and uploads it to TestFlight.

After the intended upload, decide whether the target should remain enabled or
be disabled to avoid unplanned TestFlight builds on later web-only promotions.

## Troubleshooting

- Missing provisioning profile: confirm the team ID, API-key role, bundle ID,
  and automatic-signing access.
- Firebase mismatch: follow `IOS_FIREBASE_SETUP.md`; do not bypass the project
  guard.
- Invalid private key: verify the complete `.p8` content was stored without
  extra quoting or truncation, then rotate if exposure is possible.
- App Store upload rejected: inspect the Fastlane/gym artifacts and App Store
  Connect processing message before changing code or signing.

App Store review and storefront availability are external state. Verify them in
App Store Connect and reflect any change in `GO_LIVE_RUNBOOK.md`.
