# Next Features Execution Plan

Last updated: May 28, 2026

This plan converts current status into concrete completion work.

Execution checklist:

- docs/R1_COMPLETION_CHECKLIST.md
- docs/PROJECT_PLAN.md
- Keep go-live sequencing aligned with the master subscription production matrix in `docs/PROJECT_PLAN.md`.

## Current Completion Snapshot

Progress evaluation (May 27, 2026 cycle):

- Web monetization unit coverage validated: 17 tests passed (feature flags, subscription, maintenance, edit vehicle).
- Mobile monetization unit/widget coverage validated: 10 tests passed and `flutter analyze` clean.
- Enterprise entitlement integration test path made deterministic for local/CI environments by skipping when Firestore integration runtime is not configured.
- Monetization UAT assertions were expanded; current deployment target still gates/skip-paths these UAT checks.

Completed in code:

- Reminder lifecycle CRUD across shared/web/mobile
- Scheduled reminder sweep functions and manual reminder send path
- Calendar creation path (callable-first with HTTP fallback on web)
- Web and mobile CSV/PDF exports
- Service provider callable and web UI integration
- Premium verification and entitlement callables with mobile premium service wiring
- Maintenance records now support self-service, mechanic, and business-maintained entries with receipt type metadata (`parts_only` / `parts_and_labor`) across shared/web/mobile/export paths
- Monetization tier model aligned to four subscription tiers (Free, Pro, Premium, Enterprise) across web feature flags, subscription UI, and backend entitlement resolution
- Mobile subscription screen now includes a four-tier subscription catalog, enterprise contact-sales path, and feature-comparison matrix for parity with web monetization messaging
- Automated monetization coverage now includes web unit tests, mobile unit/widget tests, and UAT assertions for Enterprise subscription visibility and comparison-table presence
- AR/AP foundation now includes shared invoice/payable draft contracts and backend callable scaffolds (`createInvoiceDraftCallable`, `createPayableDraftCallable`) with org-role and idempotency handling

Not yet complete for production claim:

- Mobile release-mode parity validation evidence (Gate 2 status: Build PASS; runtime acceptance BLOCKED pending iOS Developer Mode/trust and successful release-like runtime session with backend-traffic evidence)
- Calendar provider-account reliability signoff
- Stripe checkout and billing workflow production hardening (web + backend)
- RevenueCat mobile IAP integration and entitlement-transition validation
- Tier quota enforcement hardening for release-level confidence

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

### 7) Monetization and Entitlement Reliability

- Complete four-tier parity validation across web/mobile/backend.
- Add dedicated UAT and integration assertions for Enterprise plan visibility and entitlement resolution.
- Validate no downgraded UX for existing Free/Pro/Premium users after tier-model changes.

---

## R3 Should-Complete Work

### 8) Budget Forecasting Improvements

- Add trend and forecast calculations with usable date and vehicle filters.
- Define acceptance checks for forecast accuracy and clarity.

### 9) Business Operations Foundation

- Introduce account-management domain slice (org profiles, role boundaries, account ownership).
- Define AR/AP phase entry criteria and shared finance event model.
- Sequence first implementation slice for invoicing and receivable tracking.

---

## R4 Later Work

### 10) Service Provider Directory Expansion

- Build mobile parity experience.
- Add richer provider metadata and ranking quality controls.

### 11) Fleet Manager Workflows

- Implement fleet data model, role controls, and fleet reporting routes.

### 12) Premium and Ad Flow Hardening

- Validate real-store purchase verification end-to-end.
- Validate entitlement transitions and ad suppression for premium users.

### 13) Accounts Receivable and Accounts Payable

- Implement receivable workflows (invoice lifecycle, aging, status transitions).
- Implement payable workflows (vendor bills, due dates, payment reconciliation).
- Integrate accounting exports and role-based approval controls.

---

## Immediate Next Action Plan (As of May 27, 2026)

1. Close remaining R1 evidence collection and update `docs/R1_COMPLETION_CHECKLIST.md` with linked artifacts.
2. Finalize backend Enterprise entitlement integration reliability by running callable/integration tests against Firestore emulator or an enabled test project.
3. Connect AR/AP draft callable scaffolds to first web admin flow (create/list draft invoices and payables).
4. Add emulator-backed integration tests for AR/AP callable success paths and retention of audit events.

---

## Delivery Governance

- Status updates must synchronize docs/REQUIREMENTS.md and docs/RELEASE_SCOPE_MATRIX.md.
- Scope or order changes must update this file in the same commit.
- Every completed milestone item requires evidence references (test outputs or smoke logs).
- R1 gate execution must use and update docs/R1_COMPLETION_CHECKLIST.md.
