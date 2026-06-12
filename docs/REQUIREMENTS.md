# Vehicle Vitals - Project Requirements and Delivery Status

Project overview: Vehicle Vitals is a cross-platform vehicle ownership application (web + mobile) with Firebase-backed auth, data, reminders, exports, calendar utilities, provider lookup, and premium/ad monetization primitives.

Last updated: June 11, 2026
Project status: CORE IMPLEMENTED, R1 GATE 2 CLOSURE IN PROGRESS

---

## Firebase Garage Improvements (Delivered June 11, 2026)

Completed this cycle:

- Firestore cursor pagination for vehicles and maintenance in shared/web/mobile services
- Composite indexes defined in `firestore.indexes.json` and documented in `docs/FIREBASE_INDEXES.md`
- Web garage refactor to `VehicleListItem` + `CachedImage` with load-more pagination
- Firebase Analytics error reporting from web `ErrorBoundary`
- Firebase Crashlytics global error handling on mobile (`ErrorWidget.builder` + platform handlers)

Validation evidence:

- Shared: `packages/shared/tests/firestoreServiceFactory.pagination.test.ts`
- Web unit: `CachedImage`, `VehicleListItem`, `ErrorBoundary`, `Home` tests
- Web UAT: `TC-PAGINATION-001`, `TC-CACHE-001`, `TC-ERROR-001`, `TC-ERROR-002` in `packages/web/tests/uat.spec.ts`

---

## Enterprise Foundation Update (Delivered May 14, 2026; validated in current baseline)

Completed this cycle:

- Organization bootstrap + personal-org model for all users
- Organization membership roles and role update callable controls
- Server-authoritative effective entitlement resolution integrated into web monetization hooks
- Super-admin support console controls for org retention policy and member role management
- Idempotency + audit logging across privileged enterprise callables
- Compliance request intake callables for export/deletion lifecycle
- Backfill migration executed in development (`138` users, `414` documents written, no remaining drift)

Validation evidence:

- Functions integration tests: enterprise callables now covered and passing
- Web tests: full suite passing after enterprise UI/service updates

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

## Feature Traceability Baseline (Current baseline; originally established April 2026)

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

## Feature Tier Implementation Status

**Monetization Model**: Four-tier freemium with feature gating and advertising (see [`docs/MONETIZATION_STRATEGY.md`](MONETIZATION_STRATEGY.md))

### Free Tier Feature Implementation

| Feature                       | Status         | Notes                                                                              |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| 2-vehicle limit               | 🟡 Partial     | Limit defined in web/mobile feature flags; backend quota enforcement still pending |
| Basic mileage-based reminders | 🟢 Implemented | Reminder lifecycle and delivery reliability are now covered                        |
| CSV export only               | 🟢 Implemented | CSV export is working; PDF/Excel remain gated for higher tiers                     |
| 10 receipt uploads/month      | ⏸ Planned     | Quota tracking and enforcement in Cloud Functions needed                           |
| Ad placements (3-5/page)      | ⏸ Planned     | Ad network integration (Google AdSense, Criteo) required                           |
| Community support only        | 🟢 Implemented | Support portal and forums infrastructure ready                                     |

### Pro Tier Feature Implementation ($2.99/month)

| Feature                           | Status         | Notes                                                                              |
| --------------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| 10-vehicle limit                  | 🟡 Partial     | Limit defined in web/mobile feature flags; quota enforcement still needs hardening |
| Advanced time + mileage reminders | 🟡 Partial     | Mileage-based working; time-based interval logic still needs full rollout          |
| PDF + CSV + Excel export          | 🟢 Implemented | Multi-format export support is now wired through web/mobile flows                  |
| 100 receipt uploads/month         | ⏸ Planned     | Quota tracking across tiers required                                               |
| Calendar sync (Google/Outlook)    | 🟡 Partial     | Calendar callable/provider flow exists; provider-account validation still needed   |
| AI attachment analysis (5/month)  | 🟡 Partial     | Analysis callables exist; quota and provider verification still need tightening    |
| 12-month maintenance planning     | 🟡 Partial     | Forecasting surfaces exist; delivery parity and signoff remain                     |
| 1-2 ads/page (reduced)            | ⏸ Planned     | Ad placement reduction logic + rendering conditional                               |
| Priority email support (24-48h)   | 🟡 Partial     | Support portal and workflow exist; SLA automation still pending                    |

### Premium Tier Feature Implementation ($6.99/month)

| Feature                                | Status         | Notes                                                                     |
| -------------------------------------- | -------------- | ------------------------------------------------------------------------- |
| 25-vehicle limit                       | 🟡 Partial     | Premium limit is defined; backend quota enforcement still needs hardening |
| Advanced + AI predictions              | ⏸ Planned     | Predictive ML model + integration needed                                  |
| Unlimited receipt uploads              | 🟢 Implemented | No limits for Premium tier                                                |
| PDF + CSV + Excel + cloud sync         | 🟡 Partial     | Export support exists; cloud sync parity remains                          |
| No ads (ad-free)                       | 🟡 Partial     | Ad-free rendering is defined but release QA remains                       |
| All calendar providers                 | 🟡 Partial     | Calendar sync exists; broader provider support remains                    |
| Unlimited AI analysis                  | 🟡 Partial     | Premium quota behavior still needs release signoff                        |
| 36-month maintenance planning          | 🟡 Partial     | Extended forecasting UI/logic still needs completion                      |
| Multi-vehicle dashboard (customizable) | 🟡 Partial     | Dashboard support exists; customizable thresholds remain                  |
| API/integrations (Zapier, IFTTT)       | 🟡 Partial     | Web/backend integration surfaces exist; release validation remains        |
| Priority phone support (4-8h)          | ⏸ Planned     | Phone support staffing and infrastructure                                 |

### Billing & Subscription System Status

| Component                          | Status     | Notes                                                                                               |
| ---------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| Stripe integration                 | 🟡 Partial | Checkout session creation and webhook reconciliation are implemented; production validation remains |
| RevenueCat (mobile)                | ⏸ Planned | Mobile IAP abstraction layer not yet integrated                                                     |
| Subscription state in Firestore    | 🟡 Partial | User document schema now carries subscription state; additional hardening remains                   |
| Tier enforcement (web)             | 🟡 Partial | Web feature flags and tier gates are present; parity hardening remains                              |
| Tier enforcement (mobile)          | 🟡 Partial | Mobile feature gate logic exists; plan parity still needs completion                                |
| Free trial (7-day Pro)             | ⏸ Planned | Trial claim + expiration tracking needed                                                            |
| Grace period after failed payment  | 🟡 Partial | Payment failure states and recovery UX exist; continuation logic still needs hardening              |
| Churn prevention (email reminders) | ⏸ Planned | Automated renewal reminder emails (14 days, 1 day before expiry)                                    |
| Win-back campaigns (lapsed users)  | ⏸ Planned | Segment lapsed Premium users; offer re-engagement discounts                                         |

Legend: 🟢 Implemented, 🟡 Partial, ⏸ Planned

**Next Steps for Monetization Launch** (Phase 2 - Month 4+):

1. Complete Stripe production validation (live checkout, webhook monitoring, and failed-payment recovery)
2. Integrate RevenueCat mobile IAP flow and reconcile subscriptions with backend entitlement state
3. Harden tier quota enforcement (vehicle limits, upload quotas, and API usage) in backend and rules
4. Validate tier transitions and grace-period behavior end-to-end across web, mobile, and backend
5. Integrate ad networks for Free/Pro delivery and verify Premium ad suppression in release builds
6. Finalize churn prevention automation (renewal reminders and lapsed-user recovery campaigns)
7. Publish production evidence package for monetization reliability and entitlement correctness

---

## R1 Gate Traceability Baseline (Current baseline; originally established April 2026)

R1 is the minimum release confidence gate.

| Gate                             | Current State                                        | Exit Criteria                                                                                | Evidence Required                                                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reminder delivery reliability    | ✅ Complete (May 7, 2026)                            | Scheduled and manual paths produce persisted delivery outcomes with stable provider behavior | `artifacts/smoke/r1-reminder-reliability-20260506T234254Z.log` (12/12 pass, HTTP 200)                                                                                                                      |
| Mobile runtime parity validation | In Progress — Build PASS; runtime acceptance BLOCKED | iOS release-like acceptance run confirms real backend traffic and stable core workflows      | `artifacts/smoke/r1-mobile-build-20260507T214730Z.log` (build PASS); runtime acceptance BLOCKED pending iOS Developer Mode/trust and successful release-like runtime session with backend-traffic evidence |
| Export parity signoff            | ✅ Automated Complete (May 7, 2026)                  | Web/mobile exports match expected field set and ordering for shared fixtures                 | `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md` (CSV PASS, PDF structural PASS)                                                                                                              |

R1 production-capable claim is blocked until Gate 2 runtime acceptance is closed. Gate 2 status is Build PASS; runtime acceptance BLOCKED pending iOS Developer Mode/trust and successful release-like runtime session with backend-traffic evidence. Gates 1 and 3 are complete.

## Subscription Tier Parity Matrix

| Plan       | Web status                                                          | Mobile status                          | Parity verdict | Notes                                                                                            |
| ---------- | ------------------------------------------------------------------- | -------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| Free       | Core baseline available                                             | Core baseline available                | Mostly aligned | Core workflows exist on both clients, but mobile release validation is still pending.            |
| Pro        | Full contract defined in web feature flags                          | Partial subset in mobile feature flags | Not identical  | iOS exposes a narrower Pro surface than the web matrix.                                          |
| Premium    | Full contract defined in web feature flags                          | Partial subset in mobile feature flags | Not identical  | Web includes cloud sync, predictive maintenance, and automation that mobile does not yet mirror. |
| Enterprise | Org, entitlement, and support workflows defined in web/backend docs | Sales/contact handoff only             | Not identical  | Enterprise capability is primarily web/backend-led today.                                        |

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

Current docs now reflect code reality as of May 27, 2026, with historical evidence links retained for auditability.

---

## Governance Rules

When a feature status changes:

1. Update this file and docs/RELEASE_SCOPE_MATRIX.md in the same commit.
2. Update docs/NEXT_FEATURES_EXECUTION_PLAN.md if scope or ordering changes.
3. Include evidence references (tests, smoke outputs, or logs).
4. For R1 gate execution, keep docs/R1_COMPLETION_CHECKLIST.md current.
5. Keep docs/PROJECT_PLAN.md aligned with milestone timing and ownership changes.
