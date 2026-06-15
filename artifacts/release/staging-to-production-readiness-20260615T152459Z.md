# Staging -> Production Readiness Report

Generated (UTC): Mon Jun 15 15:25:00 UTC 2026

## Branch Divergence

- production ahead of staging: 0
- staging ahead of production: 0
- staging ahead of develop: 3
- develop ahead of staging: 145

## Latest Staging Workflow

- run id: unknown
- status: unknown
- conclusion: unknown

## Commit Delta (develop..staging)

```text
7b247ff fix(web): apply production firebase fallback when env vars missing
8528081 chore(ci): normalize git author identity metadata on branch staging
4e4505c fix(staging-apphosting): add root runtime start entrypoint
```

## Commit Delta (staging..develop)

```text
ffc2edd Commit remaining local changes
74c6bfb Rename VIN Decode to VIN Lookup in marketing nav
2886b74 Fix marketing stylesheet generation
dd22928 Stabilize Firefox profile UAT
a5a176d Fix hosted environment routing
6820214 Disable coming soon gate in production
9a9df50 Allow Google auth scripts in CSP
d511518 Allow Google analytics collection in CSP
c6d333a Limit production deploy-only to web targets
321a74f Allow production hosting fallback deploy
4029f2c Fix production web deploy workflow
1f726c8 Allow deploy-only web builds to run
301546e Add hosting security headers for web environments
cbacf6e Allow Google Tag Manager in CSP
5861609 Fix web ErrorBoundary imports
e26b679 Sync workspace lockfile for functions ESLint
8c22775 Fix functions ESLint peer conflict
19c60ee Remove redundant Firestore composite indexes
62231a9 Make Firefox offline UAT browser-safe
31c75fc Fix redundant Firestore vehicles index
918341b Fix functions build for TypeScript 6
17fb4f8 Fix functions lint for Firebase deploy
5350332 Switch CI deploy back to Firebase Hosting
bcf5587 Resolve firebase-admin firestore import collision
d970842 Use explicit firebase-admin APIs
2f4f98e Use default firebase-admin import
7feddc7 Align firebase-utils admin imports
a7eed2f Fix Firebase server build typing
3b60961 Fix Firebase build resolution
edbafaa Fix web export test mocks
```

## Changed Files Summary (develop...staging)

```text
package.json
packages/web/src/shared/firebaseConfig.js
scripts/apphosting-server.js
```

## Production Secret Name Presence

- Unable to query secrets via gh CLI in this environment.

## Promotion Decision

- Result: **NO-GO**
- Blocking reasons:
  - Latest staging workflow is not successful
  - Unable to query repository secrets (insufficient gh permissions or auth)
