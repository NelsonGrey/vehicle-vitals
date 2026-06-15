# Vehicle Vitals - Production Release Brief

Last updated: June 15, 2026
Release decision window: next go/no-go review after R1 Gate 2 and release-candidate CI evidence

## Decision Summary

Current recommendation: NO-GO for production-capable release claim.

Reason:

- R1 Gate 2 status is Build/launch PASS with current release-like iOS evidence, but manual acceptance and backend success-path validation are still incomplete.
- R1 Gate 1 and Gate 3 are complete with linked evidence.
- June 15 local go-live stabilization cleared web type-check, web lint, web
  tests, production web build, shared tests, Functions build/lint/tests, mobile
  tests/analyzer, script tests, and Firebase Firestore/Storage rules startup.
- Remaining launch blockers are tracked in `docs/GO_LIVE_RUNBOOK.md`.

## Subscription Go-Live Readout

Source of truth: `docs/PROJECT_PLAN.md` master subscription production matrix.

| Category            | Current state | Release meaning                                                                                                                                                                   |
| ------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business readiness  | Yellow        | Subscription packaging exists, but billing operations, trial/grace automation, and launch-ready support runbooks are not yet complete.                                            |
| Technical readiness | Yellow        | Subscription UI and entitlement primitives exist, but Stripe production validation, RevenueCat integration, backend quota enforcement, and mobile release validation remain open. |
| Release governance  | Yellow        | Core R1 evidence is mostly present, but Gate 2 is still the blocking condition for a production-capable subscription go-live claim.                                               |

Immediate subscription go-live blockers:

1. Close R1 Gate 2 mobile runtime acceptance with explicit backend success evidence.
2. Complete Stripe production validation for checkout, webhooks, and payment-failure recovery.
3. Integrate RevenueCat mobile purchase flow and entitlement reconciliation.
4. Harden backend quota enforcement and validate downgrade and over-limit behavior.

## Gate Status

| Gate                                      | Status                                           | Evidence                                                                                                                                                                                                                                         | Release impact |
| ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| Gate 1 - Reminder delivery reliability    | Complete                                         | artifacts/smoke/r1-reminder-reliability-20260506T234254Z.log                                                                                                                                                                                     | No blocker     |
| Gate 2 - Mobile runtime parity validation | Build/launch PASS; acceptance/backend BLOCKED | artifacts/smoke/r1-mobile-build-20260615T154819Z.log, artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log, artifacts/smoke/r1-mobile-acceptance-20260601T221521Z.log, artifacts/smoke/r1-mobile-backend-traffic-20260601T221521Z.log | Blocking       |
| Gate 3 - Export parity signoff            | Complete (automated)                             | artifacts/smoke/r1-export-parity-report-20260507T174923Z.md                                                                                                                                                                                      | No blocker     |

## Blocking Items

1. Complete Gate 2 manual/runtime acceptance on iOS with real backend traffic evidence.
2. Resolve Gate 2 acceptance and backend FAIL outcomes by completing end-to-end checklist validation and capturing explicit backend success-path evidence.
3. Record R1 go/no-go outcome after Gate 2 evidence is updated.
4. Confirm the queued GitHub iOS CI job completes successfully for the June 15
   stabilization branch.

Latest execution update (June 15, 2026):

- `./scripts/smoke-r1-mobile-runtime.sh` was re-run and produced new PASS evidence at `artifacts/smoke/r1-mobile-build-20260615T154819Z.log`.
- Step 1 (`flutter analyze`) passed with no issues.
- Step 2 (`flutter build ios --release --no-codesign`) completed successfully and built `build/ios/iphoneos/Runner.app` (68.4 MB).
- A release-mode HADES run built, installed, and launched the app, reaching the attached Flutter session; evidence: `artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log`.
- This pass did not execute the full manual acceptance flow.
- June 1 acceptance/backend artifacts remain the latest explicit non-build Gate 2 evidence:
  - `artifacts/smoke/r1-mobile-acceptance-20260601T221521Z.log` is PARTIAL/BLOCKED pending manual end-to-end signoff.
  - `artifacts/smoke/r1-mobile-backend-traffic-20260601T221521Z.log` is BLOCKED pending explicit auth, Firestore, and Functions proof.
- GitHub CodeQL is now clear on `develop` with 0 open code-scanning alerts. The latest observed master pipeline on `develop` is still queued on the `Build iOS App` job.
- Gate 2 remains blocking until acceptance checklist completion and explicit backend success evidence pass.

## Interim Accountability (Until Dedicated Leads Are Assigned)

| Workstream                                            | Interim Owner         |
| ----------------------------------------------------- | --------------------- |
| R1 Gate 2 execution and evidence refresh              | Mark Nelson (interim) |
| R1 evidence publication and dashboard synchronization | Mark Nelson (interim) |
| Jun 5 closure review facilitation                     | Mark Nelson (interim) |

## Non-Blocking but High-Priority Hardening

1. Stripe production validation (live checkout, webhook monitoring, payment-failure recovery).
2. RevenueCat mobile IAP integration and entitlement-transition validation.
3. Tier quota enforcement hardening in backend/rules.
4. Calendar provider-account reliability signoff.

## Exit Criteria for Go Recommendation

All conditions must be true:

- R1 Gate 2 marked complete in docs/R1_COMPLETION_CHECKLIST.md.
- Gate dashboard synchronized across docs/R1_COMPLETION_CHECKLIST.md, docs/REQUIREMENTS.md, docs/RELEASE_SCOPE_MATRIX.md, and docs/NEXT_FEATURES_EXECUTION_PLAN.md.
- Final R1 closure decision recorded in docs/PROJECT_PLAN.md checkpoint section.
- Evidence artifacts are linked and auditable under artifacts/smoke/.

## Release Packet Completeness Checklist (Jun 5 Review)

Mark each item complete during the closure meeting.

### Gate Evidence

- [x] Gate 1 evidence linked (`artifacts/smoke/r1-reminder-reliability-20260506T234254Z.log`)
- [x] Gate 2 build evidence linked (`artifacts/smoke/r1-mobile-build-20260615T154819Z.log`)
- [x] Gate 2 release-mode HADES launch evidence linked (`artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log`)
- [ ] Gate 2 acceptance evidence updated to PASS with end-to-end runtime observations
- [ ] Gate 2 backend-traffic evidence updated to PASS with backend proof
- [x] Gate 3 evidence linked (`artifacts/smoke/r1-export-parity-report-20260507T174923Z.md`)

### Cross-Document Synchronization

- [x] `docs/R1_COMPLETION_CHECKLIST.md` dashboard updated to decision-aligned status
- [x] `docs/REQUIREMENTS.md` R1 gate status paragraph updated to decision-aligned status
- [x] `docs/RELEASE_SCOPE_MATRIX.md` execution order and Must-scope status updated
- [x] `docs/NEXT_FEATURES_EXECUTION_PLAN.md` remaining production list updated
- [ ] `docs/PROJECT_PLAN.md` R1 closure checkpoint recorded with final GO/NO-GO outcome

### Decision and Accountability

- [ ] Final closure decision recorded (GO | NO-GO | GO WITH CONDITIONS)
- [ ] Decision rationale captured in `docs/PROJECT_PLAN.md` pre-fill draft section
- [ ] Interim owner transition plan captured (if dedicated leads are assigned)
- [ ] Post-R1 follow-up scope confirmed (Stripe hardening, RevenueCat, quota enforcement, calendar reliability)

## Immediate Execution Sequence

1. Run Gate 2 acceptance flow end-to-end on the latest HADES release-mode launch path.
2. Capture acceptance/backend observations with `./scripts/smoke-r1-mobile-acceptance-capture.sh` and update artifact logs.
3. Update gate dashboard and publish R1 closure decision.
4. Begin monetization hardening slice (Stripe + RevenueCat + quota enforcement).

## Source of Truth

- docs/GO_LIVE_RUNBOOK.md
- docs/R1_COMPLETION_CHECKLIST.md
- docs/REQUIREMENTS.md
- docs/RELEASE_SCOPE_MATRIX.md
- docs/NEXT_FEATURES_EXECUTION_PLAN.md
- docs/PROJECT_PLAN.md
- docs/DEPLOYMENT_STATUS.md

## Review Packet

- Jun 5 closure meeting template and pre-fill draft: `docs/PROJECT_PLAN.md` (section: R1 Closure Review Record Template and R1 Closure Review Pre-Fill Draft)
