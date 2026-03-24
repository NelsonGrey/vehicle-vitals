# Next Features Execution Plan

Last updated: March 24, 2026

This plan turns current release recommendations into executable feature work with exit criteria.

## Priority Order

1. Reminder delivery reliability (R1 Must)
2. Mobile runtime parity validation (R1 Must)
3. Export parity completion (R1 Must)
4. Calendar integration completion (R2 Should)
5. Timeline depth and UX parity (R2 Should)
6. API enrichment completion (R2/R3)

## 1) Reminder Delivery Reliability

Goal: ensure reminders are consistently generated, delivered, and reflected in client state.

Scope:
- Validate scheduled sweep execution and reminder fan-out behavior.
- Validate send provider integration (email and push) with real environment toggles.
- Ensure web and mobile surfaces show delivery outcomes and retry-safe status.

Exit criteria:
- Scheduled reminder flow passes integration tests.
- Manual send path and scheduled path produce persisted delivery records.
- User-visible status shown for sent/failed/dismissed outcomes.

Validation:
- Functions integration test run with reminder fixtures.
- Web + mobile smoke verification against seeded reminder data.

## 2) Mobile Runtime Parity Validation

Goal: verify iOS release path uses real backend services for core workflows.

Scope:
- Auth sign-in/sign-out/session restore.
- Vehicle CRUD and maintenance CRUD against Firestore.
- Attachment upload/processing/retry behavior.
- Push token registration and reminder notification receive path.

Exit criteria:
- Core workflows validated on release-like build (not debug-only assumptions).
- No mock-only service path active in release config.
- Critical regression checklist passes on iOS test cohort.

Validation:
- Flutter analyze.
- iOS device/simulator acceptance run.
- Firestore/function logs confirm real backend traffic for tested flows.

## 3) Export Parity Completion (Web + iOS)

Goal: close remaining parity gaps for CSV/PDF exports.

Scope:
- Match export fields and ordering between web and mobile outputs.
- Handle edge cases: empty records, large datasets, missing optional fields.
- Confirm share/download UX with consistent user messaging.

Exit criteria:
- Cross-platform export output parity accepted for a shared test dataset.
- QA signoff for both clients using common acceptance checklist.

Validation:
- Snapshot-style comparison for known fixture outputs.
- Manual QA pass with seeded multi-vehicle and maintenance-history accounts.

## 4) Calendar Integration Completion

Goal: make calendar creation a first-class, reliable user workflow.

Scope:
- Trigger calendar actions directly from reminder/task surfaces.
- Improve post-action UX: success states, failures, fallback guidance.
- Validate target handling for google/apple/ics.

Exit criteria:
- Reminder/task to calendar flow works end-to-end for supported targets.
- Error handling is explicit and user-actionable.

Validation:
- Existing callable-first + HTTP fallback path tests remain green.
- Additional client tests for action-entry paths and failure UX.

## 5) Timeline and UX Parity

Goal: align mobile timeline depth and visual semantics with web.

Scope:
- Expand chronological depth and metadata on mobile timeline views.
- Align urgency chips, iconography semantics, and spacing rhythm.

Exit criteria:
- Mobile timeline supports parity-level browsing and context.
- Shared visual semantics applied across top workflow surfaces.

## 6) API Enrichment Completion

Goal: complete manuals/warranty/maintenance-plan provider-backed features.

Scope:
- Normalize endpoint contracts and provider fallbacks.
- Persist source/confidence/expiry metadata for client trust.

Exit criteria:
- Stable contracts for manuals, warranty summary, and maintenance plan.
- Client integration points implemented with user-facing states.

## Suggested Sprint Breakdown

Sprint A (R1):
- Reminder delivery reliability
- Mobile runtime parity validation

Sprint B (R1/R2):
- Export parity completion
- Calendar integration completion

Sprint C (R2/R3):
- Timeline depth and UX parity
- API enrichment completion

## Tracking and Governance

- Keep capability statuses synchronized between REQUIREMENTS and RELEASE_SCOPE_MATRIX in the same commit.
- Any scope-tier changes require updates to both documents plus this execution plan.
- Use seeded demo/test data to keep acceptance runs repeatable.
