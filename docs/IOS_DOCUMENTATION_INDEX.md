# iOS Documentation Index

Last reviewed: July 20, 2026

The Flutter iOS client is maintained in `packages/mobile`. Automated iOS build
and TestFlight upload are currently disabled in
`.cicd/projects/vehicle-vitals.yml`; verify App Store Connect directly for
external review or storefront status.

## Current References

| Document or source | Use |
| --- | --- |
| `IOS_FIREBASE_SETUP.md` | Environment-specific Firebase plist/options setup |
| `ASC_PRIVATE_KEY_SETUP.md` | App Store Connect API key secret names and handling |
| `IOS_CERTIFICATE_SETUP_GUIDE.md` | Signing setup; sections naming old workflows are legacy |
| `packages/mobile/ios/fastlane/Fastfile` | Executable TestFlight build/upload lane |
| `packages/mobile/ios/fastlane/README.md` | Auto-generated current lane list |
| `.github/workflows/master-pipeline.yml` | Current `build-ios` job |
| `TESTING_INSTRUCTIONS.md` | Current Flutter validation commands |
| `GO_LIVE_RUNBOOK.md` | Current release posture and manual blockers |

## Historical Templates

The following documents are retained for background or reuse but are not
Vehicle Vitals deployment instructions:

- `IOS_CERTIFICATE_QUICK_REFERENCE.md`
- `IOS_CERTIFICATE_SETUP_SUMMARY.md`
- `IOS_CICD_INTEGRATION_GUIDE.md`
- `IOS_PROJECT_TEMPLATE.md`
- `BETA_TESTING_GUIDE.md`

They may reference a removed `ios-distribution.yml`, generic bundle IDs,
certificate repositories, or inactive distribution channels. Do not execute
their copy/paste examples against the current project.

## Current Validation Sequence

From `packages/mobile`:

```bash
flutter pub get
flutter analyze
flutter test
flutter build ios --release --no-codesign
```

Before a signed upload, verify the intended Firebase plist, bundle ID,
entitlements, privacy declarations, signing identity, App Store Connect key,
build number, and review metadata. Re-enable the iOS target in the project
manifest only for an intentional build/upload run.
