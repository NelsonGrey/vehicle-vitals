# Vehicle-Vitals - Master Project Plan

Last updated: May 28, 2026
Planning horizon: 8 weeks (rebaseline v2)
Primary source status: docs/REQUIREMENTS.md
Execution detail for R1: docs/R1_COMPLETION_CHECKLIST.md

## Plan Goal

Deliver production-capable parity by closing all R1 gates, then complete R2 parity and reliability work while establishing the Business Operations Foundation (account management + AR/AP readiness).

## Master Subscription Production Matrix

This matrix is the master project-plan view for subscription go-live readiness. It rolls business and technical requirements into one production decision surface and should stay synchronized with `docs/REQUIREMENTS.md`, `docs/R1_COMPLETION_CHECKLIST.md`, and `docs/PRODUCTION_RELEASE_BRIEF.md`.

| Area                                       | Requirement                                                                                                               | Type                   | Current state                                                                                                                        | Production / go-live exit                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Packaging and pricing                      | Free, Pro, Premium, and Enterprise subscription tiers stay consistent across product, billing copy, and entitlement logic | Business               | Implemented in feature flags and subscription UI; terminology and parity docs now aligned around subscriptions                       | One approved tier catalog and pricing source is published across web, mobile, backend, and support docs             |
| Value proposition by tier                  | Each subscription tier has a defined customer promise, limits, and differentiators                                        | Business               | Mostly implemented; Free/Pro/Premium contracts exist, Enterprise remains web/backend-led                                             | Tier messaging and feature comparison are accepted for web and mobile release surfaces                              |
| Checkout and billing                       | Users can start, upgrade, downgrade, and recover subscriptions through production billing rails                           | Business + Technical   | Partial; Stripe checkout session creation and webhook reconciliation exist, but production validation is still open                  | Live checkout, webhook monitoring, cancellation, downgrade, and failed-payment recovery are proven with evidence    |
| Mobile purchase path                       | Native mobile purchase flow reconciles to backend entitlements                                                            | Business + Technical   | Planned; RevenueCat mobile IAP abstraction is not yet integrated                                                                     | RevenueCat purchase, restore, and entitlement reconciliation pass on release builds                                 |
| Subscription state authority               | Firestore/backend remains the source of truth for subscription state, trial state, and entitlement resolution             | Technical              | Partial; subscription state exists in user documents and server-authoritative entitlements are in place, with hardening still needed | State transitions are deterministic, audited, and validated across web, mobile, and functions                       |
| Quotas and enforcement                     | Vehicle limits, upload limits, API access, and AI usage are enforced by tier, not just by client messaging                | Business + Technical   | Partial; web/mobile feature gates exist, backend quota enforcement is still incomplete                                               | Backend and rules enforce tier limits with release-tested downgrade and overage behavior                            |
| Web subscription UX                        | Web subscription surfaces accurately present tiers, billing state, and recovery actions                                   | Technical              | Implemented with hardening in progress; subscription page, recovery UX, and comparison table exist                                   | Web regression, UAT, and billing-state edge cases pass without terminology drift                                    |
| Mobile subscription UX                     | Mobile subscription surface matches release scope and presents subscription state clearly                                 | Technical              | Partial; mobile catalog exists, but release-mode acceptance and parity are still open                                                | Release-like iOS/Android validation confirms tier visibility, purchase states, and support/contact paths            |
| Tier parity across platforms               | Web and mobile expose the same intended subscription contract for each tier                                               | Technical              | Partial; Free is mostly aligned, Pro/Premium/Enterprise still have parity gaps                                                       | Subscription parity matrix reaches approved release baseline or any gap is explicitly deferred with risk acceptance |
| Reminder, export, and calendar value gates | Paid subscription features materially work in the flows customers buy them for                                            | Business + Technical   | Partial; reminder lifecycle is strong, export parity is validated, calendar/provider validation is still open                        | Paid feature flows work end-to-end in production-like environments with linked evidence                             |
| Ads and premium suppression                | Free/Pro ad delivery and Premium ad suppression work as sold                                                              | Business + Technical   | Planned/partial; ad and premium components are wired, release validation is still pending                                            | Ad network integration and Premium no-ads behavior are validated in release builds                                  |
| Trial, grace period, and churn controls    | Trial conversion, payment-failure grace, renewal reminders, and win-back automations support retention                    | Business               | Planned/partial; grace-period UX exists, automation remains unfinished                                                               | Trial lifecycle and retention automations are live, measurable, and support-approved                                |
| Support and operations readiness           | Support, sales, and go-live operators can diagnose and handle subscription issues                                         | Business + Technical   | Partial; support/contact surfaces exist and Enterprise handoff is defined                                                            | Runbooks, escalation paths, and billing/support evidence are published and usable during launch                     |
| Release evidence and decisioning           | Subscription launch status can be defended in the production go/no-go review                                              | Technical + Governance | Partial; R1 evidence exists, Gate 2 is still blocking the release-capable claim                                                      | R1 Gate 2 closes, monetization evidence is linked, and the release brief records a go-live decision                 |

### Current Go-Live Readout

| Category            | Requirement summary                                                                   | Current state | Blocking go-live now                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Business readiness  | Tier packaging, support handoff, and retention design are defined at a planning level | Yellow        | Billing operations, trial/grace automation, and launch-ready support runbooks are incomplete                               |
| Technical readiness | Subscription UI, entitlement primitives, and core monetization wiring exist           | Yellow        | Stripe production validation, RevenueCat integration, backend quota enforcement, and mobile release validation remain open |
| Release governance  | Core R1 evidence is mostly in place                                                   | Yellow        | R1 Gate 2 mobile runtime acceptance is still the immediate blocker to a production-capable release claim                   |

Current monetization evidence path: `./scripts/smoke-monetization-readiness-capture.sh`
produces `artifacts/smoke/monetization-readiness-*.log` and only marks
subscription go-live PASS when Stripe Billing, entitlement reconciliation,
backend quotas, RevenueCat/IAP or native paid-feature deferral, Premium ad
suppression, and support visibility evidence are all explicitly present.

### Subscription Go-Live Priority Sequence

1. Close R1 Gate 2 and publish final mobile runtime/backend evidence.
2. Complete Stripe production validation for checkout, webhooks, and failed-payment recovery.
3. Integrate RevenueCat and verify entitlement reconciliation on mobile release builds.
4. Harden backend quota enforcement and validate downgrade/over-limit behavior.
5. Finish calendar/provider validation, ad-behavior validation, and support/runbook readiness.
6. Record final subscription go-live recommendation in `docs/PRODUCTION_RELEASE_BRIEF.md`.

## Milestone Schedule

| Window   | Milestone                           | Outcome                                                        |
| -------- | ----------------------------------- | -------------------------------------------------------------- |
| Week 1   | R1 Gate 2 closure                   | Mobile runtime parity evidence complete and R1 decision logged |
| Week 2-3 | R2 Calendar and Timeline            | Reliable calendar UX + improved mobile timeline parity         |
| Week 4   | R2 API enrichment                   | Manuals/warranty/maintenance-plan surfaced with stable UX      |
| Week 5   | R2.5 Business Operations Foundation | Account-management baseline + AR/AP contract definition        |
| Week 6-7 | Monetization hardening              | Stripe/IAP reliability and entitlement transition QA           |
| Week 8   | Stabilization and release prep      | Regression pass, documentation sync, release recommendation    |

## Calendarized Schedule (2026)

| Week   | Date Range      | Primary Focus                                                   |
| ------ | --------------- | --------------------------------------------------------------- |
| Week 1 | May 25 - May 29 | Close R1 Gate 2 acceptance evidence and run R1 closure prep     |
| Week 2 | Jun 1 - Jun 5   | R1 closure decision + R2 calendar reliability hardening         |
| Week 3 | Jun 8 - Jun 12  | R2 timeline parity completion                                   |
| Week 4 | Jun 15 - Jun 19 | R2 API enrichment client integration                            |
| Week 5 | Jun 22 - Jun 26 | R2.5 business foundation (account management + AR/AP contracts) |
| Week 6 | Jun 29 - Jul 3  | Stripe/entitlement production hardening and QA                  |
| Week 7 | Jul 6 - Jul 10  | Integration reliability, regression, and release evidence       |
| Week 8 | Jul 13 - Jul 17 | Final release recommendation and rollout prep                   |

## Workstreams

### WS1: R1 Production Gates (Critical Path)

Scope:

- Reminder delivery reliability
- Mobile runtime parity validation
- Export parity signoff

Dependencies:

- Provider environment configuration
- Stable smoke dataset
- iOS build environment readiness

Evidence outputs:

- artifacts/smoke/r1-reminder-\*.log
- artifacts/smoke/r1-mobile-\*.log
- artifacts/smoke/r1-export-\*

Exit:

- All gates marked Done in docs/R1_COMPLETION_CHECKLIST.md

### WS2: R2 Product Parity

Scope:

- Calendar reliability and fallback UX
- Mobile timeline depth and semantic parity
- API enrichment client integration

Dependencies:

- R1 complete
- Contract stability for integration endpoints

Exit:

- R2 items marked complete in docs/NEXT_FEATURES_EXECUTION_PLAN.md

### WS3: R3-R4 Expansion Readiness

Scope:

- Budget forecasting improvements
- Service provider expansion
- Premium/ad hardening
- Fleet design and implementation kickoff

Dependencies:

- R1 and core R2 complete

Exit:

- Approved R3 release slice and R4 implementation plan

### WS4: Business Operations Foundation (R2.5)

Scope:

- Account management domain baseline (organization profile + role boundaries)
- AR/AP data contracts and lifecycle definitions
- Initial implementation scaffolding for invoice and payable entities

Dependencies:

- R1 completion (or explicit risk acceptance)
- Entitlement and org-role stability across web/mobile/backend

Exit:

- Approved technical design and first implementation slice merged

## Team Ownership Model

| Area                      | Suggested Role         | Owner                 | Backup                       |
| ------------------------- | ---------------------- | --------------------- | ---------------------------- |
| Reminder reliability      | Functions lead         | Mark Nelson (interim) | Mark Nelson (interim backup) |
| Mobile parity validation  | Mobile lead            | Mark Nelson (interim) | Mark Nelson (interim backup) |
| Export parity             | Web + Mobile QA owner  | Mark Nelson (interim) | Mark Nelson (interim backup) |
| Calendar parity           | Full-stack owner       | Mark Nelson (interim) | Mark Nelson (interim backup) |
| API enrichment            | Backend + client owner | Mark Nelson (interim) | Mark Nelson (interim backup) |
| Release evidence tracking | Release manager        | Mark Nelson (interim) | Mark Nelson (interim backup) |

## Weekly Operating Cadence

- Monday: plan review and owner assignment updates
- Wednesday: mid-week risk and blocker review
- Friday: evidence review and status publication

Required updates every week:

1. Update docs/R1_COMPLETION_CHECKLIST.md dashboard
2. Sync docs/REQUIREMENTS.md and docs/RELEASE_SCOPE_MATRIX.md when status changes
3. Update docs/NEXT_FEATURES_EXECUTION_PLAN.md progress notes

## R1 Decision Checkpoints

| Checkpoint         | Target Date  | Entry Criteria                                       | Exit Criteria                                    |
| ------------------ | ------------ | ---------------------------------------------------- | ------------------------------------------------ |
| R1 Midpoint Review | May 30, 2026 | Gate 2 acceptance run executed with evidence updates | Risks documented and corrective actions assigned |
| R1 Closure Review  | Jun 5, 2026  | Gate 2 accepted and checklist/dashboard synchronized | R1 go or no-go decision recorded                 |

If entry criteria are not met at a checkpoint, the plan requires a dated rebaseline in this file and docs/NEXT_FEATURES_EXECUTION_PLAN.md.

## R1 Closure Review Record Template (Jun 5, 2026)

Use this template during the Jun 5 closure review and keep the completed record in this file for auditability.

### Meeting Metadata

- Review date:
- Facilitator:
- Participants:
- Decision: GO | NO-GO | GO WITH CONDITIONS

### Entry Criteria Verification

- Gate 2 acceptance executed on release-like build: PASS | FAIL
- Gate 2 backend-traffic evidence captured and linked: PASS | FAIL
- R1 dashboard synchronized across release docs: PASS | FAIL

### Evidence Links Reviewed

- Gate 1 evidence:
- Gate 2 build evidence:
- Gate 2 acceptance evidence:
- Gate 2 backend-traffic evidence:
- Gate 3 parity evidence:

### Risk and Blocker Disposition

- Open blocker summary:
- Mitigations assigned:
- Owner(s):
- Target close date(s):

### Go/No-Go Outcome Notes

- Rationale for decision:
- Scope approved for release claim:
- Scope deferred to post-R1:

### Follow-Up Actions

1. Update `docs/R1_COMPLETION_CHECKLIST.md` gate dashboard and completion rule outcome.
2. Update `docs/REQUIREMENTS.md`, `docs/RELEASE_SCOPE_MATRIX.md`, and `docs/NEXT_FEATURES_EXECUTION_PLAN.md` with decision-aligned status.
3. Update `docs/PRODUCTION_RELEASE_BRIEF.md` decision summary and blocker list.

## R1 Closure Review Pre-Fill Draft (As of May 27, 2026)

This draft is intended to be finalized at the Jun 5 review after Gate 2 runtime evidence is refreshed.

### Meeting Metadata (Draft)

- Review date: Jun 5, 2026 (planned)
- Facilitator: Mark Nelson (interim release manager)
- Participants: Mark Nelson (interim mobile lead/functions lead/QA owner), Product Owner
- Decision: NO-GO (provisional)

### Entry Criteria Verification (Draft)

- Gate 2 acceptance executed on release-like build: FAIL (runtime session established on simulator, but end-to-end acceptance checklist not completed)
- Gate 2 backend-traffic evidence captured and linked: FAIL (runtime established, but backend success-path evidence is still incomplete)
- R1 dashboard synchronized across release docs: PASS (current docs align on Gate 2 as remaining blocker)

### Evidence Links Reviewed (Draft)

- Gate 1 evidence: `artifacts/smoke/r1-reminder-reliability-20260506T234254Z.log`
- Gate 2 build evidence: `artifacts/smoke/r1-mobile-build-20260527T221621Z.log`
- Gate 2 acceptance evidence: `artifacts/smoke/r1-mobile-acceptance-20260527T225954Z.log`
- Gate 2 backend-traffic evidence: `artifacts/smoke/r1-mobile-backend-traffic-20260527T225954Z.log`
- Gate 2 attached runtime evidence (physical): `artifacts/smoke/r1-mobile-attached-run-udid-20260527T222306Z.log`
- Gate 2 attached runtime evidence (simulator): `artifacts/smoke/r1-mobile-attached-run-sim-20260527T225748Z.log`
- Gate 3 parity evidence: `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md`

### Risk and Blocker Disposition (Draft)

- Open blocker summary: Gate 2 status is Build PASS with simulator runtime session evidence, but acceptance remains incomplete and backend success-path validation is still outstanding.
- Mitigations assigned: complete full acceptance checklist, capture authenticated backend success evidence, and refresh backend evidence to PASS.
- Owner(s): Mark Nelson (interim execution, evidence publication, and signoff coordination)
- Target close date(s): Jun 5, 2026 for Gate 2 evidence and R1 decision update.

### Go/No-Go Outcome Notes (Draft)

- Rationale for decision: R1 cannot be declared complete while Gate 2 remains open.
- Scope approved for release claim: none until Gate 2 closure criteria are met.
- Scope deferred to post-R1: Stripe hardening, RevenueCat integration, tier quota enforcement, calendar reliability signoff.

### Finalization Criteria for Jun 5 Meeting

1. Replace provisional NO-GO with final decision after Gate 2 rerun.
2. Update entry criteria outcomes to PASS/FAIL based on fresh artifacts.
3. Confirm synchronized status updates in `docs/R1_COMPLETION_CHECKLIST.md`, `docs/REQUIREMENTS.md`, `docs/RELEASE_SCOPE_MATRIX.md`, `docs/NEXT_FEATURES_EXECUTION_PLAN.md`, and `docs/PRODUCTION_RELEASE_BRIEF.md`.

## Critical Path and Dependencies

1. R1 Gate 1 reminder reliability
2. R1 Gate 2 mobile runtime parity
3. R1 Gate 3 export parity signoff
4. R2 calendar and timeline parity
5. R2 API enrichment completion

If any R1 gate slips, R2 start should be treated as at-risk.

## Risk Register

| Risk                                    | Impact | Likelihood | Mitigation                                               | Owner                 |
| --------------------------------------- | ------ | ---------- | -------------------------------------------------------- | --------------------- |
| Provider credentials misconfigured      | High   | Medium     | Run preflight env checklist before each gate run         | Mark Nelson (interim) |
| iOS release build instability           | High   | Medium     | Keep reproducible build logs and fallback simulator path | Mark Nelson (interim) |
| Export parity drift from schema changes | Medium | Medium     | Freeze fixture schema during parity window               | Mark Nelson (interim) |
| Integration endpoint variability        | Medium | Medium     | Use fixed test VINs and controlled cache settings        | Mark Nelson (interim) |
| Scope creep into R4 features            | Medium | High       | Enforce R1-first governance in weekly review             | Mark Nelson (interim) |

## Definition of Done by Milestone

### R1 Done

- All three gates complete with linked evidence artifacts
- Docs synchronized across requirements, matrix, and execution plan
- Release recommendation includes known residual risks

### R2 Done

- Calendar reliability validated for supported targets
- Timeline parity improvements accepted
- API enrichment visible in client UX with fallback behavior

### R3 Done

- Forecasting slice delivered with measurable acceptance checks

## Immediate Next 10 Business Days

1. Replace interim owners/backups with dedicated leads and confirm target dates for all R1 gates.
2. Complete mobile runtime acceptance and backend-traffic evidence for Gate 2.
3. Synchronize R1 dashboard and go/no-go recommendation using the latest evidence artifacts.
4. Finalize backend Enterprise entitlement integration reliability with emulator-backed or enabled-project execution evidence.
5. Execute Stripe checkout/webhook production validation and document failure-recovery behavior.
6. Kick off RevenueCat mobile IAP integration and entitlement transition QA plan.
7. Kick off R2.5 business foundation implementation for account management and AR/AP contracts.
8. Connect AR/AP callable scaffolds into first web admin flow for draft invoice/payable creation.
9. Add emulator-backed AR/AP integration evidence and publish results in release artifacts.
