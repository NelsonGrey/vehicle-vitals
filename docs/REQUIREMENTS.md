# Vehicle Vitals - Project Requirements and Delivery Status

Project overview: Vehicle Vitals is a cross-platform vehicle ownership application (web + mobile) with Firebase-backed auth, data, reminders, exports, calendar utilities, provider lookup, and premium/ad monetization primitives.

Last updated: May 8, 2026
Project status: CORE IMPLEMENTED, R1 GATE CLOSURE IN PROGRESS

---

## Scope Contract

This document is the implementation truth for delivery status.

- Product intent authority: docs/PRODUCT_DESIGN.md
- Release scope authority: docs/RELEASE_SCOPE_MATRIX.md
- Execution authority: docs/NEXT_FEATURES_EXECUTION_PLAN.md

If these documents disagree, this file is source-of-truth for feature completion state.

---

## Executive Completion Snapshot

Overall completion against active roadmap:

- Implemented in code: ~75%
- Production-ready and validated: ~55%
- Remaining work: validation, parity hardening, and release confidence gates

Key reality:

- Web core workflows are implemented and deployed.
- Mobile uses real Firebase/runtime services (not mock/stub), but release-confidence validation remains open.
- Reminder lifecycle is implemented; reminder delivery reliability is still a production hardening item.
- Calendar and export capabilities exist on both clients; parity and provider-account validation are still open.

---

## Feature Traceability Baseline (April 2026)

| Feature Area                                               | Implementation Status | Production-Ready Status | Evidence                                                                                                                                                                                                                                 | Remaining for Production Claim                                         |
| ---------------------------------------------------------- | --------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Web core workflows (auth, vehicles, maintenance, timeline) | Implemented           | Mostly Ready            | `packages/web/src/pages/Home.tsx`, `packages/web/src/pages/EditVehicle.tsx`, `packages/web/src/pages/TimelineDashboard.tsx`                                                                                                              | Final UX parity pass and regression signoff                            |
| Mobile runtime parity (auth, firestore, functions)         | Partial               | Not Yet                 | `packages/mobile/lib/main.dart`, `packages/mobile/lib/services/firestore_service.dart`, `packages/mobile/lib/services/auth_service.dart`                                                                                                 | Release-mode acceptance run and production log evidence                |
| Reminder lifecycle (add/snooze/dismiss/complete/reopen)    | Implemented           | Ready                   | `packages/shared/src/firestoreServiceFactory.js`, `packages/web/src/pages/UpcomingTasks.tsx`, `packages/mobile/lib/screens/upcoming_tasks_screen.dart`                                                                                   | None for lifecycle; keep regression coverage                           |
| Reminder scheduling and delivery reliability               | Partial               | Not Yet                 | `packages/functions/src/index.ts` (`runMaintenanceReminderSchedule`, `runMaintenanceReminderSweep`, `sendMaintenanceReminder`), `packages/functions/src/email.provider.ts`                                                               | End-to-end scheduled sweep plus delivery evidence in prod-like env     |
| Export records (CSV/PDF web + mobile)                      | Implemented           | Partial                 | `packages/web/src/utils/dataExport.js`, `packages/mobile/lib/services/data_export_service.dart`                                                                                                                                          | Cross-platform output parity signoff against shared dataset            |
| Calendar integration (google/apple/ics)                    | Implemented           | Partial                 | `packages/functions/src/calendar.provider.ts`, `packages/functions/src/index.ts` (`createCalendarEventCallable`), `packages/web/src/utils/calendarService.js`, `packages/mobile/lib/services/calendar_service.dart`                      | Real provider-account validation and failure UX signoff                |
| Service provider directory                                 | Partial               | Not Yet                 | `packages/functions/src/index.ts` (`getLocalServiceProvidersCallable`), `packages/web/src/pages/ServiceProviders.tsx`, `packages/web/src/utils/localServiceProviders.js`                                                                 | Mobile parity and richer provider metadata                             |
| Premium entitlement and mobile ads                         | Partial               | Not Yet                 | `packages/functions/src/premium.provider.ts`, `packages/functions/src/index.ts` (`verifyPremiumPurchase`, `getPremiumEntitlement`), `packages/mobile/lib/services/premium_service.dart`, `packages/mobile/lib/components/ad_banner.dart` | Production purchase/entitlement validation and release monetization QA |
| Fleet manager workflows                                    | Not Implemented       | Not Ready               | Roadmap only                                                                                                                                                                                                                             | Full feature design and implementation                                 |
| Budget forecasting depth                                   | Partial               | Not Yet                 | `packages/web/src/components/CostAnalysisReportlet.tsx`, `packages/mobile/lib/screens/analytics_screen.dart`                                                                                                                             | Forecasting models, richer filters, and acceptance criteria            |
| Manuals/warranty/maintenance-plan enrichment               | Partial               | Not Yet                 | `packages/functions/src/index.ts` (`getOwnerManuals`, `getWarrantySummary`, `getMaintenancePlan`), provider modules                                                                                                                      | Client UX integration and contract validation across environments      |

Legend: Implemented, Partial, Not Implemented

---

## Production Readiness Gates (R1)

R1 is the minimum release confidence gate.

| Gate                             | Current State                                | Exit Criteria                                                                                | Evidence Required                                                                                                        |
| -------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Reminder delivery reliability    | ✅ Complete (May 7, 2026)                    | Scheduled and manual paths produce persisted delivery outcomes with stable provider behavior | `artifacts/smoke/r1-reminder-reliability-20260506T234254Z.log` (12/12 pass, HTTP 200)                                    |
| Mobile runtime parity validation | In Progress — build PASS, acceptance pending | iOS release-like acceptance run confirms real backend traffic and stable core workflows      | `artifacts/smoke/r1-mobile-build-20260507T214730Z.log` (build PASS); runtime acceptance blocker: Developer Mode on HADES |
| Export parity signoff            | ✅ Automated Complete (May 7, 2026)          | Web/mobile exports match expected field set and ordering for shared fixtures                 | `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md` (CSV PASS, PDF structural PASS)                            |

R1 production-capable claim is blocked until Gate 2 runtime acceptance is closed. Gates 1 and 3 are complete.

---

## Platform Delivery Status

### Web

Status: Implemented, production-deployed, hardening in progress

Confirmed capabilities:

- Auth flows and protected routes
- Vehicle CRUD and maintenance CRUD
- Timeline dashboard and upcoming tasks
- Reminder lifecycle actions
- Calendar event creation flow
- CSV/PDF exports
- Service provider lookup UI

### Mobile (iOS/Android codebase)

Status: Real-service runtime implemented, production validation pending

Confirmed capabilities:

- Firebase initialized from `firebase_options.dart`
- Auth and Firestore services active
- Upcoming tasks and reminder actions
- Calendar preferences and event flow
- CSV/PDF export service
- Premium and ad components wired

Open production items:

- Release-mode acceptance evidence
- Notification delivery validation in production-like environment
- Monetization path QA (purchase verification and entitlement transitions)

### Backend (Firebase Functions)

Status: Broad capability coverage, environment hardening still required

Confirmed capabilities:

- Reminder scheduling + delivery endpoints
- Calendar callable endpoint
- Premium verification + entitlement endpoint
- Manuals/warranty/maintenance-plan endpoints
- Service provider lookup callable
- Optional integration cache and request guardrails

Open production items:

- Provider reliability evidence across environments
- End-to-end smoke coverage for key integration endpoints

---

## Known Documentation Corrections Applied

This update corrects prior drift where docs claimed:

- Mobile still relied on mock/stub runtime paths
- Mobile AdMob and premium flow were missing
- Route/status wording no longer matched implementation

Current docs now reflect code reality as of April 13, 2026.

---

## Governance Rules

When a feature status changes:

1. Update this file and docs/RELEASE_SCOPE_MATRIX.md in the same commit.
2. Update docs/NEXT_FEATURES_EXECUTION_PLAN.md if scope or ordering changes.
3. Include evidence references (tests, smoke outputs, or logs).
4. For R1 gate execution, keep docs/R1_COMPLETION_CHECKLIST.md current.
5. Keep docs/PROJECT_PLAN.md aligned with milestone timing and ownership changes.
