# CI/CD Workstreams (vehicle-vitals)

## Requirements

- iOS distribution is zero-touch:
  - ASC API key auth via secrets.
  - Match HTTPS token access to `mnelson3/nelson-grey`.
  - Ephemeral keychain wrapper for signing.
- Branch/environment mapping is correct.
- Self-hosted runners are resilient (auto-restart + watchdog).

## Current state

- iOS distribution workflow: [vehicle-vitals/.github/workflows/ios-app-distribution.yml](../.github/workflows/ios-app-distribution.yml)
- iOS release pipeline: [vehicle-vitals/.github/workflows/ios-release-pipeline.yml](../.github/workflows/ios-release-pipeline.yml)
- Token refresh health check LaunchAgent: [vehicle-vitals/com.vehicle-vitals.runner-token-refresh.plist](../com.vehicle-vitals.runner-token-refresh.plist)

## Workstreams

### WS1 — iOS distribution (DONE)

Acceptance:

- `workflow_dispatch` with `testflight` and `app_store` completes unattended on the `vehicle-vitals-macos-runner`.

### WS2 — Runner reliability (IN PROGRESS)

Deliverables:

- Ensure macOS runner is installed as a persistent service with `KeepAlive`.
- Add watchdog/recovery scripts in `vehicle-vitals-actions-runner`.

### WS3 — Docker runner reliability (IN PROGRESS)

Deliverables:

- Ensure the periodic token/health check is installed on the docker runner host.
- Health check restarts container if missing.

## Dependencies / Secrets

Required secrets (per repo environment):

- Apple: `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY`, `FASTLANE_APPLE_ID`, `FASTLANE_TEAM_ID`, `FASTLANE_ITC_TEAM_ID`
- Match: `MATCH_GIT_URL_TOKEN`, `MATCH_PASSWORD`
- Firebase: `FIREBASE_SERVICE_ACCOUNT_KEY_DEVELOPMENT`, `FIREBASE_SERVICE_ACCOUNT_KEY_STAGING`, `FIREBASE_SERVICE_ACCOUNT_KEY_PRODUCTION`
