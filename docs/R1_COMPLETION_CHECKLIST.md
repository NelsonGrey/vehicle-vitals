# R1 Completion Checklist

Last updated: April 13, 2026
Status: In progress

Purpose: convert R1 production-readiness gates into execution-ready tasks with explicit evidence requirements.

## How to Use This Checklist

- Assign an owner and target date for each gate before execution begins.
- Attach evidence artifacts under `artifacts/smoke/`.
- Mark each gate Done only when all acceptance checks pass.

## Gate 1: Reminder Delivery Reliability

Owner: Functions Lead (TBD)
Target date: Apr 24, 2026
Status: In progress

### Preconditions

- Functions environment variables configured for reminder providers.
- Seed reminder fixtures available for deterministic execution.

### Execution Tasks

1. Run reminder integration tests (functions package) with reminder fixtures.
2. Trigger manual reminder send from web upcoming tasks flow.
3. Trigger scheduled sweep path and confirm reminder fan-out execution.
4. Verify persisted delivery outcomes (sent, failed, dismissed) in Firestore records.

### Suggested Commands

```bash
# From repository root
./scripts/smoke-r1-reminder-reliability.sh

# Optional manual-send HTTP validation (authenticated)
FUNCTIONS_BASE_URL="https://us-central1-<project>.cloudfunctions.net" \
ID_TOKEN="<firebase-id-token>" \
./scripts/smoke-r1-reminder-reliability.sh
```

### Evidence to Capture

- `artifacts/smoke/r1-reminder-reliability-<timestamp>.log`

### Evidence Captured So Far

- `artifacts/smoke/r1-reminder-reliability-20260413T193124Z.log` (12 reminder-focused integration tests passed)

### Done Criteria

- Manual and scheduled paths both execute successfully.
- Delivery records are persisted and visible in client status surfaces.
- No critical errors in functions logs for reminder flow.

---

## Gate 2: Mobile Runtime Parity Validation

Owner: Mobile Lead (TBD)
Target date: Apr 24, 2026
Status: In progress

### Preconditions

- iOS build environment is available and signing path is defined.
- Mobile app configured to target real Firebase backend.

### Execution Tasks

1. Build iOS in release-like mode.
2. Execute acceptance flow:
   - Auth sign-in or sign-up
   - Add vehicle
   - Maintenance CRUD
   - Reminder actions
   - Export flow
3. Confirm corresponding backend traffic in Firestore and Functions logs.

### Suggested Commands

```bash
# From repository root
./scripts/smoke-r1-mobile-runtime.sh

# Generate acceptance and backend-traffic evidence templates
./scripts/smoke-r1-mobile-acceptance-template.sh
```

### Evidence to Capture

- `artifacts/smoke/r1-mobile-build-<timestamp>.log`
- `artifacts/smoke/r1-mobile-acceptance-<timestamp>.log`
- `artifacts/smoke/r1-mobile-backend-traffic-<timestamp>.log`

### Evidence Captured So Far

- `artifacts/smoke/r1-mobile-build-20260413T193759Z.log` (flutter analyze + ios release build passed)
- `artifacts/smoke/r1-mobile-acceptance-20260413T194544Z.log` (acceptance checklist template scaffold generated)
- `artifacts/smoke/r1-mobile-backend-traffic-20260413T194544Z.log` (backend traffic log template scaffold generated)

### Done Criteria

- Release-like build succeeds.
- Acceptance flow completes without critical defects.
- Backend logs confirm real auth and data-path activity.

---

## Gate 3: Export Parity Signoff (Web + Mobile)

Owner: Web + Mobile QA Lead (TBD)
Target date: May 1, 2026
Status: Scheduled

### Preconditions

- Shared fixture dataset is defined and seeded consistently.
- Export paths are available on both web and mobile.

### Execution Tasks

1. Export CSV and PDF from web using shared fixture data.
2. Export CSV and PDF from mobile using same fixture data.
3. Compare outputs for field order, field coverage, and essential values.
4. Document any intentional differences and secure signoff.

### Suggested Commands

```bash
# From repository root
./scripts/smoke-r1-export-parity-template.sh
```

### Evidence to Capture

- `artifacts/smoke/r1-export-web-csv-<timestamp>.csv`
- `artifacts/smoke/r1-export-mobile-csv-<timestamp>.csv`
- `artifacts/smoke/r1-export-web-pdf-<timestamp>.pdf`
- `artifacts/smoke/r1-export-mobile-pdf-<timestamp>.pdf`
- `artifacts/smoke/r1-export-parity-report-<timestamp>.md`

### Evidence Captured So Far

- `artifacts/smoke/r1-export-parity-report-20260413T193203Z.md` (template scaffold generated)

### Done Criteria

- CSV parity confirmed against agreed schema and ordering.
- PDF parity confirmed for core sections and required fields.
- Signoff note added to release documentation.

---

## Gate Status Dashboard

| Gate                             | Owner                      | Target Date  | Status      | Evidence Linked |
| -------------------------------- | -------------------------- | ------------ | ----------- | --------------- |
| Reminder delivery reliability    | Functions Lead (TBD)       | Apr 24, 2026 | In progress | Yes             |
| Mobile runtime parity validation | Mobile Lead (TBD)          | Apr 24, 2026 | In progress | Yes             |
| Export parity signoff            | Web + Mobile QA Lead (TBD) | May 1, 2026  | Scheduled   | No              |

## Completion Rule

R1 is complete only when all three gates are marked Done with linked evidence artifacts.
