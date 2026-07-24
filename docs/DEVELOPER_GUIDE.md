# Vehicle-Vitals Developer Guide

Last verified: July 20, 2026

Status: Canonical developer setup and workflow reference. Architecture is in
`ARCHITECTURE.md`; current validation commands are in
`TESTING_INSTRUCTIONS.md`; deployment is in `DEPLOY.md`.

## Prerequisites

- Git and GitHub CLI.
- Node.js 18 or newer and npm 9 or newer. CI currently uses Node 20 for web
  jobs; local validation also succeeds on Node 22.
- Flutter stable. CI currently pins Flutter 3.38.4.
- Xcode and CocoaPods/Fastlane dependencies for iOS work.
- Firebase CLI for emulators and manual diagnostics.
- Access to the private Functions companion for backend work.

Android development is on hold. Do not assume Android release tooling is a
required local prerequisite unless that target is re-enabled.

## Clone and Install

```bash
git clone https://github.com/NelsonGrey/vehicle-vitals.git
cd vehicle-vitals
npm ci

cd packages/mobile
flutter pub get
cd ../..
```

For Cloud Functions work:

```bash
git clone git@github.com:NelsonGrey/vehicle-vitals-functions.git packages/functions
npm run build --workspace=@vehicle-vitals/shared
cd packages/functions
VV_SHARED_DIST=../shared/dist npm run vendor:shared
npm ci
```

`packages/functions` is gitignored in this public repository and is populated
the same way by CI during Firebase deployment.

## Repository Map

```text
packages/web             React/Vite web app, public site, authenticated app, UAT
packages/mobile          Flutter app and platform projects
packages/shared          Shared types, calculations, and Firestore routing
packages/firebase-utils  Firebase SDK helper package
packages/functions       Optional private companion checkout (not tracked here)
firebase/                Firestore and Storage rules
scripts/                 Build, smoke, release, media, and operational helpers
tools/                   Setup and Firebase diagnostic helpers
docs/                    Canonical, supporting, planning, and historical docs
```

Use `docs/README.md` before relying on a dated plan/checklist.

## Local Configuration

Start with the examples:

```bash
cp .env.example .env.local
cp packages/web/.env.example packages/web/.env.development.local
```

Only use local, non-production values. Do not commit `.env` files, provider
credentials, App Store keys, Firebase service-account JSON, or test-user
credentials.

Web Firebase configuration is selected through `VITE_FIREBASE_*` variables and
the sanitized environment scripts. Review `ENVIRONMENT_SETUP.md` and
`packages/web/src/shared/firebaseConfig.ts` for the current validation rules.

Mobile Firebase environment files live under `packages/mobile/config` with
tracked runner fallbacks. See `packages/mobile/config/README.md` and
`IOS_FIREBASE_SETUP.md`.

## Run the Applications

### Web

```bash
npm run dev:web
```

The root script invokes the web package's sanitized development environment.

### Mobile

```bash
cd packages/mobile
flutter run -d ios
```

### Firebase emulators

With the private Functions checkout mounted:

```bash
firebase emulators:start \
  --only auth,firestore,storage,functions,hosting \
  --project vehicle-vitals-dev
```

Without the companion checkout, restrict the emulator list to public-repo
components and do not treat the result as backend validation.

## Standard Validation

```bash
npm ci
npm run check
npm run test:unit:all
npm run test:scripts
npm run build:web

cd packages/mobile
flutter analyze
```

Run Functions build/lint/tests in the private checkout when backend contracts or
shared code change. See `TESTING_INSTRUCTIONS.md` for focused and hosted UAT
commands.

## Branch and Environment Workflow

| Branch | Firebase environment | Role |
| --- | --- | --- |
| `develop` | development | integration |
| `staging` | staging | release validation |
| `main` | production | live release |

Typical change flow:

1. Branch from current `develop` unless release policy says otherwise.
2. Make the smallest coherent change and update owning documentation/tests.
3. Run proportionate local validation.
4. Open a pull request to `develop`.
5. Promote through reviewed `develop` -> `staging` -> `main` changes.
6. Coordinate matching companion-repository promotions when Functions or shared
   contracts are involved.

Compare long-lived branch trees as well as ahead/behind counts. Squash/merge
promotion history makes raw commit counts noisy.

## Web Conventions

- Route composition belongs in `packages/web/src/App.tsx`.
- Components consume authentication through `AuthContext` or service
  abstractions, not ad hoc `auth.currentUser` access.
- Create vehicles from the shared `defaultVehicle` shape and preserve backward
  compatibility for stored records.
- Customer-facing capability labels follow `LAUNCH_CLAIMS_MATRIX.md` and
  canonical navigation metadata.
- Keep persisted/internal identifiers stable when a presentation label changes.
- Use `useSubscription()`/effective entitlements for UI presentation; never
  rely on client flags as the security boundary.
- Preserve responsive behavior for short laptop viewports as well as mobile.
- Use environment/consent-aware analytics helpers instead of direct ungoverned
  tag calls.

## Mobile Conventions

- Routes are centralized in `packages/mobile/lib/main.dart`.
- Keep screen labels aligned with web capability terminology while preserving
  stored values and backend contracts.
- Use garage-scope helpers for personal versus org paths.
- Treat local premium state as a cache; refresh effective entitlements from the
  trusted backend.
- Keep Apple purchase/restore behavior testable and separate from marketing
  fallback prices.
- Generated platform folders are implementation scaffolding, not release-scope
  declarations.

## Shared Package Conventions

- Prefer pure, deterministic functions for calculations.
- Add regression tests for every data-integrity or calculation fix.
- Preserve tolerant parsing for historical Firestore records.
- Update exports in `package.json` and `src/index.js` together.
- Build shared output before web or companion code consumes new exports.
- Changes to garage routing require personal and org-scope tests.

## Firebase and Backend Conventions

- `firebase/firestore.rules` and `firebase/storage.rules` are executable access
  policy sources.
- `firestore.indexes.json` is the index source of truth.
- Privileged, billing, quota, integration, org-role, compliance, and audit work
  belongs in the Functions companion.
- Callable endpoints recheck auth, authorization, input shape/size, idempotency,
  and rate limits.
- Client UI must not write subscription or quota state directly.
- Never broaden rules merely to make a client error disappear; diagnose the
  intended data owner first.

## Adding a Feature

1. Identify product owner/source: product design, requirements, launch claims,
   or an approved plan.
2. Define client, shared, rules/index, and backend contract changes.
3. Decide whether personal and org-scoped garages both apply.
4. Add unit tests at the lowest useful layer.
5. Add hosted UAT for release-critical customer flows.
6. Update architecture/data model/requirements documentation when contracts or
   status change.
7. Update `GO_LIVE_RUNBOOK.md` if release risk or evidence changes.

## Troubleshooting Order

1. `git status --short --branch` and upstream synchronization.
2. `npm ci` to detect lockfile/manifests drift.
3. Focused package `check`, tests, then build.
4. Environment/project ID validation.
5. Firebase emulator/rules behavior.
6. Hosted workflow logs.
7. Companion Functions branch, checkout, build, secret binding, and logs.

Do not run installs concurrently with tests, and do not run multiple Flutter
test processes against the same native build output. See `TROUBLESHOOTING.md`
for deeper recovery guidance.

## Pull Request Checklist

- [ ] Scope and target branch are correct.
- [ ] No secrets or environment-specific credential files are included.
- [ ] Local checks/tests/builds appropriate to the change pass.
- [ ] Personal/org data scopes were considered.
- [ ] Rules/index/backend contracts remain aligned.
- [ ] User-facing terminology and responsive behavior remain consistent.
- [ ] Canonical documentation was updated.
- [ ] Companion repository change/promotion is linked when applicable.
- [ ] Release impact is reflected in `GO_LIVE_RUNBOOK.md` when applicable.
