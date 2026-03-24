# Vehicle Vitals - Release Scope Matrix

Last updated: March 24, 2026
Source baseline: docs/REQUIREMENTS.md

## Purpose

This matrix translates current requirements into release planning scope.

- Must: required to claim production-capable parity for active platforms.
- Should: important, high-value work that follows Must scope.
- Later: roadmap items not required for near-term parity claims.

## Scope Matrix

| Capability                                                           | Current Status            | Scope Tier | Target Milestone | Exit Criteria                                                                                                   |
| -------------------------------------------------------------------- | ------------------------- | ---------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Mobile runtime parity (real auth/data services)                      | 🟡 Partial                | Must       | R1               | Real Firebase-backed auth and Firestore path validated in release build with push delivery verification         |
| Reminder lifecycle actions (add/snooze/dismiss/complete)             | 🟢 Implemented            | Must       | R1               | Reminder CRUD fully wired in shared services and both clients with persisted state transitions                  |
| Reminder delivery reliability (scheduled + push/email feedback loop) | 🟡 Partial                | Must       | R1               | Scheduled checks, delivery, and user-visible outcomes validated by integration tests                            |
| Export parity (web + mobile)                                         | 🟡 Partial                | Must       | R1               | CSV/PDF export available in both web and iOS release path with basic QA signoff                                 |
| Timeline parity (mobile depth vs web timeline)                       | 🟡 Partial                | Should     | R2               | Mobile timeline supports chronological browsing with usable metadata parity                                     |
| iOS/web UX parity polish                                             | 🟡 Partial                | Should     | R2               | Core app surfaces use shared semantic design language and avoid legacy hardcoded styles                         |
| Calendar integration                                                 | 🟡 Partial                | Should     | R2               | User can add reminders/tasks to device calendar from app actions with reliable success/failure UX              |
| Budget forecasting improvements                                      | 🟡 Partial                | Should     | R3               | Trend and forecast views available with meaningful filters and summaries                                        |
| Service provider directory                                           | 🟡 Partial                | Later      | R4               | Web workflow stable and mobile parity/richer provider data implemented                                          |
| Fleet manager workflows                                              | ⏸ Planned                | Later      | R4               | Fleet views, role-oriented controls, and fleet-level reporting available                                        |
| AdMob and rewarded premium flows                                     | ❌ Missing                | Later      | R4               | Mobile ad and premium gating strategy implemented and validated                                                 |

## Milestone Definitions

- R1: Production-capable parity foundation.
- R2: Core workflow completeness and UX parity.
- R3: Insights and operational depth.
- R4: Expansion roadmap features.

## Governance Rules

- Delivery status authority remains docs/REQUIREMENTS.md.
- Product intent and roadmap authority remains docs/PRODUCT_DESIGN.md.
- If a capability moves scope tier, update this file and requirements status in the same commit.

## Current Execution Order

1. Reminder delivery reliability (scheduled + push/email feedback loop).
2. Mobile runtime parity release validation and production hardening.
3. Export parity QA signoff across web and iOS.
4. Calendar integration UX completion from reminder/task actions.
