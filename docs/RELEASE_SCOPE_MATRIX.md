# Vehicle Vitals - Release Scope Matrix

Last updated: June 15, 2026
Source baseline: docs/REQUIREMENTS.md

## Purpose

This matrix translates requirements into milestone scope and release gating.

- Must: required for production-capable parity claim
- Should: high-value completion work after Must scope
- Later: expansion roadmap items

## Scope Matrix

| Capability                                                      | Current Status  | Scope Tier | Target Milestone | Exit Criteria                                                                                          |
| --------------------------------------------------------------- | --------------- | ---------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| Mobile runtime parity (real auth/data services)                 | Partial         | Must       | R1               | Release-mode iOS validation confirms auth, Firestore CRUD, reminders, and exports against real backend |
| Reminder lifecycle actions (add/snooze/dismiss/complete/reopen) | Implemented     | Must       | R1               | Lifecycle actions remain stable with regression tests and no data-loss regressions                     |
| Reminder delivery reliability (scheduled plus push/email loop)  | Complete        | Must       | R1               | Scheduled and manual delivery paths both produce persisted outcomes with stable provider behavior      |
| Export parity (web plus mobile)                                 | Complete        | Must       | R1               | Shared fixture exports pass field-order/value parity checks and QA signoff                             |
| Calendar integration reliability (google/apple/ics)             | Partial         | Should     | R2               | End-to-end event creation is reliable with explicit success/failure UX on web and mobile               |
| Timeline parity (mobile depth vs web)                           | Partial         | Should     | R2               | Mobile timeline metadata, filtering, and chronology reach parity-level usability                       |
| iOS/web UX parity polish                                        | Partial         | Should     | R2               | Shared semantic patterns used across core workflow surfaces                                            |
| API enrichment (manuals, warranty, maintenance plan)            | Partial         | Should     | R2/R3            | Stable endpoint contracts and client surfaces with fallback messaging                                  |
| Budget forecasting improvements                                 | Partial         | Should     | R3               | Trend and forecast views with meaningful filters and summaries                                         |
| Service provider directory expansion                            | Partial         | Later      | R4               | Mobile parity plus richer provider data and quality controls                                           |
| Premium and ad monetization hardening                           | Partial         | Later      | R4               | Verified purchase/entitlement flow and validated ad behavior in release builds                         |
| Fleet manager workflows                                         | Not Implemented | Later      | R4               | Fleet routes, role controls, and fleet-level reporting delivered                                       |

## Milestone Definitions

- R1: Production-capable parity foundation and confidence gates
- R2: Core workflow completeness and UX parity
- R3: Insights and operational depth
- R4: Expansion roadmap

## Current Execution Order

1. ✅ Reminder delivery reliability (Must — Gate 1 complete, May 7, 2026)
2. Mobile runtime parity validation (Must — Build PASS with latest release-like iOS build; acceptance/backend evidence BLOCKED pending end-to-end checklist and backend-traffic proof)
3. ✅ Export parity signoff (Must — Gate 3 automated complete, May 7, 2026)
4. Calendar reliability and UX completion
5. Timeline and UX parity completion
6. API enrichment and forecasting depth

## Subscription Go-Live Alignment

- The master subscription production matrix lives in `docs/PROJECT_PLAN.md` and is the roll-up view for subscription business readiness, technical readiness, and release governance.
- Current subscription go-live status remains Yellow across business, technical, and governance readiness.
- Immediate subscription blockers remain Gate 2 closure, Stripe production validation, RevenueCat mobile purchase integration, and backend quota enforcement.

## Governance

- Keep this file synchronized with docs/REQUIREMENTS.md in the same commit.
- Any scope-tier changes require updating docs/NEXT_FEATURES_EXECUTION_PLAN.md.
