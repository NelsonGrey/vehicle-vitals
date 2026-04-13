# Next Features Execution Plan

Last updated: April 13, 2026

This plan converts current status into concrete completion work.

Execution checklist:

- docs/R1_COMPLETION_CHECKLIST.md
- docs/PROJECT_PLAN.md

## Current Completion Snapshot

Completed in code:

- Reminder lifecycle CRUD across shared/web/mobile
- Scheduled reminder sweep functions and manual reminder send path
- Calendar creation path (callable-first with HTTP fallback on web)
- Web and mobile CSV/PDF exports
- Service provider callable and web UI integration
- Premium verification and entitlement callables with mobile premium service wiring

Not yet complete for production claim:

- End-to-end reminder delivery reliability evidence
- Mobile release-mode parity validation evidence
- Cross-platform export parity signoff
- Calendar provider-account reliability signoff

---

## R1 Must-Complete Work (Production-Capable Parity)

### 1) Reminder Delivery Reliability

Objective:

- Ensure scheduled and manual reminder paths are reliable and observable.

Tasks:

- Validate scheduled sweep execution with seeded reminder fixtures.
- Validate provider behavior (email and push) in production-like environment.
- Confirm delivery outcomes are persisted and shown in client status surfaces.

Exit criteria:

- Integration tests for reminder sweep and delivery pass.
- Manual send and scheduled send both produce persisted sent/failed outcomes.
- Evidence captured in `artifacts/smoke/` with timestamped logs.

### 2) Mobile Runtime Parity Validation

Objective:

- Prove release-like iOS runtime stability against real backend services.

Tasks:

- Build and run iOS in release-like mode.
- Execute acceptance flow: auth, vehicle CRUD, maintenance CRUD, reminders, export.
- Confirm backend traffic in Firestore/Functions logs.

Exit criteria:

- Acceptance checklist passes on release-like build.
- No mock-only behavior found in core runtime paths.
- Evidence artifacts stored under `artifacts/smoke/`.

### 3) Export Parity Signoff (Web + Mobile)

Objective:

- Close parity gap between web and mobile export outputs.

Tasks:

- Run shared fixture dataset across both platforms.
- Compare CSV field ordering and data integrity.
- Compare PDF section structure and essential fields.

Exit criteria:

- Cross-platform parity checklist approved.
- Any intentional differences documented and accepted.

---

## R2 Should-Complete Work

### 4) Calendar Integration Completion

- Validate google/apple/ics targets with real provider accounts.
- Improve post-action UX for success/failure and fallback guidance.
- Add regression coverage for action-entry paths.

### 5) Timeline and UX Parity

- Increase mobile timeline metadata depth and filtering parity.
- Align urgency chips/icon semantics and spacing rhythm with web.

### 6) API Enrichment Completion

- Stabilize manuals/warranty/maintenance-plan contracts.
- Surface source/confidence/expiry data in client UX.

---

## R3 Should-Complete Work

### 7) Budget Forecasting Improvements

- Add trend and forecast calculations with usable date and vehicle filters.
- Define acceptance checks for forecast accuracy and clarity.

---

## R4 Later Work

### 8) Service Provider Directory Expansion

- Build mobile parity experience.
- Add richer provider metadata and ranking quality controls.

### 9) Fleet Manager Workflows

- Implement fleet data model, role controls, and fleet reporting routes.

### 10) Premium and Ad Flow Hardening

- Validate real-store purchase verification end-to-end.
- Validate entitlement transitions and ad suppression for premium users.

---

## Delivery Governance

- Status updates must synchronize docs/REQUIREMENTS.md and docs/RELEASE_SCOPE_MATRIX.md.
- Scope or order changes must update this file in the same commit.
- Every completed milestone item requires evidence references (test outputs or smoke logs).
- R1 gate execution must use and update docs/R1_COMPLETION_CHECKLIST.md.
