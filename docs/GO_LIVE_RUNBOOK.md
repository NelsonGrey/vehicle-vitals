# Vehicle Vitals Go Live Runbook

Last updated: June 17, 2026
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

As of June 17, 2026, Vehicle Vitals is not ready for market launch.

The local engineering gate is materially improved: web type-check, web lint,
web unit tests, production web build, shared package checks/tests, Firebase
utils build, Functions build/lint/tests, mobile tests, mobile analyzer, script
tests, and Firebase Firestore/Storage rules startup all pass locally.

The Dependabot queue has been substantially resolved — 18 of the 20 open PRs
that were blocking on June 15 have been merged or closed, leaving only 2 open
PRs (both with CLEAN merge status). CodeQL continues to report 0 open alerts.

The release is still blocked by unresolved R1 Gate 2 mobile/backend evidence,
branch promotion divergence, the 2 remaining Dependabot PRs pending final
triage, subscription production proof, and remaining governance signoff outside
the synchronized release docs.

## Current Evidence Snapshot

Run date: June 17, 2026

| Area                 | Command or source                                                                                 | Result                                                         | Go-live meaning                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Local branch sync    | `git rev-list --left-right --count @{upstream}...HEAD`                                            | `0 0`                                                          | Local `develop` is synced with `origin/develop`.                                                |
| Local worktree       | `git status --short --branch`                                                                     | Clean as of June 17 update                                     | Release-candidate source can be cut only from a clean, traceable commit.                         |
| Web unit tests       | `npm --workspace=@vehicle-vitals/web run test:unit`                                               | Pass, 378 tests (June 15 baseline; re-run before release cut) | Good baseline.                                                                                  |
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
| R1 mobile build/launch | `./scripts/smoke-r1-mobile-runtime.sh`; HADES release run                                        | Pass; built `build/ios/iphoneos/Runner.app` and launched on HADES | Release-like iOS build and launch path is current; acceptance/backend proof still blocks Gate 2. |
| CodeQL               | `gh api "repos/mnelson3/vehicle-vitals/code-scanning/alerts?state=open"`                         | 0 open alerts (25 total, all closed/dismissed)                 | CodeQL blocker remains closed on `develop`.                                                      |
| GitHub CI            | Run `27699314636` for commit `28ab5a1`                                                            | Queued 15:12 UTC June 17; monitor at GitHub Actions                         | Must complete green before merging PR #103 to staging.                                 |
| GitHub PR queue      | `gh pr list --state open`                                                                         | 0 Dependabot PRs open; PR #103 (develop→staging) open and awaiting CI      | Merge PR #103 after CI passes to advance P0-09.                                        |
| Branch promotion     | `git rev-list --left-right --count origin/staging...origin/develop`                               | staging ahead 3, develop ahead 160                             | Staging is not a current release candidate.                                                     |
| Branch promotion     | `git rev-list --left-right --count origin/main...origin/staging`                                  | main ahead 18, staging ahead 599                               | Production promotion path is not clean.                                                         |
| Branch protection    | `npm run security:audit` (branch protection snapshot)                                             | `develop` and `main` lack required status checks and signed commits; `staging` is fully protected | Governance gap: `develop` and `main` protection needs decision before release freeze.  |
| Security features    | `npm run security:audit` (repository security features)                                           | Dependabot security updates enabled; secret scanning enabled; push protection enabled | Good posture. No open Dependabot security alerts (1 dismissed as tolerable_risk).      |
| Readiness report     | `bash scripts/staging-production-readiness-report.sh`                                             | NO-GO (last run June 15)                                        | Re-run before release cut; `artifacts/release/staging-to-production-readiness-20260615T202036Z.md` is the latest artifact. |

## P0 Go-Live Blockers

No production launch, App Store submission, public marketing launch, or paid
subscription launch may proceed until every P0 item is closed.

| ID    | Status                 | Blocker                                                  | Evidence                                                                                                                                                                                                                          | Exit criteria                                                                                                                                                        |
| ----- | ---------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | Closed                 | Dirty release candidate                                  | June 15 stabilization and docs/evidence sync are committed on `develop`                                                                                                                                                            | Worktree is clean; release branch points at a signed, tagged, traceable commit.                                                                                      |
| P0-02 | Closed locally         | Web TypeScript check fails                               | `npm --workspace=@vehicle-vitals/web run check` now passes                                                                                                                                                                        | Command passes locally and in CI.                                                                                                                                    |
| P0-03 | Closed locally         | Web lint fails                                           | `npm --workspace=@vehicle-vitals/web run lint` now exits 0; React hook/compiler rules are warnings for this cut                                                                                                                   | Command passes locally and in CI, or warning baseline is approved for the release.                                                                                   |
| P0-04 | Closed locally         | Mobile analyze fails                                     | `cd packages/mobile && flutter analyze` now passes                                                                                                                                                                                | Command passes locally and in CI.                                                                                                                                    |
| P0-05 | Closed locally         | Household/org garage writes are not allowed by rules     | Firestore rules allow active org members under `orgs/{orgId}/vehicles`; Storage rules allow active org members under `orgs/{orgId}/vehicles`; `firebase.json` deploys Storage rules; emulator startup passes                       | Rules and release-flow smoke support org-scoped vehicles, or household storage mode is disabled before release.                                                      |
| P0-06 | Open                   | R1 Gate 2 is still incomplete                            | Latest build and launch evidence is PASS (`artifacts/smoke/r1-mobile-build-20260615T154819Z.log`, `artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log`); acceptance/backend artifacts remain PARTIAL/BLOCKED (`artifacts/smoke/r1-mobile-acceptance-20260601T221521Z.log`, `artifacts/smoke/r1-mobile-backend-traffic-20260601T221521Z.log`) | Gate 2 acceptance and backend evidence are PASS with artifacts under `artifacts/smoke/`.                                                                             |
| P0-07 | Closed                 | Open high-severity CodeQL alert                          | CodeQL run for `ce6d530` succeeded and GitHub code scanning reports 0 open alerts                                                                                                                                                  | Alert is fixed and closed by CodeQL, dismissed with documented false-positive rationale, or accepted by risk owner before launch.                                     |
| P0-08 | Closed                 | Dependabot PR queue is unstable                          | All 20 Dependabot PRs are resolved: PR #101 (root-npm group) and PR #102 (path_provider) were merged June 17 at 15:03 UTC. No Dependabot security alerts are open (1 dismissed as tolerable_risk). | ✅ Done. Monitor for new security PRs through release freeze. |
| P0-09 | Open                   | Branch promotion path is stale/diverged                  | As of June 17: `develop` is 160 commits ahead of `staging`; `staging` is 3 commits ahead of `develop`; `staging` is 599 commits ahead of `main`; `main` is 18 ahead of `develop`; readiness report last run June 15 returns NO-GO | Release branch policy is re-established and readiness report returns GO.                                                                                             |
| P0-10 | Closed locally         | Active deployment docs reference obsolete workflow names | `docs/DEPLOY.md` and `docs/PROD_SETUP_GUIDE.md` now reference `master-pipeline.yml`; pipeline deploy targets include Firestore, Storage, Functions, and Hosting                                                                    | Docs name `master-pipeline.yml`, correct workflow inputs, and correct deploy targets.                                                                                |
| P0-11 | Open                   | Subscription launch is not production-proven             | Existing docs mark Stripe production validation, RevenueCat, backend quotas, ad behavior, trial/grace automation incomplete                                                                                                       | Paid launch evidence proves checkout, webhooks, entitlement reconciliation, quota enforcement, failed-payment recovery, refunds/cancellations, and support handling. |
| P0-12 | Partially open         | Release governance docs need final signoff               | This runbook, production release brief, R1 checklist, requirements, release scope, and next-features execution plan are synchronized to the current Gate 2 state                                                                    | `PROJECT_PLAN`, `PRODUCTION_RELEASE_BRIEF`, `R1_COMPLETION_CHECKLIST`, and this runbook are synchronized and signed off.                                             |

## P1 Market Readiness Gaps

These do not necessarily block a limited beta, but they block a confident public
market launch unless formally deferred.

| Area                | Gap                                                                                                                           | Required disposition                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Performance         | Production build reports oversized chunks and ineffective dynamic imports                                                     | Measure Core Web Vitals in staging; decide whether to defer code-splitting.       |
| Branch protection   | `develop` lacks required status checks, required PR reviews, and signed commits; `main` also lacks required status checks, required PR reviews, and signed commits; `staging` is well-protected (enforce_admins, Pipeline Summary status check, signed commits, conversation resolution) | Decide and apply matching protection to `develop` and `main` before release freeze. |
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

- [x] Decide whether the current household-garage infrastructure work is in or out
      of the launch candidate. Current decision: org-scoped vehicle rules and
      shared-garage plumbing stay in the candidate; household trip telemetry
      remains out of launch scope.
- [x] If in scope, complete Firestore rules, Storage path policy, Functions,
      web, mobile, and test coverage for `orgs/{orgId}/vehicles`.
- [ ] If out of scope later, remove or feature-disable org-scoped vehicle writes before
      release.
- [x] Fix all web type-check errors.
- [x] Fix all web lint errors.
- [x] Fix all mobile analyzer errors.
- [x] Fix and close CodeQL alert 37.
- [x] Re-run local validation commands in Phase 2.
- [x] Commit and push the June 15 stabilization slice.
- [x] Commit the docs/evidence sync and confirm clean state:

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
node --test scripts/tests/*.cjs
npm run build:web
firebase emulators:exec --only firestore,storage --project vehicle-vitals-dev 'echo rules-ok'
```

Note: the `test:scripts` root alias routes to `@vehicle-vitals/shared` which does not expose
`test:scripts`. Run `node --test scripts/tests/*.cjs` directly from the repo root.

Exit criteria:

- [x] Every command exits 0 locally.
- [x] Production web build warnings reviewed: oversized chunks and ineffective dynamic
      imports are accepted for this release cut. The root cause is Firebase SDK modules
      being both statically and dynamically imported; code-splitting improvement is
      tracked as a P1 performance item but does not block release.
- [x] Any generated artifacts are either intentionally committed or confirmed ignored.

Evidence (June 17, 2026):

| Command                                                     | Result                                               |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| `shared build`                                              | Pass                                                 |
| `firebase-utils build`                                      | Pass                                                 |
| `functions build`                                           | Pass                                                 |
| `functions lint`                                            | Pass (0 errors, 4 warnings — same baseline as June 15) |
| `functions test`                                            | Pass (70 run, 67 pass, 3 skipped)                    |
| `web test:unit`                                             | Pass (378/378)                                       |
| `web check`                                                 | Pass                                                 |
| `web lint`                                                  | Pass (0 errors, 18 warnings — same baseline)         |
| `shared vitest`                                             | Pass (25/25)                                         |
| `flutter test`                                              | Pass (17/17) — InkSparkle shader issue fixed in `premium_plan_catalog_test.dart` |
| `flutter analyze`                                           | Pass (exit 0; 1880 issues all in `build/SourcePackages` — external package tests, not app code) |
| `node --test scripts/tests/*.cjs`                           | Pass (9/9 — up from 4; new coverage added)           |
| `build:web`                                                 | Pass (chunk size warnings accepted per above)        |
| Firebase rules emulator                                     | Pass                                                 |

## Phase 3: Security and Privacy Gate

Owner: Security/release manager

Checklist:

- [x] Run repository posture audit:

```bash
npm run security:audit
```

- [x] Verify Dependabot security alerts are 0.
  - Result: 0 open security alerts; 1 dismissed as tolerable_risk.
- [ ] Verify secret scanning alerts are 0.
  - Secret scanning is enabled with push protection. Confirm 0 open secret-scanning alerts in GitHub Security tab before release.
- [x] Verify high/critical CodeQL alerts are 0 or formally risk accepted.
  - Result: 0 open code-scanning alerts (`gh api` confirmed June 17).
- [ ] Verify Firestore rules cover every client write path.
  - Emulator startup passes. Release-flow smoke (org-scoped vehicle writes,
    transfer callables, entitlement paths) needs a dedicated smoke run before launch.
- [ ] Verify Storage rules cover every attachment and public asset path.
  - Emulator startup passes. Full release-flow smoke needed.
- [ ] Verify Functions request guards, idempotency, entitlement callables, and
      billing webhooks are covered by tests or smoke evidence.
  - Functions tests pass (67/70 pass, 3 skipped). Integration coverage for
    transfer, consolidation, and enterprise callables exists. Billing webhook
    smoke in a production-like environment is still needed (P0-11).
- [x] Verify no production secrets or private signing materials are committed.
  - `.act-secrets/` is gitignored (confirmed via `git check-ignore`; `.gitignore` line 316).
  - `.p8` keys, Android keystores, and service account keys are all gitignored.
  - Secret scanning + push protection is enabled on the repository.
  - Final pre-release check: confirm `git ls-files --others --ignored` does not surface
    any sensitive files accidentally committed in the release HEAD.
- [ ] Verify public docs do not contain real private credentials or obsolete
      copy-paste secret commands.
- [ ] Verify privacy policy, terms, support contact, data export, and deletion
      workflows match the shipped product.
- [ ] Verify current App Store privacy and data collection answers against the
      current platform requirements before submission.

Branch protection status (June 17, 2026):

- `develop`: no required status checks, no PR reviews, no signed commits — **gap**
- `staging`: enforce_admins ✅, Pipeline Summary check ✅, signed commits ✅, conversation resolution ✅
- `main`: no required status checks, no PR reviews, no signed commits — **gap**

Apply branch protection to `develop` and `main` before the release freeze:

```bash
# Apply required status check + admin enforcement to develop (example; adjust as needed)
gh api repos/mnelson3/vehicle-vitals/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Pipeline Summary"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews=null \
  --field restrictions=null
```

Exit criteria:

- [x] No unresolved high/critical security findings (CodeQL 0, Dependabot security 0).
- [ ] Rules and storage paths are tested against release flows (emulator startup ✅; release-flow smoke ❌).
- [ ] Privacy and legal signoff recorded.
- [ ] Branch protection applied to `develop` and `main`.
- [ ] Secret scanning and `.act-secrets/` signing key disposition confirmed.

Evidence:

- Security audit run June 17: Dependabot 0 open, CodeQL 0 open, secret scanning enabled, push protection enabled.
- Branch protection: `staging` is fully protected; `develop` and `main` gaps documented above.

## Phase 4: Product and Monetization Gate

Owner: Product/release manager

### Fastest-path launch options (pick one)

**Option A — Defer paid subscriptions, launch free-tier + ads (recommended for speed):**
This is the fastest path to launch. Paid subscription UI exists but can be presented
as "coming soon." Ad placements are already wired. Avoids blocking on Stripe validation
and RevenueCat integration. Steps: update public copy to remove paid-tier claims,
set `VITE_SHOW_COMING_SOON_PRODUCTION=false`, deploy.

**Option B — Coming-soon page only:**
Set `VITE_SHOW_COMING_SOON_PRODUCTION=true` and deploy. Collect email signups while
finishing Gate 2 and Stripe validation. Fastest time to "something live."

**Option C — Full paid launch:**
Requires completing all Stripe validation, RevenueCat integration, and quota enforcement
items below. Estimated additional 3–6 weeks before evidence can be captured.

Checklist:

- [ ] **Decision**: Freeze launch scope as one of:
  - [ ] Web-only public launch (free tier + ads, paid deferred)
  - [ ] Web plus iOS public launch (requires Gate 2 ✅)
  - [ ] Private beta / TestFlight only
  - [ ] Coming-soon page only (fastest to deploy)
- [ ] Reconcile public copy with the frozen scope.
  - Remove all Android claims from marketing copy.
  - If iOS launch: ensure Gate 2 acceptance evidence is linked.
  - If paid deferred: remove paid-tier checkout CTAs from public copy or replace with waitlist.
- [ ] Confirm the app does not claim Android availability.
- [ ] Confirm iOS launch claims are backed by Gate 2 acceptance evidence.
- [ ] Confirm paid-tier launch mode:
  - [ ] Paid subscriptions enabled (requires full Stripe + RevenueCat proof below)
  - [ ] Paid subscriptions disabled/deferred (Option A above — recommended)
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

Run:

```bash
STRIPE_CHECKOUT_RESULT=PASS \
STRIPE_WEBHOOK_RESULT=PASS \
STRIPE_PORTAL_RESULT=PASS \
STRIPE_FAILURE_RESULT=PASS \
STRIPE_REFUND_CANCEL_RESULT=PASS \
ENTITLEMENT_RECONCILIATION_RESULT=PASS \
QUOTA_ENFORCEMENT_RESULT=PASS \
REVENUECAT_OR_IOS_DEFERRAL_RESULT=PASS \
AD_SUPPRESSION_RESULT=PASS \
SUPPORT_VISIBILITY_RESULT=PASS \
STRIPE_MODE=live \
TESTER="<tester>" \
REVIEWER="<reviewer>" \
STRIPE_CHECKOUT_REF="<checkout-session-link-or-artifact>" \
STRIPE_WEBHOOK_REF="<webhook-event-or-log-link>" \
STRIPE_PORTAL_REF="<customer-portal-link-or-artifact>" \
STRIPE_FAILURE_REF="<failed-payment-recovery-link-or-artifact>" \
STRIPE_REFUND_CANCEL_REF="<refund-cancel-downgrade-link-or-artifact>" \
REVENUECAT_REF="<revenuecat-evidence-or-ios-paid-feature-deferral>" \
ENTITLEMENT_REF="<backend-entitlement-evidence>" \
QUOTA_REF="<quota-enforcement-evidence>" \
AD_SUPPRESSION_REF="<premium-ad-suppression-evidence>" \
SUPPORT_REF="<support-billing-visibility-evidence>" \
./scripts/smoke-monetization-readiness-capture.sh
```

Exit criteria:

- [ ] Launch copy matches release evidence.
- [ ] Paid-tier behavior is production-proven or disabled.
- [ ] Support has a billing escalation path.

Evidence:

- `artifacts/smoke/monetization-readiness-*.log`
- Stripe Checkout, webhook, Customer Portal, failed-payment, refund,
  cancellation, and downgrade proof.
- RevenueCat/IAP proof or explicit native paid-feature deferral.
- Backend entitlement, quota, Premium ad-suppression, and support visibility
  proof.

## Phase 5: R1 Mobile Runtime Gate

Owner: Mobile lead

Current status: Not complete. Release-like iOS build and HADES launch are PASS
as of `artifacts/smoke/r1-mobile-build-20260615T154819Z.log` and
`artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log`; manual
acceptance and backend success-path proof are still open.

Run:

```bash
./scripts/smoke-r1-mobile-runtime.sh
AUTH_RESULT=PASS \
VEHICLE_CRUD_RESULT=PASS \
MAINTENANCE_CRUD_RESULT=PASS \
REMINDER_ACTIONS_RESULT=PASS \
EXPORT_RESULT=PASS \
FIRESTORE_WRITES_OBSERVED=YES \
FUNCTIONS_INVOCATIONS_OBSERVED=YES \
AUTH_EVENTS_OBSERVED=YES \
FIREBASE_PROJECT=vehicle-vitals-dev \
TESTER="<tester>" \
REVIEWER="<reviewer>" \
SCREENSHOT_EVIDENCE="<paths-or-links>" \
FIRESTORE_EVIDENCE_REF="<console-paths-or-export>" \
FUNCTIONS_LOG_REF="<log-query-or-link>" \
AUTH_EVENT_REF="<auth-console-or-log-link>" \
./scripts/smoke-r1-mobile-acceptance-capture.sh
```

Acceptance checklist:

- [x] Release-like iOS build succeeds.
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

Use `./scripts/smoke-r1-mobile-acceptance-template.sh` only as a pre-run
scaffold. Use `./scripts/smoke-r1-mobile-acceptance-capture.sh` for the final
PASS/BLOCKED evidence packet after real device and backend observations.

Current evidence:

- `artifacts/smoke/r1-mobile-build-20260615T154819Z.log` - PASS
- `artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log` - PASS through HADES install/launch
- `artifacts/smoke/r1-mobile-acceptance-20260601T221521Z.log` - PARTIAL/BLOCKED
- `artifacts/smoke/r1-mobile-backend-traffic-20260601T221521Z.log` - BLOCKED

Exit criteria:

- [ ] Gate 2 is marked complete in `docs/R1_COMPLETION_CHECKLIST.md`.
- [ ] `docs/PRODUCTION_RELEASE_BRIEF.md` and this runbook are updated.

## Phase 6: Branch and CI Gate

Owner: Release manager

Current Dependabot disposition (June 17, 2026):

- Open repository security alerts are 0; no current Dependabot PR is required
  to close a known critical/high security alert (1 alert was dismissed as
  tolerable_risk).
- 18 of 20 Dependabot PRs that were open on June 15 have been merged or closed.
  The 2 remaining are: PR #101 (root-npm group with 6 dev-dep updates) and PR
  #102 (path_provider mobile patch). Both have CLEAN merge status.
- Dependabot is configured to group related updates and cap each ecosystem at 3
  open PRs to prevent another large queue from building during release freeze.

Checklist:

- [ ] Merge or defer the 2 remaining open Dependabot PRs:
  - [ ] PR #101: `chore(deps-dev): bump the root-npm group with 6 updates` — merge if passing CI
  - [ ] PR #102: `chore(deps): bump path_provider 2.1.5→2.1.6 in /packages/mobile` — merge if passing CI

```bash
gh pr list --state open --limit 30 \
  --json number,title,headRefName,baseRefName,mergeStateStatus,reviewDecision
```

- [x] Merge, close, or defer every open dependency PR.
  - PR #101 and #102 merged June 17 at 15:03 UTC. Dependabot queue is now 0 open PRs.
- [ ] Re-establish branch promotion policy:
  - [x] `develop` to `staging`: PR #103 opened June 17 — https://github.com/mnelson3/vehicle-vitals/pull/103
    - Requires CI to pass on `develop` (pushed at commit `28ab5a1`)
    - Merge once CI is green and the staging rehearsal plan is confirmed
  - [ ] `staging` to `main`: use `scripts/open-staging-to-production-pr.sh --create-pr` after staging rehearsal passes
- [ ] Generate readiness report:

```bash
bash scripts/staging-production-readiness-report.sh
```

- [ ] Confirm report result is GO.
- [ ] Confirm active workflow is `master-pipeline.yml`.
- [ ] Confirm release docs no longer reference archived workflow names as active.
- [ ] Confirm CI quality gates include, or separately require, the local quality
      checks in Phase 2.
- [ ] Confirm the latest `develop` master pipeline completes after the queued `Build iOS App` job starts.

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

As of June 17, 2026 (updated after Phase 2 and P0-08 closure).

**Completed this session:**
- ✅ P0-08 Closed: merged Dependabot PRs #101 and #102 (June 17 15:03 UTC)
- ✅ Phase 2 local validation gate: all commands pass (evidence table above)
- ✅ Phase 3 partial: CodeQL 0, Dependabot security 0, secrets posture confirmed
- ✅ Mobile test fix: InkSparkle shader mismatch resolved in `premium_plan_catalog_test.dart`
- ✅ Branch promotion PR opened: PR #103 (develop→staging)

**Remaining — requires your action:**

1. **Close R1 Gate 2** (P0-06) — CRITICAL BLOCKER:
   - Enable Developer Mode on HADES and trust the host Mac.
   - Run the full 7-phase acceptance checklist (auth → vehicle CRUD → maintenance
     CRUD → reminders → export → backend verification → performance).
   - Capture results:
     ```bash
     AUTH_RESULT=PASS \
     VEHICLE_CRUD_RESULT=PASS \
     MAINTENANCE_CRUD_RESULT=PASS \
     REMINDER_ACTIONS_RESULT=PASS \
     EXPORT_RESULT=PASS \
     FIRESTORE_WRITES_OBSERVED=YES \
     FUNCTIONS_INVOCATIONS_OBSERVED=YES \
     AUTH_EVENTS_OBSERVED=YES \
     FIREBASE_PROJECT=vehicle-vitals-dev \
     TESTER="Mark Nelson" \
     REVIEWER="Mark Nelson" \
     SCREENSHOT_EVIDENCE="<paths>" \
     FIRESTORE_EVIDENCE_REF="<console-path>" \
     FUNCTIONS_LOG_REF="<log-link>" \
     AUTH_EVENT_REF="<auth-log-link>" \
     ./scripts/smoke-r1-mobile-acceptance-capture.sh
     ```
   - Update `docs/R1_COMPLETION_CHECKLIST.md`, `docs/PRODUCTION_RELEASE_BRIEF.md`,
     and this runbook when Gate 2 is PASS.

2. **Merge develop→staging PR #103** once CI is green on `develop` (push `28ab5a1`
   triggered a new CI run; confirm `Build iOS App` job completes):
   ```bash
   gh run list --workflow "master-pipeline.yml" --branch develop --limit 3
   ```

3. **Apply branch protection** to `develop` and `main` (P1 gap):
   - See Phase 3 checklist for the `gh api` command template.
   - Decision: match `staging`'s protection (Pipeline Summary check, enforce_admins,
     signed commits) or apply a lighter policy appropriate for the development branch.

4. **Run staging rehearsal** (Phase 7) after PR #103 merges:
   ```bash
   gh workflow run master-pipeline.yml -f action=build_and_deploy -f environment=staging
   ```

5. **Prove or defer paid subscription launch behavior** (P0-11):
   - Run `./scripts/smoke-monetization-readiness-capture.sh` with live Stripe evidence
   - OR update all public launch copy to defer paid tiers explicitly.

6. **Readiness report**: re-run after staging rehearsal passes:
   ```bash
   bash scripts/staging-production-readiness-report.sh
   ```

7. **Hold go/no-go review** and complete the Go/No-Go Record section.
