# Cost-Conscious CI/CD Strategy

Last reviewed: July 20, 2026

The only active workflow is `.github/workflows/master-pipeline.yml`. GitHub
Actions prices and included minutes change; consult current GitHub billing and
the repository's actual usage before making budget decisions.

## Current Cost Drivers

- Every push and pull request targeting `develop`, `staging`, or `main` starts
  the workflow.
- Branch pushes are deploy-capable after the quality and build gates; pull
  requests validate but do not deploy.
- A manual dispatch can run `build_all`, `test_all`, `build_and_deploy`, or
  `deploy_only` against the selected environment.
- Web and Firebase targets are enabled. iOS and Android are currently disabled
  in `.cicd/projects/vehicle-vitals.yml`.
- Hosted Playwright UAT runs against the target environment and therefore
  consumes browser-test time in CI.

Commit prefixes and markers such as `[DRY-RUN]`, `[TEST-DEPLOY]`, `wip:`, or
`docs:` do not change workflow behavior. The workflow has no `dry_run` input.
The legacy `scripts/safe-commit.sh` descriptions should not be treated as CI
controls.

## Recommended Local Gate

Before opening or updating a pull request:

```bash
npm ci
npm run check
npm run test:unit:all
npm run test:scripts
npm run build:web

cd packages/mobile
flutter analyze
flutter test
```

Run the applicable hosted or local UAT command from
`TESTING_INSTRUCTIONS.md` when a web interaction changes. Local success reduces
avoidable CI retries but does not replace the hosted deployment gate.

## Using `act`

`act` can be useful for inspecting or exercising self-contained Linux job
logic:

```bash
act --list -W .github/workflows/master-pipeline.yml
```

Treat it as a diagnostic aid only. It does not faithfully reproduce GitHub
permissions, private companion-repository checkout, protected branches,
Firebase hosted targets, GitHub secrets, or macOS signing. Do not run the
deployment job locally with production credentials. See `ACT_TESTING_GUIDE.md`
for limitations.

## Practical Cost Controls

1. Batch related commits before pushing rather than using CI as the first test
   loop.
2. Use pull requests for validation and branch protection; do not push directly
   to a deployment branch merely to test a hypothesis.
3. Cancel obsolete runs and let the workflow concurrency group cancel older
   runs on the same ref.
4. Use manual `test_all` or `build_all` dispatches only when they add evidence
   beyond the pull-request run.
5. Keep dependency caches and job conditions in the workflow healthy.
6. Review Actions usage and runner mix monthly, especially before re-enabling
   iOS macOS builds.

## Release Safety

Cost reduction must not bypass the quality gate, protected-branch review,
hosted UAT, Firebase project alignment, or rollback preparation. Follow
`STAGING_TO_PRODUCTION_RUNBOOK.md` and record current evidence in
`GO_LIVE_RUNBOOK.md`.
