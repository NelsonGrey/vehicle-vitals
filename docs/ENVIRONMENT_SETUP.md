# Environment Setup Guide

Last reviewed: July 20, 2026

Vehicle Vitals uses three Firebase projects and one active GitHub Actions
workflow. This guide covers names and procedures only; never commit or document
secret values.

## Environment Map

| Branch | Target | Firebase project | Hosted URL | Hosting config |
| --- | --- | --- | --- | --- |
| `develop` | development | `vehicle-vitals-dev` | `https://vehicle-vitals-dev.web.app` | `firebase.dev.json` |
| `staging` | staging | `vehicle-vitals-staging` | `https://vehicle-vitals-staging.web.app` | `firebase.staging.json` |
| `main` | production | `vehicle-vitals-prod` | `https://vehicle-vitals.com` | `firebase.prod.json` |

`firebase.json` is the base local/emulator configuration. The environment files
define Hosting rewrites and headers. Development and staging set
`X-Robots-Tag: noindex, nofollow`; production does not.

## Repository Boundary

The public repository contains web, mobile, shared packages, Firebase rules,
indexes, Hosting configuration, and CI/CD. Cloud Functions live in the private
`NelsonGrey/vehicle-vitals-functions` companion repository. Clone or mount that
repository at the gitignored `packages/functions` path for full Firebase local
validation or deployment. CI checks it out there with `FUNCTIONS_REPO_PAT`.

## Local Web Setup

From the repository root:

```bash
npm ci
cp packages/web/.env.example packages/web/.env.development
```

Populate the Firebase web-client values for the development project, then run:

```bash
npm --prefix packages/web run dev
```

The minimum web Firebase variables are:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_ENVIRONMENT
VITE_APP_URL
```

Client Firebase configuration values identify a Firebase app; backend access
must be protected by rules, authentication, App Check, and server-side secret
storage. Never put private service-account credentials or Functions runtime
secrets in a `VITE_*` variable.

Useful optional variables are documented in `packages/web/.env.example`:

- `VITE_USE_FIREBASE_EMULATORS`
- `VITE_SHOW_COMING_SOON`
- `VITE_MARKETING_ONLY_MODE`
- `VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS`
- `VITE_ENABLE_ADS`
- GTM and AdSense identifiers/slots
- `VITE_IOS_APP_STORE_URL`

## Mobile Setup

The Flutter app uses environment-specific Firebase files under
`packages/mobile/config/<environment>/` plus generated FlutterFire options.
Follow `IOS_FIREBASE_SETUP.md`, `ANDROID_FIREBASE_SETUP.md`, and
`packages/mobile/config/README.md` for exact paths.

iOS automation is currently disabled in `.cicd/projects/vehicle-vitals.yml`.
Android is disabled and on hold. Do not infer store-release status solely from
the presence of configuration files.

## GitHub Repository Secrets

The active workflow reads repository-level Actions secrets. It does not bind
deployment jobs to GitHub Environments, so similarly named Environment secrets
are not substitutes unless the workflow is changed.

Required groups include:

- `FUNCTIONS_REPO_PAT` for the private companion checkout.
- `FIREBASE_TOKEN` for the Firebase CLI authentication used by the current
  workflow.
- Environment-suffixed `VITE_FIREBASE_*_DEVELOPMENT`,
  `VITE_FIREBASE_*_STAGING`, and `VITE_FIREBASE_*_PRODUCTION` web values.
- `FIREBASE_PROJECT_DEV`, `FIREBASE_PROJECT_STAGING`, and
  `FIREBASE_PROJECT_PROD` when overriding the workflow defaults.
- Production GTM and AdSense configuration where those integrations are
  enabled.
- Mobile signing and App Store Connect credentials only when iOS automation is
  re-enabled.

See `PROD_SETUP_GUIDE.md` for the complete active production-oriented secret
name inventory.

## Build-Time Flags and Runtime Controls

`VITE_SHOW_COMING_SOON` is selected from the corresponding
`VITE_SHOW_COMING_SOON_<ENVIRONMENT>` repository secret by CI. Other Vite flags
are compiled into the web bundle and require a rebuild to change.

Firebase Remote Config `app_offline` is fetched at runtime and disables public
app-entry links without a rebuild. It is not a replacement for backend
authorization.

The workflow still validates legacy password or OAuth-allowlist variables for
development and staging, but the current client does not consume them. See
`SECURE_ENVIRONMENTS.md`; do not rely on these values as an access boundary.

## Functions Runtime Secrets

Third-party provider credentials used by Cloud Functions belong in Firebase
Functions/Google Secret Manager and are managed from the private companion
repository. Keep them out of the public repository, Vite env files, and
documentation. Exact required runtime-secret names must be verified against the
companion repository before deployment.

## Emulators and Validation

With the Functions companion mounted and dependencies installed:

```bash
firebase emulators:start --config firebase.json
```

Before promoting an environment, run the local checks in
`TESTING_INSTRUCTIONS.md`, then use the branch workflow documented in
`DEPLOY.md`. After deployment, verify the hosted app, security headers,
authentication boundary, rules, callable behavior, and environment/project
alignment.

## Changing Configuration Safely

1. Identify whether the setting is a public client value, repository secret,
   Firebase runtime secret, or Remote Config parameter.
2. Update the narrowest appropriate store without printing secret values.
3. Trigger the correct branch deployment or explicit workflow dispatch.
4. Verify the generated build targets the intended Firebase project.
5. Run hosted UAT and record the result in `GO_LIVE_RUNBOOK.md` if release
   posture changed.

The executable sources of truth are `.github/workflows/master-pipeline.yml`,
`.cicd/projects/vehicle-vitals.yml`, the `firebase*.json` files,
`packages/web/src/shared/environment.ts`, and the companion Functions code.
