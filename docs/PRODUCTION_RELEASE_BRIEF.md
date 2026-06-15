# Vehicle Vitals - Production Release Brief

Last updated: June 15, 2026
Release decision window: next go/no-go review after R1 Gate 2 and release-candidate CI evidence

## Decision Summary

Current recommendation: NO-GO for production-capable release claim.

Reason:

- R1 Gate 2 status is Build PASS with simulator runtime session established, but manual acceptance remains FAIL and backend success-path validation is still incomplete.
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
| Gate 2 - Mobile runtime parity validation | Build PASS; runtime acceptance FAIL (latest run) | artifacts/smoke/r1-mobile-build-20260527T221621Z.log, artifacts/smoke/r1-mobile-attached-run-sim-20260527T225748Z.log, artifacts/smoke/r1-mobile-acceptance-20260527T225954Z.log, artifacts/smoke/r1-mobile-backend-traffic-20260527T225954Z.log | Blocking       |
| Gate 3 - Export parity signoff            | Complete (automated)                             | artifacts/smoke/r1-export-parity-report-20260507T174923Z.md                                                                                                                                                                                      | No blocker     |

## Blocking Items

1. Complete Gate 2 manual/runtime acceptance on iOS with real backend traffic evidence.
2. Resolve Gate 2 acceptance and backend FAIL outcomes by completing end-to-end checklist validation and capturing explicit backend success-path evidence.
3. Record R1 go/no-go outcome after Gate 2 evidence is updated.
4. Commit and push the June 15 stabilization slice, then confirm CI and CodeQL
   close the local fixes.

Latest execution update (May 27, 2026):

- `./scripts/smoke-r1-mobile-runtime.sh` was re-run and produced new evidence at `artifacts/smoke/r1-mobile-build-20260527T221621Z.log`.
- Step 1 (`flutter analyze`) passed.
- Step 2 entered `flutter build ios --release --no-codesign` and reached `Running Xcode build...` but did not complete within the execution window.
- Physical-device runtime launch was attempted directly on HADES and failed with Developer Mode/trust prerequisite message; attached-run evidence:
  - `artifacts/smoke/r1-mobile-attached-run-udid-20260527T222306Z.log`
- Premium startup auth-gating fix was applied in mobile service initialization, then simulator runtime was re-executed.
- Latest simulator runtime launch on iPhone 17 Pro (`F11E33C8-5AD4-401E-9735-6046522CC4D7`) completed Xcode build, synced app, and exposed VM service with no prior entitlement/auth callable errors observed in this run; attached-run evidence:
  - `artifacts/smoke/r1-mobile-attached-run-sim-20260527T225748Z.log`
- Automated validation refresh (May 27, 2026):
  - Mobile unit tests: PASS (`flutter test`, 11/11)
  - Web unit tests: PASS (`npm run test:unit`, 356/356)
  - Web UAT (Chromium): PASS with 8 executed + 19 intentionally skipped by current scenario gating (`npm run test:uat:chromium`)
- Session still ended with `Lost connection to device`, and acceptance checklist/backend success-path verification remain incomplete.
- Acceptance and backend-traffic artifacts were refreshed and remain explicit FAIL for this latest simulator attempt:
  - `artifacts/smoke/r1-mobile-acceptance-20260527T225954Z.log`
  - `artifacts/smoke/r1-mobile-backend-traffic-20260527T225954Z.log`
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
- [x] Gate 2 build evidence linked (`artifacts/smoke/r1-mobile-build-20260527T221621Z.log`)
- [x] Gate 2 acceptance evidence updated from BLOCKED to PASS/FAIL with runtime observations (`artifacts/smoke/r1-mobile-acceptance-20260527T225954Z.log`)
- [x] Gate 2 backend-traffic evidence updated from BLOCKED to PASS/FAIL with backend proof (`artifacts/smoke/r1-mobile-backend-traffic-20260527T225954Z.log`)
- [x] Gate 3 evidence linked (`artifacts/smoke/r1-export-parity-report-20260507T174923Z.md`)

### Cross-Document Synchronization

- [ ] `docs/R1_COMPLETION_CHECKLIST.md` dashboard updated to decision-aligned status
- [ ] `docs/REQUIREMENTS.md` R1 gate status paragraph updated to decision-aligned status
- [ ] `docs/RELEASE_SCOPE_MATRIX.md` execution order and Must-scope status updated if Gate 2 closes
- [ ] `docs/NEXT_FEATURES_EXECUTION_PLAN.md` remaining production list updated after Gate 2 decision
- [ ] `docs/PROJECT_PLAN.md` R1 closure checkpoint recorded with final GO/NO-GO outcome

### Decision and Accountability

- [ ] Final closure decision recorded (GO | NO-GO | GO WITH CONDITIONS)
- [ ] Decision rationale captured in `docs/PROJECT_PLAN.md` pre-fill draft section
- [ ] Interim owner transition plan captured (if dedicated leads are assigned)
- [ ] Post-R1 follow-up scope confirmed (Stripe hardening, RevenueCat, quota enforcement, calendar reliability)

## Immediate Execution Sequence

1. Resolve iOS device prerequisites (Developer Mode/trust).
2. Run Gate 2 acceptance flow end-to-end on release-like build.
3. Capture backend traffic evidence and update artifact logs.
4. Update gate dashboard and publish R1 closure decision.
5. Begin monetization hardening slice (Stripe + RevenueCat + quota enforcement).

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
