# Firebase Configuration Strategy

Last verified: July 20, 2026

## Projects and Branches

| Environment | Firebase project | Public branch |
| --- | --- | --- |
| Development | `vehicle-vitals-dev` | `develop` |
| Staging | `vehicle-vitals-staging` | `staging` |
| Production | `vehicle-vitals-prod` | `main` |

Aliases are defined in `.firebaserc`. Environment-specific Hosting/Firestore/
Storage/Functions configuration is in `firebase.dev.json`,
`firebase.staging.json`, and `firebase.prod.json`; `firebase.json` is the
default/emulator configuration.

## Web Client

Source: `packages/web/src/shared/firebaseConfig.ts`.

The web client consumes `VITE_FIREBASE_*` variables, validates required fields
and environment/project alignment, supports emulator configuration, and maps
Firebase hosting domains to canonical origins. Use the package/root sanitized
build scripts so inherited shell variables do not select the wrong project.

Do not reintroduce the removed `firebaseConfig.js` path in documentation.

## Flutter Client

Source: `packages/mobile/lib/firebase_options.dart` plus environment-specific
platform files documented in `packages/mobile/config/README.md`.

The CI iOS guard selects the target plist, verifies its `PROJECT_ID`, and copies
it into the Runner target before a build. Do not run `flutterfire configure`
without a plan to preserve all environments and the production bundle ID.

## Shared Packages

`packages/shared/src/firebaseConfig.js` is a legacy-compatible shared helper;
the web app uses its own TypeScript config and Flutter uses native Firebase
options. Prefer the platform-specific initialization path for new code.

`packages/firebase-utils` exposes SDK helpers but does not own environment
selection or product authorization.

## Server Configuration

There is no tracked `packages/api-server`. Server-side Firebase Admin setup and
Cloud Functions live in the private
`NelsonGrey/vehicle-vitals-functions` companion, mounted at
`packages/functions` for local work and CI.

Functions runtime secrets belong in Firebase Secret Manager. CI access to the
private repository uses the GitHub repository secret `FUNCTIONS_REPO_PAT`.

## Credential Rules

- Firebase client configuration identifies a client/project; it is not a
  Firebase Admin credential.
- Never commit service-account JSON, private keys, tokens, provider secrets, or
  production test credentials.
- Keep environment/project ID validation enabled.
- Protect non-production data through authentication, rules, callable
  authorization, and App Check, and preserve noindex headers.
- Verify secret names against `master-pipeline.yml`; do not assume similarly
  named GitHub Environment secrets are consumed.

See `ENVIRONMENT_SETUP.md`, `PROD_SETUP_GUIDE.md`, and `DEPLOY.md`.
