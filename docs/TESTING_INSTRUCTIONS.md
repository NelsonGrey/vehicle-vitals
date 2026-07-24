# Vehicle-Vitals Testing Instructions

Last verified: July 20, 2026

This is the current command-level testing reference. Detailed Playwright cases
remain in `packages/web/UAT_TESTING.md`; dated R1 evidence remains in
`R1_COMPLETION_CHECKLIST.md` and `artifacts/smoke/`.

## Prerequisites

- Node.js compatible with the root `engines` field (CI currently uses Node 20;
  local validation used Node 22).
- npm 9 or newer.
- Flutter stable; CI currently pins Flutter 3.38.4.
- Xcode/macOS for iOS builds.
- Firebase CLI for emulator/rules validation.
- Private Functions companion checkout for backend tests/emulation.

Install JavaScript dependencies before running other npm commands:

```bash
npm ci
```

Do not run `npm ci` concurrently with npm checks/tests because it replaces
`node_modules`.

## Standard Local Gate

Run from the repository root:

```bash
npm run check
npm run test:unit:all
npm run test:scripts
npm run build:web
```

`test:unit:all` runs web unit tests and Flutter tests. On July 20, 2026 the
baseline passed with 438 web tests and 92 mobile tests. Script tests passed 9/9.

Run Flutter analysis separately:

```bash
cd packages/mobile
flutter analyze
```

Avoid running two Flutter test processes against the same package concurrently;
native-asset build outputs can collide.

## Focused Package Commands

### Web

```bash
npm --workspace=@vehicle-vitals/web run check
npm --workspace=@vehicle-vitals/web run lint
npm --workspace=@vehicle-vitals/web run test:unit
npm --workspace=@vehicle-vitals/web run build:production
```

The production build currently succeeds with non-blocking large-chunk and
ineffective-dynamic-import warnings.

### Shared package

```bash
npm --workspace=@vehicle-vitals/shared run check
npm --workspace=@vehicle-vitals/shared run test
npm --workspace=@vehicle-vitals/shared run build
```

### Firebase utilities

```bash
npm --workspace=@shared/firebase-utils run check
npm --workspace=@shared/firebase-utils run build
```

### Mobile

```bash
cd packages/mobile
flutter pub get
flutter analyze
flutter test
flutter build ios --release --no-codesign
```

The no-codesign build validates compilation but does not prove signing,
TestFlight upload, App Store review, or production Firebase behavior.

### Functions companion

```bash
git clone git@github.com:NelsonGrey/vehicle-vitals-functions.git packages/functions
npm run build --workspace=@vehicle-vitals/shared
cd packages/functions
VV_SHARED_DIST=../shared/dist npm run vendor:shared
npm ci
npm run build
npm run lint
npm test
```

Use the companion repository's current scripts if they differ. The public root
test command does not test private backend source unless that checkout is
present and explicitly invoked.

## Playwright UAT

Local default (starts the Vite dev server):

```bash
npm --workspace=@vehicle-vitals/web run test:uat:chromium
```

Run against a hosted target:

```bash
BASE_URL=https://vehicle-vitals-staging.web.app \
  npm --workspace=@vehicle-vitals/web run test:uat:chromium

BASE_URL=https://vehicle-vitals.com \
  npm --workspace=@vehicle-vitals/web run test:uat:all
```

The CI matrix runs Chromium, Firefox, and WebKit with retries enabled. A skipped
test means its prerequisite UI was not exposed on that target; it is not proof
that the underlying feature works.

Current known issue: `main` workflow run `29701153138` failed production
Chromium `TC-UI-010` because the test expected `Ownership Records` as the first
marketing navigation item while production rendered `Getting Started`.
`TC-UI-007` was also flaky on the expected proof heading. Reconcile the product
contract and test before the next production deployment.

## Firebase Emulator and Rules

With the Functions companion mounted:

```bash
firebase emulators:start --only auth,firestore,storage,functions,hosting \
  --project vehicle-vitals-dev
```

Public-repo Firestore test entry point:

```bash
npm run test:emulator
```

Rules source files are `firebase/firestore.rules` and
`firebase/storage.rules`. `docs/FIRESTORE_MONETIZATION_RULES.md` explains rule
intent but is not deployable source.

## GitHub Actions

The only active workflow is `Master CI/CD Pipeline` in
`.github/workflows/master-pipeline.yml`.

```bash
gh workflow run master-pipeline.yml \
  -f action=test_all \
  -f environment=development
```

Pushes to `develop`, `staging`, and `main` run deploy-capable paths for their
mapped environments. Pull requests run tests against development. The Quality
Gate requires web unit tests, mobile unit tests, and the complete browser UAT
matrix.

Do not look for separate active `Emulator Tests` or `iOS Distribution`
workflows; those names survive only in historical documentation. iOS build
logic is inside the master pipeline and is currently disabled by the project
manifest.

## Evidence to Capture for a Release

- Commit SHA and clean working-tree state.
- Exact command and pass/fail totals.
- Workflow run URL and target environment.
- Browser matrix results and skip reasons.
- Functions companion commit/branch and test result.
- Hosted smoke-test account/context without exposing credentials.
- Firebase logs for critical backend flows.
- iOS build, purchase/restore, and App Store evidence when applicable.

Update `GO_LIVE_RUNBOOK.md` when evidence changes the release posture.
