# Vehicle Vitals Go Live Runbook

Last updated: July 9, 2026
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

As of July 9, 2026, Vehicle Vitals is not ready for market launch.

The local engineering gate remains materially improved: web type-check, web
lint, web unit tests, production web build, and CI's Quality Gate (unit tests
+ Playwright UAT across chromium/firefox/webkit) all pass on `develop`,
confirmed on the latest CI run (`29034124504`, commit `27b4a12`).

Two infrastructure gaps discovered and closed since the June 17 snapshot:

- **Email delivery provider**: the codebase had SendGrid scaffolded but never
  actually configured (`EMAIL_PROVIDER` defaulted to a no-op `"log"` mode) —
  this was silently blocking every Firebase Functions deploy in all three
  projects (`vehicle-vitals-dev`, `-staging`, `-prod`) because Functions v2
  requires declared secrets to exist in Secret Manager before deploy succeeds,
  and the SendGrid secrets had never been created. Migrated to Google
  Workspace SMTP (commit `4dd5ad6`); `WORKSPACE_SMTP_USER` and
  `WORKSPACE_SMTP_APP_PASSWORD` secrets are now set in all three Firebase
  projects, and Deploy Firebase has succeeded repeatedly since. This also
  fixed a latent bug where `sendMaintenanceReminder`/`checkMaintenanceReminders`
  had no secrets binding at all and would have crashed at runtime.
- **Stale UAT test**: `TC-PROFILE-002` (account consolidation) asserted a
  button (`"Consolidate Accounts"`) that no longer exists — the UI moved to a
  two-step verification-code flow — and was intermittently failing Quality
  Gate. Fixed to match current UI (commit in the July 9 session).

**Branch promotion regressed.** PR #103 (develop→staging) was closed without
merging; `develop` is now 258 commits ahead of `staging` (up from 160 on
June 17) and neither branch has moved toward the other since. A new
develop→staging PR is being opened as part of this update — see Immediate
Next Execution Order.

Security posture is unchanged and clean: CodeQL 0 open alerts, Dependabot
security 0 open alerts. The Dependabot PR queue is not fully empty — 1 new
routine (non-security) version-bump PR (#115) is open.

Stripe/subscription production proof (P0-11) has **not** changed since
June 17 — still no live-checkout evidence captured, still blocking a paid
launch. See Phase 4 for the fastest-path option (defer paid tiers) if that's
preferred over completing full Stripe/RevenueCat validation.

The release is still blocked by unresolved R1 Gate 2 mobile/backend evidence,
branch promotion divergence (now worse), subscription production proof, and
remaining governance signoff outside the synchronized release docs.

## Current Evidence Snapshot

Run date: July 9, 2026. Rows marked "re-verified July 9" were actually re-run
this session; all other rows are the June 15/17 baseline and should be
re-run before a release cut.

| Area                 | Command or source                                                                                 | Result                                                         | Go-live meaning                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Local branch sync    | `git rev-list --left-right --count @{upstream}...HEAD` (re-verified July 9)                       | `0 0`                                                          | Local `develop` is synced with `origin/develop`.                                                |
| Local worktree       | `git status --short --branch` (re-verified July 9)                                                | Clean (only pre-existing untracked scratch dirs, unrelated)    | Release-candidate source can be cut only from a clean, traceable commit.                         |
| Web unit tests       | `npm --workspace=@vehicle-vitals/web run test:unit`                                               | Pass, 399 tests (July 9, during footer/logo work this session) | Good baseline; grew from 378 (June 15) to 399.                                                  |
| Web type check       | `npm --workspace=@vehicle-vitals/web run check` (re-verified July 9)                              | Pass                                                           | Local blocker cleared; confirmed clean in CI on every deploy this session.                      |
| Web lint             | `npm --workspace=@vehicle-vitals/web run lint` (re-verified July 9)                                | Pass, 19 warnings                                              | Local blocker cleared; React hook/compiler warnings are intentionally non-blocking for this cut. |
| Web production build | `npm run build:web`                                                                               | Pass with chunk/dynamic-import warnings (June 15/17 baseline)  | Deployable artifact builds; warnings need performance disposition before public launch.         |
| Shared package       | `npm --workspace=@vehicle-vitals/shared run check`; `cd packages/shared && npx vitest run tests`  | Pass, 25 tests (June 15/17 baseline, not re-run this session)  | Good baseline.                                                                                  |
| Firebase utils       | `npm --workspace=@shared/firebase-utils run build`                                                | Pass (June 15/17 baseline, not re-run this session)            | Good baseline.                                                                                  |
| Functions            | `npm --workspace=functions run build`; `npm --workspace=functions test`                           | Pass, 70 tests run, 67 pass, 3 skipped (June 15/17 baseline, not re-run this session) | Good backend baseline; Functions source did change this session (email provider migration) — recommend re-running before release cut. |
| Functions lint       | `npm --workspace=functions run lint`                                                              | Pass with 4 warnings (June 15/17 baseline)                     | Non-blocking cleanup.                                                                           |
| Mobile tests         | `cd packages/mobile && flutter test`                                                              | Pass, 17 tests (June 15/17 baseline, not re-run this session)  | Good baseline.                                                                                  |
| Mobile analyze       | `cd packages/mobile && flutter analyze`                                                           | Pass (June 15/17 baseline, not re-run this session)            | Local blocker cleared.                                                                          |
| Script tests         | `npm run test:scripts`                                                                            | Pass, 4 tests (June 15/17 baseline, not re-run this session)   | Good baseline.                                                                                  |
| Firebase rules       | `firebase emulators:exec --only firestore,storage --project vehicle-vitals-dev 'echo rules-ok'`   | Pass (June 15/17 baseline, not re-run this session)            | Firestore and Storage rules load successfully; path behavior still needs release-flow smoke.     |
| R1 mobile build/launch | `./scripts/smoke-r1-mobile-runtime.sh`; HADES release run                                        | Pass (June 15 baseline); no newer evidence in `artifacts/smoke/` | Release-like iOS build and launch path is current as of June 15; acceptance/backend proof still blocks Gate 2. |
| Email delivery provider | Migration commit `4dd5ad6`; `gcloud secrets versions list` for `WORKSPACE_SMTP_USER`/`WORKSPACE_SMTP_APP_PASSWORD` (re-verified July 9) | SendGrid was scaffolded but never configured (dead code, no secrets ever existed) — migrated to Google Workspace SMTP; secrets now exist with enabled versions in all 3 Firebase projects | Previously-undiscovered deploy blocker (Functions deploy failed in all 3 projects on missing secrets) is now resolved and confirmed via multiple successful Deploy Firebase runs this session. |
| Stripe / subscriptions | Phase 4 checklist; `./scripts/smoke-monetization-readiness-capture.sh`                            | Not run — no live Stripe checkout/webhook/portal evidence captured (unchanged since June 17) | Still blocks a paid launch (P0-11). Free-tier+ads or coming-soon options in Phase 4 do not require this. |
| CodeQL               | `gh api "repos/mnelson3/vehicle-vitals/code-scanning/alerts?state=open"` (re-verified July 9)     | 0 open alerts                                                  | CodeQL blocker remains closed on `develop`.                                                      |
| Dependabot alerts     | `gh api repos/mnelson3/vehicle-vitals/dependabot/alerts` (re-verified July 9)                    | 0 open security alerts                                         | Security posture unchanged and clean.                                                            |
| GitHub CI            | Run `29034124504` for commit `27b4a12` (re-verified July 9)                                       | Quality Gate ✅, Build Web App ✅, Deploy Firebase ✅ (development environment) | `develop` is deployable to its own environment; iOS build not exercised this run (only triggers for staging/production). |
| GitHub PR queue      | `gh pr list --state open` (re-verified July 9)                                                    | 1 open PR: #115, routine (non-security) Dependabot root-npm bump; **PR #103 (develop→staging) was closed without merging** | Queue is not empty; branch promotion regressed and needs a fresh PR (see Immediate Next Execution Order). |
| Branch promotion     | `git rev-list --left-right --count origin/staging...origin/develop` (re-verified July 9)          | staging ahead 1, develop ahead 258                              | Staging is further from current than on June 17 (was develop-ahead 160-163); gap grew instead of closing. |
| Branch promotion     | `git rev-list --left-right --count origin/main...origin/staging` (re-verified July 9)             | main ahead 20, staging ahead 604                                | Production promotion path is still not clean.                                                    |
| Branch protection    | `gh api repos/mnelson3/vehicle-vitals/branches/{branch}/protection` (re-verified July 9)          | `develop` still lacks required status checks, reviews, and signed commits; `staging` is fully protected (1 required review, signed commits, enforced admins, required Pipeline Summary check) | Governance gap unchanged: `develop` and `main` protection needs decision before release freeze. Note: `staging`'s required review means I (Claude) can open the develop→staging PR but cannot merge it myself — Mark's review/approval is required. |
| Security features    | `npm run security:audit` (repository security features)                                           | Dependabot security updates enabled; secret scanning enabled; push protection enabled (June 15/17 baseline) | Good posture. No open Dependabot security alerts.                                       |
| Readiness report     | `bash scripts/staging-production-readiness-report.sh`                                             | NO-GO (last run June 15, not re-run this session)               | Re-run before release cut; `artifacts/release/staging-to-production-readiness-20260615T202036Z.md` is the latest artifact. |

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
| P0-08 | Open                   | Dependabot PR queue is unstable                          | Resolved June 17 (PRs #101/#102 merged), but a new routine version-bump PR (#115, root-npm group, non-security) opened since. 0 Dependabot security alerts open. | Queue returns to 0 open PRs, or remaining PRs are confirmed non-security and explicitly deferred past release freeze. |
| P0-09 | Open — regressed       | Branch promotion path is stale/diverged                  | As of July 9: `develop` is 258 commits ahead of `staging` (up from 160 on June 17); `staging` is 1 commit ahead of `develop`; `staging` is 604 commits ahead of `main`; `main` is 20 ahead of `develop`. PR #103 (develop→staging) was **closed without merging** — a new PR is being opened as part of this update. Readiness report last run June 15 returns NO-GO. | Release branch policy is re-established and readiness report returns GO. |
| P0-10 | Closed locally         | Active deployment docs reference obsolete workflow names | `docs/DEPLOY.md` and `docs/PROD_SETUP_GUIDE.md` now reference `master-pipeline.yml`; pipeline deploy targets include Firestore, Storage, Functions, and Hosting                                                                    | Docs name `master-pipeline.yml`, correct workflow inputs, and correct deploy targets.                                                                                |
| P0-11 | Open — unchanged       | Subscription launch is not production-proven             | No live Stripe checkout/webhook/portal evidence captured as of July 9 (unchanged since June 17). RevenueCat/IAP proof also outstanding.                                                                                          | Paid launch evidence proves checkout, webhooks, entitlement reconciliation, quota enforcement, failed-payment recovery, refunds/cancellations, and support handling — or launch copy explicitly defers paid tiers (Phase 4, Option A/B). |
| P0-12 | Partially open         | Release governance docs need final signoff               | This runbook is now current as of July 9; production release brief, R1 checklist, requirements, release scope, and next-features execution plan have not been re-synchronized this session                                          | `PROJECT_PLAN`, `PRODUCTION_RELEASE_BRIEF`, `R1_COMPLETION_CHECKLIST`, and this runbook are synchronized and signed off.                                             |
| P0-13 | Closed                 | Email delivery provider was scaffolded (SendGrid) but never configured, silently blocking every Functions deploy in all 3 Firebase projects | Migrated to Google Workspace SMTP (commit `4dd5ad6`); `WORKSPACE_SMTP_USER`/`WORKSPACE_SMTP_APP_PASSWORD` secrets created in `vehicle-vitals-dev`, `-staging`, and `-prod`; Deploy Firebase has succeeded repeatedly since (e.g. run `29034124504`) | ✅ Done. Functions deploy is unblocked in all three environments. |

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
    - CI run `27699695742` (commit `22cf9b9`): Quality Gate ✅, Build Web App ✅, Deploy Firebase ✅; Build iOS App queued (macOS runner)
    - Merge once iOS build completes and the staging rehearsal plan is confirmed
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

Prerequisite: PR #103 (develop→staging) merged and staging CI green.

Checklist:

- [ ] Verify PR #103 is merged and the staging branch CI completed successfully:

```bash
gh run list --branch staging --limit 5
```

- [ ] If PR #103 is not yet merged, merge it first:

```bash
gh pr merge 103 --squash
```

- [ ] If staging CI did not run automatically after merge, trigger manually:

```bash
gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=staging
```

- [ ] Confirm workflow completed successfully and all jobs passed:

```bash
gh run list --branch staging --limit 3
gh run view <run-id> --json jobs
```

- [ ] Confirm deploy targets included Hosting, Firestore, Storage, Functions, and Firestore indexes.
  - Note: the pipeline's `deploy_only` action skips Functions for production. Use
    `build_and_deploy` to ensure Functions are deployed.
- [ ] Verify staging URL is live and accessible: https://vehicle-vitals-staging.web.app
- [ ] Run automated UAT against staging:

```bash
BASE_URL=https://vehicle-vitals-staging.web.app ./scripts/run-uat-tests.sh staging
```

- [ ] Manual smoke test (staging environment):
  - [ ] Landing page loads, no console errors
  - [ ] Sign up with a new email → confirm Firebase Auth creates user
  - [ ] Sign in / sign out cycle
  - [ ] Add vehicle (VIN lookup working, data saves)
  - [ ] Edit vehicle (status: active/stored)
  - [ ] Maintenance create, edit, delete
  - [ ] Upcoming reminders visible
  - [ ] Record export: CSV and PDF download correctly
  - [ ] Attachment upload → file visible in Storage
  - [ ] Contact/support page navigates correctly
  - [ ] Privacy and Terms pages load
  - [ ] No 404s on navigation
- [ ] Check Firebase Functions logs for errors:
  - Go to Firebase Console → Functions → Logs → select `vehicle-vitals-staging`
- [ ] Check browser DevTools console for unhandled errors.
- [ ] Check Firestore for actual data writes (confirm real user records exist after smoke).
- [ ] Verify security headers:

```bash
curl -I https://vehicle-vitals-staging.web.app | grep -E "content-security|x-frame|x-xss"
```

Exit criteria:

- [ ] Staging smoke passes all manual steps.
- [ ] UAT passes or failures are explicitly accepted.
- [ ] No untriaged high-severity runtime errors in Functions or browser.
- [ ] Product owner signs launch scope decision.

Evidence:

- Link to staging CI run.
- UAT output.
- Manual smoke sign-off notes with timestamps.
- Screenshots for at least: sign-in, vehicle add, record export.

## Phase 8: Production Release

Owner: Release manager

Pre-release checklist:

- [ ] Go/no-go meeting completed.
- [ ] All required owners signed off.
- [ ] Rollback owner is available.
- [ ] Support owner is available.
- [ ] Monitoring owner is available.
- [ ] Marketing/public launch time is confirmed.
- [ ] `VITE_SHOW_COMING_SOON_PRODUCTION` GitHub secret is set intentionally:
  - [ ] `true` for coming-soon/prelaunch (safe to deploy at any time)
  - [ ] `false` for public app launch (removes the gate; confirms live)
  - Verify current value: GitHub repo → Settings → Secrets and variables → Actions → `VITE_SHOW_COMING_SOON_PRODUCTION`
  - The CI pipeline reads this secret and bakes it into the web build; a redeployment is required after any change.
- [ ] Production secrets are present and current. Verify:

```bash
gh secret list --repo mnelson3/vehicle-vitals 2>/dev/null | grep -E "PROD|FIREBASE|STRIPE|APPLE"
```

- [ ] Firebase production project is `vehicle-vitals-prod` (confirmed in `.cicd/projects/vehicle-vitals.yml`).
- [ ] No active incident or provider outage blocks launch (check Firebase Status, Stripe Status).

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

| Area                 | Owner         | Decision | Notes |
| -------------------- | ------------- | -------- | ----- |
| Engineering          | Mark Nelson   |          | Quality Gate green on `develop` as of July 9 (CI run `29034124504`); email-provider deploy blocker resolved |
| Product              | Mark Nelson   |          | Launch scope decision required (see Phase 4 options) |
| Security/privacy     | Mark Nelson   |          | CodeQL 0, Dependabot security 0 (confirmed July 9); privacy policy signoff needed |
| Mobile/iOS           | Mark Nelson   |          | Gate 2 acceptance still open — build PASS (June 15), runtime PARTIAL; iOS build not re-exercised since July 2 |
| Billing/monetization | Mark Nelson   |          | Stripe/RevenueCat not proven, unchanged since June 17; defer or prove before launch |
| Support/operations   | Mark Nelson   |          | Support runbook and escalation path not published |
| Marketing/comms      | Mark Nelson   |          | Copy alignment with launch scope required |

Open conditions (pre-filled for review):

1. R1 Gate 2 acceptance evidence: close before any iOS launch claim.
2. Launch scope decision: web-only free tier, web+iOS, or coming-soon — determines what P0-11 (subscriptions) blocks.
3. Paid tier disposition: Stripe+RevenueCat proven OR launch copy explicitly defers paid tiers.
4. Branch promotion: develop→staging PR must merge (requires Mark's review per branch protection) before a staging rehearsal is meaningful.

Final decision rationale: (complete at go/no-go meeting)

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

As of July 9, 2026 (updated after the Google Workspace email migration, a
stale-UAT-test fix, and reopening branch promotion).

**Completed this session:**
- ✅ P0-13 Closed: migrated email delivery off never-configured SendGrid onto
  Google Workspace SMTP (commit `4dd5ad6`); secrets created in all 3 Firebase
  projects; this was silently blocking every Functions deploy
- ✅ Fixed stale `TC-PROFILE-002` UAT test that was intermittently failing
  Quality Gate (asserted a removed "Consolidate Accounts" button)
- ✅ Web unit tests grew to 399 (from 378), all passing; web type-check and
  lint re-verified clean
- ✅ CodeQL (0 open) and Dependabot security alerts (0 open) re-verified
- ✅ Runbook fully refreshed with July 9 evidence (this update)
- ✅ Branch promotion reopened: **PR #120** (develop→staging), supersedes the
  closed PR #103. Required "Pipeline Summary" check is green (reusing the
  already-passing `develop` CI run `29034124504`, since the PR head commit is
  identical). **Needs Mark's review/approval to merge** — `staging` requires
  1 approving review and this isn't a decision I'll make unilaterally.

**Remaining — requires your action:**

1. **Review and merge PR #120** (develop→staging):
   ```bash
   gh pr view 120 --web       # review the diff
   gh pr merge 120 --squash   # merge once satisfied
   ```
   This is the highest-priority item — the gap was 258 commits and growing
   before this PR, and every day it stays open makes the next promotion
   larger and riskier to review.

2. **Close R1 Gate 2** (P0-06) — CRITICAL BLOCKER, still open since June 15:
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

3. **Run staging rehearsal** (Phase 7) after PR #120 merges — this is the
   first time the Workspace SMTP secrets and the current iOS signing setup
   will be exercised together in the staging environment:
   ```bash
   gh workflow run master-pipeline.yml -f action=build_and_deploy -f environment=staging
   ```
   Confirm Deploy Firebase and Build iOS App both succeed, then smoke-test
   `vehicle-vitals-staging.web.app` manually.

4. **Apply branch protection** to `develop` and `main` (P1 gap, unchanged):
   - See Phase 3 checklist for the `gh api` command template.
   - Decision: match `staging`'s protection (Pipeline Summary check, enforce_admins,
     signed commits) or apply a lighter policy appropriate for the development branch.

5. **Prove or defer paid subscription launch behavior** (P0-11, unchanged since June 17):
   - Run `./scripts/smoke-monetization-readiness-capture.sh` with live Stripe evidence
   - OR update all public launch copy to defer paid tiers explicitly (Phase 4,
     Option A/B — fastest path if full Stripe/RevenueCat proof isn't a priority
     for this launch).

6. **Readiness report**: re-run after staging rehearsal passes:
   ```bash
   bash scripts/staging-production-readiness-report.sh
   ```

7. **Hold go/no-go review** and complete the Go/No-Go Record section.
