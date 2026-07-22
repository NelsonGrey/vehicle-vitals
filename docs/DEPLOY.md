# Vehicle-Vitals Deployment Guide

Last verified: July 20, 2026

The active deployment source of truth is
`.github/workflows/master-pipeline.yml`, with target enablement in
`.cicd/projects/vehicle-vitals.yml` and environment-specific Firebase behavior
in `firebase.dev.json`, `firebase.staging.json`, and `firebase.prod.json`.

See `GO_LIVE_RUNBOOK.md` for the current release decision and
`STAGING_TO_PRODUCTION_RUNBOOK.md` for promotion policy.

## Environment Mapping

| Environment | Branch | Firebase alias/project | Hosted URL |
| --- | --- | --- | --- |
| Development | `develop` | `development` / `vehicle-vitals-dev` | `https://vehicle-vitals-dev.web.app` |
| Staging | `staging` | `staging` / `vehicle-vitals-staging` | `https://vehicle-vitals-staging.web.app` |
| Production | `main` | `production` / `vehicle-vitals-prod` | `https://vehicle-vitals.com` |

The Firebase aliases are defined in `.firebaserc`. The production Firebase
hosting alias is also available at `https://vehicle-vitals-prod.web.app`.

## Repository Boundary

Cloud Functions live in the private companion repository
`NelsonGrey/vehicle-vitals-functions`. The pipeline checks it out at the
gitignored `packages/functions` path before Firebase deployment. The
`firebase*.json` files intentionally retain that source path.

Automated deployment requires the repository secret `FUNCTIONS_REPO_PAT`.
Manual deployment or emulator use requires a local companion checkout:

```bash
git clone git@github.com:NelsonGrey/vehicle-vitals-functions.git packages/functions
npm run build --workspace=@vehicle-vitals/shared
cd packages/functions
VV_SHARED_DIST=../shared/dist npm run vendor:shared
```

## Automated Deployment

The master pipeline runs on pull requests and pushes to `develop`, `staging`,
and `main`. Pull requests test against development. Branch pushes default to
`build_and_deploy` for their mapped environment.

Manual dispatch examples:

```bash
gh workflow run master-pipeline.yml \
  -f action=test_all \
  -f environment=development

gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=staging

gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=production
```

The normal deploy path performs unit/UAT gates, builds the web artifact, checks
out the Functions companion, vendors the shared package, and deploys Firestore,
Storage, Functions, and Hosting.

`deploy_only` is exceptional. On production it omits Functions by workflow
design and deploys Firestore, Storage, and Hosting. Record the reason whenever
that reduced target set is used.

## Target Enablement

Current `.cicd/projects/vehicle-vitals.yml` state:

- Web: enabled.
- Firebase: enabled.
- iOS: temporarily disabled; when enabled, staging/production builds use the
  signed Fastlane `beta` lane and TestFlight upload.
- Android: disabled and on hold.
- Chrome extension: not configured/enabled.

## Local Builds

```bash
npm ci
npm run build:development
npm run build:staging
npm run build:production
```

The scripts sanitize inherited `VITE_*` values and select the requested
environment. Local builds use local environment files; CI constructs the web
environment from GitHub secrets.

## Manual Firebase Deployment

Prefer CI so tests, companion checkout, environment selection, and artifact
handling remain reproducible. If a manual deployment is required:

```bash
# From repository root, with packages/functions mounted.
npm ci
npm run check
npm run test:unit:all
npm run build --workspace=@vehicle-vitals/shared

# Select one build/config/alias set.
npm run build:staging
firebase use staging
firebase deploy --config firebase.staging.json \
  --only firestore,storage,functions,hosting
```

For production, replace `staging` with `production` and use
`firebase.prod.json`. For development, use `development` and
`firebase.dev.json`.

Before a Functions-inclusive deploy, run the companion repository's documented
install, build, lint, and tests. Do not assume the public repo's root tests cover
private backend source.

## Deployment Safety Rules

- Never commit secret values or generated credential files.
- Never import/export application data between Firebase environments as part of
  deployment.
- Keep public and companion repository branches compatible.
- Require a green Quality Gate for ordinary releases.
- Verify target project ID before deploying.
- Treat Hosting-only or reduced-target deploys as explicit exceptions.
- Preserve noindex behavior for development and staging.
- Record workflow URL, commit SHA, target, reviewer, and smoke evidence.

## Post-Deployment Verification

At minimum:

1. Confirm the target URL and expected title respond.
2. Confirm CSP and security headers.
3. Exercise authentication and one Firebase-backed critical path.
4. Verify Firestore/Storage access rules in the target context.
5. Inspect Functions and Hosting logs for new errors.
6. Verify production-only analytics/ads and non-production noindex behavior.
7. Update `GO_LIVE_RUNBOOK.md` if release posture changed.
