# Vehicle Vitals Go Live Runbook

Last updated: June 15, 2026
Current decision: NO-GO
Release manager: Mark Nelson (interim)

## Purpose

This document is the executable go-live checklist for Vehicle Vitals. It turns
the current documentation, code, configuration, CI, security posture, product
scope, monetization, and operations state into a sequence that can be completed
and signed off.

Use this as the go-live source of truth until launch. When a gate below changes,
update this file in the same commit as the supporting evidence or status change.

## Scope

In scope for the first market-ready launch:

- Web app on Firebase Hosting
- Firebase Functions, Firestore rules, Storage rules, indexes, and required
  runtime secrets
- iOS app build and release validation
- Subscription, entitlement, support, security, privacy, analytics, and
  operational readiness

Out of scope unless explicitly re-approved:

- Android launch. The current manifest marks Android disabled/on hold in
  `.cicd/projects/vehicle-vitals.yml`.
- Fleet/business expansion beyond the documented Enterprise handoff.
- Household trip telemetry launch. The architecture is drafted, but the feature
  is not release-ready.

## Current Readiness Summary

As of June 15, 2026, Vehicle Vitals is not ready for market launch.

The local engineering gate is materially improved: web type-check, web lint,
web unit tests, production web build, shared package checks/tests, Firebase
utils build, Functions build/lint/tests, mobile tests, mobile analyzer, script
tests, and Firebase Firestore/Storage rules startup all pass locally.

The release is still blocked by an uncommitted release-candidate state, a
GitHub CodeQL alert that must close after push/analysis or receive formal risk
acceptance, unresolved R1 Gate 2 mobile/backend evidence, branch promotion
divergence, open unstable Dependabot PRs, subscription production proof, and
documentation drift around deployment workflows.

## Current Evidence Snapshot

Run date: June 15, 2026

| Area                 | Command or source                                                                                 | Result                                                         | Go-live meaning                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Local branch sync    | `git rev-list --left-right --count @{upstream}...HEAD`                                            | `0 0`                                                          | Local `develop` is synced with `origin/develop`.                                                |
| Local worktree       | `git status --short --branch`                                                                     | Dirty worktree                                                 | No release candidate can be cut until changes are committed or intentionally excluded.          |
| Web unit tests       | `npm --workspace=@vehicle-vitals/web run test:unit`                                               | Pass, 378 tests                                                | Good baseline.                                                                                  |
| Web type check       | `npm --workspace=@vehicle-vitals/web run check`                                                   | Pass                                                           | Local blocker cleared; must remain green in CI.                                                 |
| Web lint             | `npm --workspace=@vehicle-vitals/web run lint`                                                    | Pass, 18 warnings                                              | Local blocker cleared; React hook/compiler warnings are intentionally non-blocking for this cut. |
| Web production build | `npm run build:web`                                                                               | Pass with chunk/dynamic-import warnings                        | Deployable artifact builds; warnings need performance disposition before public launch.         |
| Shared package       | `npm --workspace=@vehicle-vitals/shared run check`; `cd packages/shared && npx vitest run tests`  | Pass, 25 tests                                                 | Good baseline.                                                                                  |
| Firebase utils       | `npm --workspace=@shared/firebase-utils run build`                                                | Pass                                                           | Good baseline.                                                                                  |
| Functions            | `npm --workspace=functions run build`; `npm --workspace=functions test`                           | Pass, 70 tests run, 67 pass, 3 skipped                         | Good backend baseline.                                                                          |
| Functions lint       | `npm --workspace=functions run lint`                                                              | Pass with 4 warnings                                           | Non-blocking cleanup.                                                                           |
| Mobile tests         | `cd packages/mobile && flutter test`                                                              | Pass, 17 tests                                                 | Good baseline.                                                                                  |
| Mobile analyze       | `cd packages/mobile && flutter analyze`                                                           | Pass                                                           | Local blocker cleared.                                                                          |
| Script tests         | `npm run test:scripts`                                                                            | Pass, 4 tests                                                  | Good baseline.                                                                                  |
| Firebase rules       | `firebase emulators:exec --only firestore,storage --project vehicle-vitals-dev 'echo rules-ok'`   | Pass                                                           | Firestore and Storage rules load successfully; path behavior still needs release-flow smoke.     |
| Security audit       | `npm run security:audit`                                                                          | Dependabot alerts 0, secret scanning alerts 0, CodeQL alerts 1 | CodeQL is fixed locally but remains open in GitHub until push/analysis or formal disposition.    |
| GitHub PR queue      | `gh pr list --state open --limit 100`; `gh pr checks <pr>`                                        | 20 open Dependabot PRs; all currently have failed checks        | Queue is blocked mostly by inherited CodeQL failures plus several PR-specific quality failures. |
| Branch promotion     | `origin/staging...origin/develop`                                                                 | staging ahead 3, develop ahead 145                             | Staging is not a current release candidate.                                                     |
| Branch promotion     | `origin/main...origin/staging`                                                                    | main ahead 18, staging ahead 599                               | Production promotion path is not clean.                                                         |
| Readiness report     | `bash scripts/staging-production-readiness-report.sh`                                             | NO-GO                                                          | Report generated at `artifacts/release/staging-to-production-readiness-20260615T152459Z.md`.    |

## P0 Go-Live Blockers

No production launch, App Store submission, public marketing launch, or paid
subscription launch may proceed until every P0 item is closed.

| ID    | Status                 | Blocker                                                  | Evidence                                                                                                                                                                                                                          | Exit criteria                                                                                                                                                        |
| ----- | ---------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | Open                   | Dirty release candidate                                  | Uncommitted changes in Functions, web, mobile, shared, tests, Firebase config/rules, and docs                                                                                                                                     | Worktree is clean; release branch points at a signed, tagged, traceable commit.                                                                                      |
| P0-02 | Closed locally         | Web TypeScript check fails                               | `npm --workspace=@vehicle-vitals/web run check` now passes                                                                                                                                                                        | Command passes locally and in CI.                                                                                                                                    |
| P0-03 | Closed locally         | Web lint fails                                           | `npm --workspace=@vehicle-vitals/web run lint` now exits 0; React hook/compiler rules are warnings for this cut                                                                                                                   | Command passes locally and in CI, or warning baseline is approved for the release.                                                                                   |
| P0-04 | Closed locally         | Mobile analyze fails                                     | `cd packages/mobile && flutter analyze` now passes                                                                                                                                                                                | Command passes locally and in CI.                                                                                                                                    |
| P0-05 | Closed locally         | Household/org garage writes are not allowed by rules     | Firestore rules allow active org members under `orgs/{orgId}/vehicles`; Storage rules allow active org members under `orgs/{orgId}/vehicles`; `firebase.json` deploys Storage rules; emulator startup passes                       | Rules and release-flow smoke support org-scoped vehicles, or household storage mode is disabled before release.                                                      |
| P0-06 | Open                   | R1 Gate 2 is still incomplete                            | `docs/R1_COMPLETION_CHECKLIST.md` and `docs/PRODUCTION_RELEASE_BRIEF.md` show mobile runtime acceptance and backend traffic evidence remain FAIL/incomplete                                                                       | Gate 2 acceptance and backend evidence are PASS with artifacts under `artifacts/smoke/`.                                                                             |
| P0-07 | Mitigated locally      | Open high-severity CodeQL alert                          | Alert 37, `js/polynomial-redos`, is removed locally by replacing the unbounded tire replacement regex in `packages/shared/src/vehicleHealth.js`; GitHub still reports 1 open CodeQL alert until push/analysis or disposition       | Alert is fixed and closed by CodeQL, dismissed with documented false-positive rationale, or accepted by risk owner before launch.                                     |
| P0-08 | Open                   | Dependabot PR queue is unstable                          | 20 open Dependabot PRs against `develop`; all have failed checks, mostly inherited CodeQL analysis failures; PRs 91, 83, 82, 80, 78, 76, and 74 also show quality/test failures                                                     | Queue is merged, closed, or explicitly deferred with no critical security updates pending.                                                                           |
| P0-09 | Open                   | Branch promotion path is stale/diverged                  | `develop` is 145 commits ahead of `staging`; `staging` is 3 commits ahead of `develop`; `staging` is 599 commits ahead of `main`; readiness report is NO-GO                                                                        | Release branch policy is re-established and readiness report returns GO.                                                                                             |
| P0-10 | Closed locally         | Active deployment docs reference obsolete workflow names | `docs/DEPLOY.md` and `docs/PROD_SETUP_GUIDE.md` now reference `master-pipeline.yml`; pipeline deploy targets include Firestore, Storage, Functions, and Hosting                                                                    | Docs name `master-pipeline.yml`, correct workflow inputs, and correct deploy targets.                                                                                |
| P0-11 | Open                   | Subscription launch is not production-proven             | Existing docs mark Stripe production validation, RevenueCat, backend quotas, ad behavior, trial/grace automation incomplete                                                                                                       | Paid launch evidence proves checkout, webhooks, entitlement reconciliation, quota enforcement, failed-payment recovery, refunds/cancellations, and support handling. |
| P0-12 | Partially open         | Release governance docs are stale                        | This runbook has current local evidence; other R1/release docs still need synchronization                                                                                                                                         | `PROJECT_PLAN`, `PRODUCTION_RELEASE_BRIEF`, `R1_COMPLETION_CHECKLIST`, and this runbook are synchronized.                                                            |

## P1 Market Readiness Gaps

These do not necessarily block a limited beta, but they block a confident public
market launch unless formally deferred.

| Area                | Gap                                                                                                                           | Required disposition                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Performance         | Production build reports oversized chunks and ineffective dynamic imports                                                     | Measure Core Web Vitals in staging; decide whether to defer code-splitting.       |
| Branch protection   | `develop` and `main` lack required status checks; `main` does not enforce admins or signed commits                            | Decide and apply branch protection policy before release freeze.                  |
| Documentation       | README, deployment docs, release brief, and R1 checklist do not all reflect current workflow and evidence                     | Complete documentation sync before go/no-go review.                               |
| Operations          | Support runbooks, billing escalation, incident response, and launch ownership are partial                                     | Publish support and incident runbooks with owners and response targets.           |
| Observability       | Crashlytics and web error reporting are wired, but production alert thresholds and dashboards need signoff                    | Define alert routes, thresholds, dashboards, and on-call owner.                   |
| Legal/privacy       | Privacy, terms, App Store privacy labels, data-retention language, and account deletion workflow need final review            | Complete legal/product signoff using current platform rules before public launch. |
| Marketing           | Launch messaging claims web+iOS parity and paid tiers, but release evidence does not yet support that claim                   | Align public copy to actual signed-off scope.                                     |
| iOS store readiness | App Store Connect metadata, screenshots, privacy answers, test account, signing, and submission checklist need final evidence | Complete TestFlight/App Store packet and link evidence.                           |
| Android             | Android is disabled/on hold                                                                                                   | Do not include Android in launch copy or store plans.                             |

## Definition of Go Live Ready

The release is go-live ready only when all of the following are true:

- Source state is clean, tagged, and traceable.
- All P0 blockers are closed.
- Local validation passes with evidence.
- CI validation passes on the release branch.
- Staging has been deployed from the exact release candidate.
- Staging smoke, UAT, mobile acceptance, and backend verification pass.
- Security scanning shows no unresolved high or critical issues.
- Paid-tier behavior is either fully proven or explicitly disabled/deferred in
  product copy and configuration.
- iOS scope is proven on release-like builds, or launch scope is web-only with
  iOS copy removed from public launch materials.
- Support, incident, privacy, billing, and rollback owners have signed off.

## Phase 1: Stabilize the Release Candidate

Owner: Release manager

Checklist:

- [ ] Decide whether the current uncommitted household-garage work is in or out
      of the launch candidate.
- [x] If in scope, complete Firestore rules, Storage path policy, Functions,
      web, mobile, and test coverage for `orgs/{orgId}/vehicles`.
- [ ] If out of scope, remove or feature-disable org-scoped vehicle writes before
      release.
- [x] Fix all web type-check errors.
- [x] Fix all web lint errors.
- [x] Fix all mobile analyzer errors.
- [x] Fix or disposition CodeQL alert 37 locally.
- [x] Re-run local validation commands in Phase 2.
- [ ] Commit the release candidate.
- [ ] Confirm clean state:

```bash
git status --short --branch
git rev-list --left-right --count @{upstream}...HEAD
```

Evidence:

- Clean `git status --short --branch` output.
- Release candidate commit SHA.
- Link to CodeQL alert closure or risk acceptance.

## Phase 2: Local Validation Gate

Owner: Engineering

Run from repository root unless noted.

```bash
npm ci
npm --workspace=@vehicle-vitals/shared run build
npm --workspace=@shared/firebase-utils run build
npm --workspace=functions run build
npm --workspace=functions run lint
npm --workspace=@vehicle-vitals/web run test:unit
npm --workspace=@vehicle-vitals/web run check
npm --workspace=@vehicle-vitals/web run lint
cd packages/shared && npx vitest run tests
cd ../..
cd packages/mobile && flutter test && flutter analyze
cd ../..
npm run test:scripts
npm run build:web
firebase emulators:exec --only firestore,storage --project vehicle-vitals-dev 'echo rules-ok'
```

Exit criteria:

- [x] Every command exits 0 locally.
- [ ] Production web build warnings are reviewed and either fixed or accepted.
- [x] Any generated artifacts are either intentionally committed or confirmed
      ignored.

Evidence:

- Paste command summary into the go/no-go record.
- Attach logs under `artifacts/release/` if the release manager wants durable
  local evidence.

## Phase 3: Security and Privacy Gate

Owner: Security/release manager

Checklist:

- [ ] Run repository posture audit:

```bash
npm run security:audit
```

- [ ] Verify Dependabot security alerts are 0.
- [ ] Verify secret scanning alerts are 0.
- [ ] Verify high/critical CodeQL alerts are 0 or formally risk accepted.
- [ ] Verify Firestore rules cover every client write path.
- [ ] Verify Storage rules cover every attachment and public asset path.
- [ ] Verify Functions request guards, idempotency, entitlement callables, and
      billing webhooks are covered by tests or smoke evidence.
- [ ] Verify no production secrets or private signing materials are committed.
- [ ] Verify public docs do not contain real private credentials or obsolete
      copy-paste secret commands.
- [ ] Verify privacy policy, terms, support contact, data export, and deletion
      workflows match the shipped product.
- [ ] Verify current App Store privacy and data collection answers against the
      current platform requirements before submission.

Exit criteria:

- [ ] No unresolved high/critical security findings.
- [ ] Rules and storage paths are tested against release flows.
- [ ] Privacy and legal signoff recorded.

Evidence:

- Security audit output.
- CodeQL/Dependabot/secret-scanning screenshots or links.
- Privacy/legal signoff note.

## Phase 4: Product and Monetization Gate

Owner: Product/release manager

Checklist:

- [ ] Freeze launch scope as one of:
  - [ ] Web-only public launch
  - [ ] Web plus iOS public launch
  - [ ] Private beta only
  - [ ] Coming-soon page only
- [ ] Reconcile public copy with the frozen scope.
- [ ] Confirm the app does not claim Android availability.
- [ ] Confirm iOS launch claims are backed by Gate 2 acceptance evidence.
- [ ] Confirm paid-tier launch mode:
  - [ ] Paid subscriptions enabled
  - [ ] Paid subscriptions disabled/deferred
- [ ] If paid subscriptions are enabled, validate:
  - [ ] Stripe live checkout
  - [ ] Stripe webhook signature verification
  - [ ] Subscription state reconciliation
  - [ ] Cancellation
  - [ ] Downgrade
  - [ ] Failed-payment recovery
  - [ ] Refund/dispute handling
  - [ ] Backend quota enforcement
  - [ ] Premium ad suppression
  - [ ] Support visibility into billing state
- [ ] If native iOS paid features are enabled, validate:
  - [ ] RevenueCat or approved IAP path
  - [ ] Purchase
  - [ ] Restore purchase
  - [ ] Entitlement reconciliation
  - [ ] App Store review compliance

Exit criteria:

- [ ] Launch copy matches release evidence.
- [ ] Paid-tier behavior is production-proven or disabled.
- [ ] Support has a billing escalation path.

## Phase 5: R1 Mobile Runtime Gate

Owner: Mobile lead

Current status: Not complete.

Run:

```bash
./scripts/smoke-r1-mobile-runtime.sh
./scripts/smoke-r1-mobile-acceptance-template.sh
```

Acceptance checklist:

- [ ] Release-like iOS build succeeds.
- [ ] Auth sign-in/sign-up works against target Firebase environment.
- [ ] Vehicle create, edit, list, and delete work.
- [ ] Maintenance create, edit, list, and delete work.
- [ ] Reminder actions work.
- [ ] Export flow works.
- [ ] Backend logs prove real auth, Firestore writes, and Function calls.
- [ ] Screenshots or recordings prove at least one complete flow.

Evidence:

- `artifacts/smoke/r1-mobile-build-<timestamp>.log`
- `artifacts/smoke/r1-mobile-acceptance-<timestamp>.log`
- `artifacts/smoke/r1-mobile-backend-traffic-<timestamp>.log`

Exit criteria:

- [ ] Gate 2 is marked complete in `docs/R1_COMPLETION_CHECKLIST.md`.
- [ ] `docs/PRODUCTION_RELEASE_BRIEF.md` and this runbook are updated.

## Phase 6: Branch and CI Gate

Owner: Release manager

Checklist:

- [ ] Triage open Dependabot PRs:

```bash
gh pr list --state open --limit 100 \
  --json number,title,headRefName,baseRefName,mergeStateStatus,reviewDecision
```

- [ ] Merge, close, or defer every open dependency PR.
- [ ] Re-establish branch promotion policy:
  - [ ] `develop` to `staging`
  - [ ] `staging` to `main` or `production`, depending on active policy
- [ ] Generate readiness report:

```bash
bash scripts/staging-production-readiness-report.sh
```

- [ ] Confirm report result is GO.
- [ ] Confirm active workflow is `master-pipeline.yml`.
- [ ] Confirm release docs no longer reference archived workflow names as active.
- [ ] Confirm CI quality gates include, or separately require, the local quality
      checks in Phase 2.

Exit criteria:

- [ ] Promotion branches have intentional divergence only.
- [ ] Latest release-branch CI is green.
- [ ] Readiness report returns GO.

## Phase 7: Staging Rehearsal

Owner: Release manager

Checklist:

- [ ] Deploy release candidate to staging through the active pipeline:

```bash
gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=staging
```

- [ ] Confirm the workflow completed successfully:

```bash
gh run list --workflow "Master CI/CD Pipeline" --branch staging --limit 5
```

- [ ] Confirm deploy targets included Hosting, Firestore, Storage, and Functions.
- [ ] Run UAT against staging:

```bash
./scripts/run-uat-tests.sh staging
```

- [ ] Smoke test manually:
  - [ ] Landing page and auth
  - [ ] Sign up/sign in/sign out
  - [ ] Vehicle CRUD
  - [ ] Maintenance CRUD
  - [ ] Upcoming reminders
  - [ ] Record export
  - [ ] Attachment upload/download
  - [ ] Calendar/provider flow if in launch scope
  - [ ] Subscription/billing flow if in launch scope
  - [ ] Contact/support page
  - [ ] Privacy and Terms pages
- [ ] Check Functions logs for errors.
- [ ] Check browser console for production errors.
- [ ] Check analytics/error reporting events.

Exit criteria:

- [ ] Staging smoke passes.
- [ ] No untriaged high-severity runtime errors.
- [ ] Product owner signs launch scope.

Evidence:

- Staging workflow URL.
- UAT output.
- Manual smoke notes.
- Screenshots for launch-critical flows.

## Phase 8: Production Release

Owner: Release manager

Pre-release checklist:

- [ ] Go/no-go meeting completed.
- [ ] All required owners signed off.
- [ ] Rollback owner is available.
- [ ] Support owner is available.
- [ ] Monitoring owner is available.
- [ ] Marketing/public launch time is confirmed.
- [ ] `VITE_SHOW_COMING_SOON_PRODUCTION` is set intentionally:
  - [ ] `true` for coming-soon/prelaunch
  - [ ] `false` for public app launch
- [ ] Production secrets are present and current.
- [ ] No active incident or provider outage blocks launch.

Deploy:

```bash
gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=production
```

Important:

- Do not use production `deploy_only` for full launch unless Functions are
  intentionally not part of the release. Current pipeline behavior skips
  Functions for production `deploy_only`.
- If the pipeline falls back to Hosting/Firestore/Storage only, record that explicitly
  and verify whether Functions changes were required for the release.

Post-deploy verification:

- [ ] Confirm workflow success:

```bash
gh run list --workflow "Master CI/CD Pipeline" --branch main --limit 5
```

- [ ] Open production URL.
- [ ] Confirm expected launch mode: app or coming-soon page.
- [ ] Confirm auth.
- [ ] Confirm vehicle CRUD.
- [ ] Confirm maintenance CRUD.
- [ ] Confirm reminder and export paths.
- [ ] Confirm billing path if enabled.
- [ ] Confirm support/contact/privacy/terms.
- [ ] Confirm no critical Functions errors.
- [ ] Confirm analytics/error reporting receive production events.
- [ ] Confirm security headers:

```bash
curl -I https://vehicle-vitals-prod.web.app
```

Exit criteria:

- [ ] Production smoke passes.
- [ ] Monitoring is clean for the first hour.
- [ ] Support inbox is monitored.
- [ ] Launch decision is recorded.

## Phase 9: Rollback Plan

Rollback owner: Release manager

Rollback triggers:

- Authentication outage
- Data write/read failure
- Payment or entitlement corruption
- Security incident
- Critical app crash rate increase
- Incorrect production config or wrong Firebase project
- Support volume exceeds response capacity

Rollback options:

1. Restore coming-soon mode.
   - Set `VITE_SHOW_COMING_SOON_PRODUCTION=true`.
   - Re-run production deploy.
2. Roll back Firebase Hosting to previous release.
   - Use Firebase console or CLI release rollback.
3. Revert release commit and redeploy.
   - Create a revert commit.
   - Deploy through `master-pipeline.yml`.
4. Disable risky backend paths.
   - Turn off feature flags or provider flags.
   - Redeploy Functions only if needed.

Rollback checklist:

- [ ] Declare rollback in release channel.
- [ ] Preserve failing logs and evidence.
- [ ] Execute selected rollback path.
- [ ] Verify production recovery.
- [ ] Notify support and stakeholders.
- [ ] Open post-incident task with root cause and corrective actions.

## Go/No-Go Record

Complete this section during the final release meeting.

Review date:

Release candidate commit:

Target environment:

Launch mode:

- [ ] Coming-soon page
- [ ] Web public launch
- [ ] Web plus iOS public launch
- [ ] Private beta

Decision:

- [ ] GO
- [ ] NO-GO
- [ ] GO WITH CONDITIONS

Required signoffs:

| Area                 | Owner | Decision | Notes |
| -------------------- | ----- | -------- | ----- |
| Engineering          |       |          |       |
| Product              |       |          |       |
| Security/privacy     |       |          |       |
| Mobile/iOS           |       |          |       |
| Billing/monetization |       |          |       |
| Support/operations   |       |          |       |
| Marketing/comms      |       |          |       |

Open conditions, if any:

1.
2.
3.

Final decision rationale:

## Documentation Sync Checklist

After each readiness state change, update these files as needed:

- [ ] `docs/GO_LIVE_RUNBOOK.md`
- [ ] `docs/PRODUCTION_RELEASE_BRIEF.md`
- [ ] `docs/R1_COMPLETION_CHECKLIST.md`
- [ ] `docs/PROJECT_PLAN.md`
- [ ] `docs/RELEASE_SCOPE_MATRIX.md`
- [ ] `docs/REQUIREMENTS.md`
- [ ] `docs/NEXT_FEATURES_EXECUTION_PLAN.md`
- [ ] `docs/DEPLOY.md`
- [ ] `docs/PROD_SETUP_GUIDE.md`
- [ ] `README.md`

## Immediate Next Execution Order

1. Review and commit the current stabilization slice.
2. Push the release-candidate branch and confirm CI plus CodeQL close the local
   fixes.
3. Close R1 Gate 2 with mobile/backend evidence.
4. Triage the Dependabot PR queue.
5. Reconcile `develop`, `staging`, and `main` promotion branches.
6. Update stale deployment and release-governance docs.
7. Prove or defer paid subscription launch behavior.
8. Run staging rehearsal.
9. Hold final go/no-go review.
