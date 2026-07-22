# Vehicle-Vitals Go-Live and Release Runbook

Last verified: July 20, 2026

Current posture: **HOLD the next production deployment until the production
Chromium UAT regression is reconciled and production branch governance is
enforced or explicitly risk-accepted.** A production web deployment already
exists and is responding; this hold applies to the next release, not to the
existence of the production service.

Release manager: Mark Nelson (interim)

## Purpose and Source of Truth

This is the current release-status and execution source of truth. It replaces
the pre-production status narratives retained in `PROJECT_PLAN.md`,
`PRODUCTION_RELEASE_BRIEF.md`, `R1_COMPLETION_CHECKLIST.md`, and
`RELEASE_SCOPE_MATRIX.md`.

Status in this file must be backed by current repository state, a named CI run,
an evidence artifact, or an explicitly identified external approval. The
documentation classification and precedence rules are in `docs/README.md`.

## What Is Deployed and Maintained

- Public React web application on Firebase Hosting.
- Canonical production domain: `https://vehicle-vitals.com`.
- Firebase hosting alias: `https://vehicle-vitals-prod.web.app`.
- Firebase Authentication, Firestore, Storage, indexes, and Cloud Functions.
- Flutter iOS client in `packages/mobile`.
- Shared calculations/data helpers in `packages/shared`.
- Firebase SDK helpers in `packages/firebase-utils`.
- Firebase Cloud Functions from the private companion repository
  `NelsonGrey/vehicle-vitals-functions`.

Android is not a current release target. Household trip telemetry remains a
future architecture, not a shipped launch claim.

## Repository and Deployment Boundary

The public repository intentionally does not track `packages/functions`.
During the `deploy-firebase` job, the master pipeline checks the private
Functions repository out at that path using `FUNCTIONS_REPO_PAT`. Firebase
configuration continues to use `packages/functions` as its source path.

Local Functions validation therefore requires:

```bash
git clone git@github.com:NelsonGrey/vehicle-vitals-functions.git packages/functions
npm run build --workspace=@vehicle-vitals/shared
cd packages/functions
VV_SHARED_DIST=../shared/dist npm run vendor:shared
npm test
```

Do not treat the absence of `packages/functions` in a clean public checkout as
missing source. Do treat a failed companion checkout, missing
`FUNCTIONS_REPO_PAT`, or branch mismatch as a deployment blocker.

## Verified Current Snapshot

The following was inspected on July 20, 2026 from public-repository commit
`313edbecf70e73b32a9d65232b11f061fa6d1d85`.

| Area | Verified state | Release meaning |
| --- | --- | --- |
| Local `main` | Clean before documentation edits; `0 0` against `origin/main` | Audited source matched the remote production branch |
| Production hosting | Both production URLs returned HTTP 200 with security headers; content last modified July 19 | Existing production web service is reachable |
| Development vs staging | Commit graph diverges because of promotion history; tree difference was limited to `.cicd/projects/vehicle-vitals.yml` | Compare trees and manifest intent, not commit counts alone |
| Staging vs main | Commit graph diverges; trees were byte-identical | Current production content matches the staging tree despite squash/merge history |
| Latest `main` workflow | Run `29701153138` failed in Quality Gate | The next deploy is blocked until the UAT mismatch is resolved and a green deploy-capable run completes |
| Failure detail | Production Chromium UAT expected `Ownership Records` as the first marketing link but rendered `Getting Started`; a proof-heading assertion was flaky | Test/production-content contract drift; build and deploy jobs were skipped |
| Other browsers in that run | Firefox and WebKit UAT passed | Failure is isolated to the Chromium matrix result/test contract, not proof that the hosted service is down |
| Branch protection | `main` and `develop` require no status checks, approvals, signatures, or admin enforcement; `staging` requires one approval, signatures, admin enforcement, and only `Pipeline Summary` | Current repository settings do not enforce the documented production quality/review policy |
| Open pull requests | Dependabot PRs `#167` and `#168`; both clean with green checks at review time | Dependency updates remain normal queued work, not release evidence until merged and promoted |
| Security alerts | 0 open Dependabot, CodeQL, and secret-scanning alerts | No known open GitHub security alert in the public repository |
| Functions access | `FUNCTIONS_REPO_PAT` exists as a repository secret | CI has the named credential required to fetch the private companion; secret validity is proven only by a successful checkout/deploy run |
| iOS automation | `targets.ios.enabled: false` | Automated signed build/TestFlight upload is intentionally paused |
| Android automation | Disabled and `on_hold` | Android must not be included in current release claims |

## Local Validation Baseline

These commands were executed on July 20 before documentation-only edits:

| Command | Result |
| --- | --- |
| `npm ci` | Pass; 724 packages installed |
| `npm run check` | Pass for Firebase utils, shared, and web workspaces |
| `npm run test:unit:all` | Pass: web 438/438 and mobile 92/92 |
| `npm run test:scripts` | Pass: 9/9 |
| `npm run build:web` | Pass; large-chunk and ineffective-dynamic-import warnings remain |
| `cd packages/mobile && flutter analyze` | Pass with no issues |

Functions were not revalidated locally because the private companion checkout
was not mounted. A concurrent second Flutter test process briefly collided on
a native build artifact; the canonical `npm run test:unit:all` run completed
all 92 mobile tests successfully.

## Current Release Blockers

### P0: Production quality gate is red

Run `29701153138` failed `TC-UI-010` and recorded `TC-UI-007` as flaky against
`https://vehicle-vitals.com`. The Quality Gate therefore failed and Build Web,
Build iOS, and Deploy Firebase were skipped.

Exit criteria:

1. Decide whether current production navigation/content or the UAT expectation
   is authoritative.
2. Update the implementation or test contract.
3. Run the Chromium test against production and all three browser projects
   against the intended release target.
4. Complete a green deploy-capable staging run.
5. Promote and complete a green production run.

### P0: Companion backend must be release-aligned

The public and private repositories use matching branch names:
`develop`, `staging`, and `main`. A public-repository promotion is not complete
unless the Functions companion branch selected by the pipeline contains the
compatible backend version.

Exit criteria:

- Private companion branch and public branch are intentionally aligned.
- Companion checkout succeeds in CI.
- Shared package vendoring and Functions install/build complete.
- Firebase deployment, including Functions, succeeds or an explicitly approved
  target-reduction path is recorded.

### P0: Production branch governance is not enforced

At verification time, `main` and `develop` had no required status checks,
review approvals, required signatures, or admin enforcement. `staging` was
protected, but its only required check was `Pipeline Summary`. That job always
runs to report upstream results and is not itself a substitute for a successful
Quality Gate.

Exit criteria:

- Require an actual success-enforcing quality/deployment check for production
  promotion, or make the required summary job fail when mandatory upstream jobs
  fail.
- Require the intended pull-request approvals and administrator enforcement on
  `main`.
- Align `develop` and `staging` protections with the documented promotion
  policy.
- Re-query branch protection and capture the settings before the next
  production merge.

### P0: External commercial and mobile approvals remain evidence-driven

Repository configuration cannot prove the current App Store review state,
storefront availability, live Stripe behavior, support staffing, legal
approval, or incident ownership.

Before enabling paid/public capabilities, capture current evidence for:

- App Store Connect status and approved build/version.
- iOS product identifiers, purchase, restore, entitlement refresh, and refund
  handling.
- Stripe live checkout, webhook signature/reconciliation, billing portal,
  cancellation/downgrade, and failed-payment recovery.
- Production support and sales inbox monitoring.
- Privacy/terms approval and account/data deletion operations.
- Analytics/consent and AdSense behavior on the production domain.

Use `EXTERNAL_LAUNCH_APPROVAL_PROMPT.md` to collect the accountable decisions.

## Active CI/CD Behavior

`.github/workflows/master-pipeline.yml` is the only active workflow.

| Trigger | Target environment | Default action |
| --- | --- | --- |
| Pull request to `develop`, `staging`, or `main` | development | Tests only |
| Push to `develop` | development | Build and deploy |
| Push to `staging` | staging | Build and deploy |
| Push to `main` | production | Build and deploy |
| Manual dispatch | selected | `test_all`, `build_all`, `build_and_deploy`, or `deploy_only` |

The deploy-capable path is:

1. Load `.cicd/projects/vehicle-vitals.yml`.
2. Run web unit tests and mobile unit tests.
3. Run Playwright UAT against the environment URL on Chromium, Firefox, and
   WebKit.
4. Require the Quality Gate to pass.
5. Build the web app with environment-specific Firebase/access/analytics/ad
   values.
6. If enabled, build and upload iOS for staging/production.
7. Check out the private Functions companion.
8. Build shared packages, vendor them for Functions, download the web artifact,
   and deploy Firebase.

Production `deploy_only` intentionally omits Functions. It is an exceptional
Firebase-only redeploy path, not a substitute for proving backend compatibility
for a normal release.

## Standard Release Procedure

### 1. Prepare the candidate on `develop`

```bash
git status --short --branch
git fetch --all --prune
npm ci
npm run check
npm run test:unit:all
npm run test:scripts
npm run build:web
cd packages/mobile && flutter analyze
```

If Functions changed, mount the private checkout and run its documented build,
lint, and test commands too.

### 2. Validate development

- Require green pull-request checks.
- Merge to `develop`.
- Verify the `develop` push run, including development deploy.
- Smoke test auth, Garage, add/edit vehicle, records, reminders, timeline,
  subscription rendering, support, and the documented environment modes and
  exposure boundaries.

### 3. Promote to staging

- Compare `origin/develop` and `origin/staging` by both commit graph and tree.
- Confirm the `.cicd` manifest is intentional.
- Promote the compatible Functions `develop` branch to Functions `staging`.
- Use a reviewed pull request to promote public `develop` to `staging`.
- Require the staging workflow to pass.
- Smoke test the hosted staging URL and Firebase-backed critical flows.

### 4. Generate promotion evidence

```bash
bash scripts/staging-production-readiness-report.sh
```

The report is necessary but not sufficient. Review its branch calculations,
latest staging run, required secret-name checks, and changed-file summary.

### 5. Promote to production

- Resolve every P0 item.
- Promote Functions `staging` to Functions `main`.
- Run the readiness report again.
- Prepare the public promotion PR:

```bash
bash scripts/open-staging-to-production-pr.sh
```

- Create it only after a `GO` result:

```bash
bash scripts/open-staging-to-production-pr.sh --create-pr
```

- Merge through a reviewed pull request only after the branch-protection gap is
  corrected, or after accountable launch authority explicitly records a
  temporary manual control and accepts the risk.
- Monitor the `main` workflow through deployment.

### 6. Verify production

Verify all applicable items immediately after deployment:

- `https://vehicle-vitals.com` returns HTTP 200.
- Custom-domain certificate and redirects are correct.
- Security headers and production CSP are present.
- Sign-up/sign-in/password reset work as intended.
- User and org garage reads/writes respect scope.
- Vehicle, record, reminder, attachment, timeline, and provider flows work.
- Cloud Functions logs show no new critical errors.
- Subscription/entitlement state is server-authoritative.
- Consent, GTM/GA4, AdSense, `robots.txt`, sitemap, canonical metadata, and
  noindex behavior match the target environment.
- Support/contact requests reach the staffed destination.
- iOS behavior is verified separately when iOS automation/release is enabled.

Record the workflow URL, commit SHA, test account, reviewer, time window, and
evidence location.

## Manual Deployment

Prefer the master pipeline. A manual full Firebase deployment requires the
private Functions checkout at `packages/functions`, shared package build, and
the correct Firebase alias:

```bash
npm ci
npm run build --workspace=@vehicle-vitals/shared
npm run build:production
firebase use production
firebase deploy --config firebase.prod.json --only firestore,storage,functions,hosting
```

Use `staging`/`firebase.staging.json` or
`development`/`firebase.dev.json` for those environments. Do not move Firestore
application data between environments as part of deployment.

## Rollback

1. Stop or cancel the active workflow when safe.
2. Identify the last known-good public commit and compatible Functions commit.
3. Prefer a reviewed revert or forward fix; preserve history.
4. Redeploy the exact intended environment.
5. Re-run critical smoke tests and inspect Firebase logs.
6. If only Hosting is affected, a hosting-only rollback can reduce impact, but
   record why rules/Functions were intentionally unchanged.
7. Document the incident, customer effect, rollback SHA, and follow-up owner.

## Known Non-Blocking Technical Debt

- Production web build emits chunk-size and ineffective dynamic-import
  warnings. These are performance/maintainability debt, not a build failure.
- Commit counts between long-lived branches are noisy because the promotion
  process has used squash/merge commits. Tree comparison is required.
- Root `automate.sh` and several generic iOS documents are legacy helpers, not
  active deployment sources.
- Dated R1, beta, project-plan, and release-brief documents remain useful
  evidence but are not current status.

## Update Protocol

Update this file whenever any of the following changes:

- production/staging/development branch or project mapping;
- active workflow or target enablement;
- public/private repository boundary;
- release blocker or external approval;
- latest release evidence;
- rollback procedure.

Do not paste secret values, private keys, tokens, customer data, or production
test credentials into this runbook.
