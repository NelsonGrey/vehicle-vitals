# iOS Signing and CI/CD

**Status**: Active — this is how the shipped 1.0 App Store build is actually
signed and delivered. Last updated: September 1, 2026.

This replaces 7 older docs (`IOS_CERTIFICATE_QUICK_REFERENCE`,
`IOS_CERTIFICATE_SETUP_GUIDE`, `IOS_CERTIFICATE_SETUP_SUMMARY`,
`IOS_CICD_INTEGRATION_GUIDE`, `IOS_DOCUMENTATION_INDEX`, `IOS_PROJECT_TEMPLATE`,
`ASC_PRIVATE_KEY_SETUP`) that described a **Fastlane Match + separate
certificate-repository** approach. That approach was never the live setup for
Vehicle-Vitals — those docs were generic "reusable template for any new iOS
project" material. The actual, current approach is **App Store Connect API
key + Xcode automatic signing**, with no certificate repo and no Match.

## How signing actually works here

- `packages/mobile/ios/fastlane/Fastfile`'s `ensure_xcode_automatic_signing!`
  forces the `Runner` (and `RunnerTests`) target into
  `update_code_signing_settings(use_automatic_signing: true, team_id:)` —
  the project does not default to automatic signing on its own.
- `build_app` (gym) runs with `export_method: "app-store"` and
  `export_options: { signingStyle: "automatic", teamID: }`. Xcode resolves
  certificates/provisioning profiles itself against the ASC API key's
  identity — no `.p12`/`.mobileprovision` files are checked in or fetched
  from a certificate repo.
- Uploads to TestFlight/App Store Connect (`upload_to_testflight`,
  submission calls) authenticate via `app_store_connect_api_key`, built from
  the same ASC API key.

## Required secrets (GitHub Actions)

| Secret | Purpose |
|---|---|
| `FASTLANE_TEAM_ID` | Apple Developer Team ID used for automatic signing |
| `APP_STORE_CONNECT_KEY_ID` | ASC API key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | ASC API key issuer ID |
| `APP_STORE_CONNECT_KEY` | The `.p8` private key content (PEM or base64 — `Fastfile`'s `app_store_api_key` auto-detects and normalizes either form) |

### Creating the ASC API key

1. https://appstoreconnect.apple.com/ → Users and Access → Keys
2. Create a new key with the App Store Connect API key type (Developer role
   is sufficient for CI signing + TestFlight upload; broader access is
   needed only if the key is also used for the direct read/write API access
   described in `reference-app-store-connect-api-key` — see project memory)
3. Download the `.p8` once (Apple won't let you download it again)
4. Set the three secrets above via `gh secret set` or the repo Settings UI

## CI runner and Xcode selection

`.github/workflows/master-pipeline.yml`'s `Build iOS App` job runs on a
macOS GitHub-hosted runner (`macos-latest`; confirmed working end-to-end).
It explicitly selects the latest available **Xcode 26+** before building —
Xcode 16.4 has a known provisioning-profile resolution bug with automatic
signing that newer Xcode versions don't have.

## Verifying the setup

```bash
gh workflow run "Master CI/CD Pipeline" --ref develop -f action=build_all
gh run watch <run-id>
```

Look for the `Build iOS App` job going green — archive/sign/TestFlight
upload all succeed in one step (`fastlane beta`).

## If you ever need Match / a certificate repo instead

Not the current approach here and not recommended unless ASC API key signing
stops working — automatic signing is simpler (no separate repo, no
certificate rotation to manage). If a future project or a future Vehicle-Vitals
need genuinely requires Match, start from Fastlane's own Match docs rather
than reviving the old template docs this file replaced (they were generic
boilerplate, not battle-tested against this repo).
