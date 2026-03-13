# Vehicle Vitals - Release Scope Matrix

Last updated: March 13, 2026
Source baseline: docs/REQUIREMENTS.md

## Purpose

This matrix translates current requirements into release planning scope.

- Must: required to claim production-capable parity for active platforms.
- Should: important, high-value work that follows Must scope.
- Later: roadmap items not required for near-term parity claims.

## Scope Matrix

| Capability                                                           | Current Status            | Scope Tier | Target Milestone | Exit Criteria                                                                                                   |
| -------------------------------------------------------------------- | ------------------------- | ---------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Mobile runtime parity (real auth/data services)                      | 🔴 Not production-capable | Must       | R1               | Mobile uses Firebase-backed auth and Firestore in active build path; mock/stub mode removed from release config |
| Reminder lifecycle actions (add/snooze/dismiss/complete)             | 🔴 Not end-to-end         | Must       | R1               | Reminder CRUD fully wired in shared services and both clients with persisted state transitions                  |
| Reminder delivery reliability (scheduled + push/email feedback loop) | 🟡 Partial                | Must       | R1               | Scheduled checks, delivery, and user-visible outcomes validated by integration tests                            |
| Export parity (web + mobile)                                         | 🟡 Partial                | Must       | R1               | CSV/PDF export available in both web and iOS release path with basic QA signoff                                 |
| Timeline parity (mobile depth vs web timeline)                       | 🟡 Partial                | Should     | R2               | Mobile timeline supports chronological browsing with usable metadata parity                                     |
| iOS/web UX parity polish                                             | 🟡 Partial                | Should     | R2               | Core app surfaces use shared semantic design language and avoid legacy hardcoded styles                         |
| Calendar integration                                                 | ❌ Missing                | Should     | R2               | User can add reminders/tasks to device calendar from app actions                                                |
| Budget forecasting improvements                                      | 🟡 Partial                | Should     | R3               | Trend and forecast views available with meaningful filters and summaries                                        |
| Service provider directory                                           | ⏸ Planned                | Later      | R4               | Provider discovery and selection workflow implemented in active route map                                       |
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
