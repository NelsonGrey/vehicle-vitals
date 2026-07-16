# Staging -> Production Readiness Report

Generated (UTC): Mon Jun 15 20:20:38 UTC 2026

## Branch Divergence

- production branch: main
- main ahead of staging: 18
- staging ahead of main: 599
- staging ahead of develop: 3
- develop ahead of staging: 150

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
0fa40a0 chore(release): constrain dependabot queue
85b4d3a chore(release): add gate 2 evidence capture
f3c9dba docs(release): record gate 2 launch evidence
f05a8d9 docs(release): sync gate 2 go-live evidence
ce6d530 chore(release): stabilize go-live readiness
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
```

## Commit Delta (main..staging)

```text
7b247ff fix(web): apply production firebase fallback when env vars missing
8528081 chore(ci): normalize git author identity metadata on branch staging
4e4505c fix(staging-apphosting): add root runtime start entrypoint
e6d9f2d fix(mobile): restore csv export compile and rename app header to Garage
7030897 feat(mobile): add entitlement parity, provider prefs, and excel export
dae3776 Fix functions billing lint and align monetization status table formatting
aa1bd9c Remove generated Playwright test result artifacts
94880a0 Implement enterprise admin foundations with docs and test coverage updates
d503416 Match inline ad styling with header ad
c309946 Polish web UI consistency across layouts and pages
be9003f Update MONETIZATION_IMPLEMENTATION.md with latest tier adjustments
8fc6b04 Add Enterprise tier for 25+ vehicles and reduce Premium limit to 25
30fe9bd Adjust subscription tiers to prevent unlimited license exploitation
617290f Move inline body ad to bottom of content to separate from header ad bar
d5d5495 fix(plans): make /subscription public and standardize page width
68fd50d feat(ads): standardize Sponsored label and wire all 6 ad placements
8486ade feat(nav): move Plans link to marketing section
ce6d9bb test(monetization): add coverage for quota, subscription, analytics services
3f5448b fix(web): prevent invalid ad placement runtime crash
60782b4 test(uat): make auth-dependent flows deployment-aware
6df22df feat(monetization): implement web gating flows, docs, and UAT coverage
cfac02f ci(uat): target BASE_URL by environment
ff86f2d ci(web): derive VITE_ENVIRONMENT from resolved firebase project
b715ec5 ci(staging): fallback to firestore-only on bucket region error
eedc85a ci(staging): fallback to develop/canonical web firebase secrets
e772e86 test: stabilize mobile smoke test and UAT auth flow
3a0c9fb docs(ci): add guarded staging-to-production PR helper
022218b docs(ci): add staging-to-production runbook and readiness automation
a03ca7a test(web): avoid strict-mode multi-match in landing UAT
3ca0954 Enforce setup-only environment promotion policy
```

## Commit Delta (staging..main)

```text
20b3f67 Apply production Google tag runtime + CI wiring (#68)
a31358f chore(ci): normalize git author identity metadata on branch main
fe47819 chore(ci): trigger App Hosting rollout with updated author identity on main
4f6086b fix(apphosting): restore proven root runtime and keep web start
df4b9b4 fix(apphosting): add root start command for web preview runtime
3946730 chore(apphosting): remove temporary root start workaround
630e26a fix(apphosting): add explicit root start server for PORT 8080
a0a59ff fix(ci): use uppercase deploy environment names for secret scoping
e64f207 fix(ci): provide explicit firebase service account per environment
ee2aa9c ci: make security audit non-blocking in website pipeline
bf09d39 chore(deps): apply npm audit fix (non-breaking)
9fecfbc test(web): stabilize data export date assertions across CI timezones
8549bc5 fix(web): resolve shared workspace imports in Vite build
270f13a chore(ci): make mobile and emulator workflows manual-only
0635d91 fix(web): resolve shared workspace imports in tsc checks
0e96276 fix: correct web package path in emulator-tests workflow
876048a fix: build shared package before type-check in CI
e8c1ada fix: stabilize CI test pipeline on main
```

## Changed Files Summary (develop...staging)

```text
package.json
packages/web/src/shared/firebaseConfig.js
scripts/apphosting-server.js
```

## Changed Files Summary (main...staging)

```text
.cicd/projects/vehicle-vitals.yml
.env.automation.development.example
.env.example
.eslintrc.json
.firebase/.graphqlrc
.firebase/hosting.cGFja2FnZXMvd2ViL2Rpc3Q.cache
.firebase/hosting.d2ViL2Rpc3Q.cache
.firebaserc
.gemini/extensions/firebase/FIREBASE.md
.gemini/extensions/firebase/contexts/FIREBASE-BASE.md
.gemini/extensions/firebase/gemini-extension.json
.github/actions/setup-firebase/action.yml
.github/actions/setup-flutter/action.yml
.github/actions/setup-node/action.yml
.github/workflows/android-distribution.yml
.github/workflows/archive/android-distribution.yml
.github/workflows/archive/api-key-health-check.yml
.github/workflows/archive/automated-staging-deploy.yml
.github/workflows/archive/ci-cd-pipeline.yml
.github/workflows/archive/emulator-tests.yml
.github/workflows/archive/ios-app-distribution.yml
.github/workflows/archive/ios-release-pipeline.yml
.github/workflows/archive/security-scan.yml
.github/workflows/archive/test-asc-auth.yml
.github/workflows/archive/test-runner.yml
.github/workflows/archive/test-secrets.yml
.github/workflows/archive/test-self-hosted.yml
.github/workflows/archive/web-deployment.yml
.github/workflows/archive/workflow-monitoring.yml
.github/workflows/emulator-tests.yml
.github/workflows/firebase-deploy.yml.backup.deprecated
.github/workflows/ios-distribution.yml
.github/workflows/master-pipeline.yml
.github/workflows/test-events/push.json
.github/workflows/test-events/workflow_dispatch.json
.gitignore
.gitignore.old
.npmrc
.nvmrc
.prettierrc.json
DEPLOYMENT_STATUS.md
Dockerfile.monitor
Dockerfile.runner
NOTES.md
README.md
REQUIREMENTS.md
artifacts/smoke/ios-smoke-start.png
artifacts/smoke/r1-export-mobile-csv-2026-05-06T21-34-24-232Z.csv
artifacts/smoke/r1-export-mobile-pdf-2026-05-06T21-34-24-391Z.pdf
artifacts/smoke/r1-export-parity-report-2026-05-06T21-34-24-232Z.md
artifacts/smoke/r1-export-parity-report-2026-05-06T21-34-24-391Z.md
artifacts/smoke/r1-export-parity-report-20260413T193203Z.md
artifacts/smoke/r1-export-parity-report-20260507T174923Z.md
artifacts/smoke/r1-export-web-csv-2026-05-06T21-34-24-232Z.csv
artifacts/smoke/r1-export-web-pdf-2026-05-06T21-34-24-391Z.pdf
artifacts/smoke/r1-gate2-acceptance-20260508-checklist.md
artifacts/smoke/r1-mobile-acceptance-20260507T175704Z.log
artifacts/smoke/r1-mobile-backend-traffic-20260507T175704Z.log
automate.sh
automate.sh.broken
configure-runners.sh
dataconnect/.dataconnect/pgliteData/pg17/.s.PGSQL.5432.lock.out
dataconnect/.dataconnect/pgliteData/pg17/PG_VERSION
dataconnect/.dataconnect/pgliteData/pg17/base/1/112
dataconnect/.dataconnect/pgliteData/pg17/base/1/113
dataconnect/.dataconnect/pgliteData/pg17/base/1/1247
dataconnect/.dataconnect/pgliteData/pg17/base/1/1247_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/1247_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/1249
dataconnect/.dataconnect/pgliteData/pg17/base/1/1249_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/1249_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/1255
dataconnect/.dataconnect/pgliteData/pg17/base/1/1255_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/1255_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/1259
dataconnect/.dataconnect/pgliteData/pg17/base/1/12596
dataconnect/.dataconnect/pgliteData/pg17/base/1/12596_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12596_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12599
dataconnect/.dataconnect/pgliteData/pg17/base/1/1259_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/1259_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12600
dataconnect/.dataconnect/pgliteData/pg17/base/1/12601
dataconnect/.dataconnect/pgliteData/pg17/base/1/12601_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12601_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12604
dataconnect/.dataconnect/pgliteData/pg17/base/1/12605
dataconnect/.dataconnect/pgliteData/pg17/base/1/12606
dataconnect/.dataconnect/pgliteData/pg17/base/1/12606_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12606_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12609
dataconnect/.dataconnect/pgliteData/pg17/base/1/12610
dataconnect/.dataconnect/pgliteData/pg17/base/1/12611
dataconnect/.dataconnect/pgliteData/pg17/base/1/12611_fsm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12611_vm
dataconnect/.dataconnect/pgliteData/pg17/base/1/12614
dataconnect/.dataconnect/pgliteData/pg17/base/1/12615
dataconnect/.dataconnect/pgliteData/pg17/base/1/1417
dataconnect/.dataconnect/pgliteData/pg17/base/1/1418
dataconnect/.dataconnect/pgliteData/pg17/base/1/16444
dataconnect/.dataconnect/pgliteData/pg17/base/1/16445
dataconnect/.dataconnect/pgliteData/pg17/base/1/16446
dataconnect/.dataconnect/pgliteData/pg17/base/1/16447
dataconnect/.dataconnect/pgliteData/pg17/base/1/16448
dataconnect/.dataconnect/pgliteData/pg17/base/1/16449
dataconnect/.dataconnect/pgliteData/pg17/base/1/16450
dataconnect/.dataconnect/pgliteData/pg17/base/1/16451
dataconnect/.dataconnect/pgliteData/pg17/base/1/16452
dataconnect/.dataconnect/pgliteData/pg17/base/1/16453
dataconnect/.dataconnect/pgliteData/pg17/base/1/16454
dataconnect/.dataconnect/pgliteData/pg17/base/1/16455
dataconnect/.dataconnect/pgliteData/pg17/base/1/16456
dataconnect/.dataconnect/pgliteData/pg17/base/1/16457
dataconnect/.dataconnect/pgliteData/pg17/base/1/16458
dataconnect/.dataconnect/pgliteData/pg17/base/1/16459
dataconnect/.dataconnect/pgliteData/pg17/base/1/16460
dataconnect/.dataconnect/pgliteData/pg17/base/1/16461
dataconnect/.dataconnect/pgliteData/pg17/base/1/16462
dataconnect/.dataconnect/pgliteData/pg17/base/1/16463
dataconnect/.dataconnect/pgliteData/pg17/base/1/174
```

## Production Secret Name Presence

- Unable to query secrets via gh CLI in this environment.

## Promotion Decision

- Result: **NO-GO**
- Blocking reasons:
  - Latest staging workflow is not successful
  - Unable to query repository secrets (insufficient gh permissions or auth)
