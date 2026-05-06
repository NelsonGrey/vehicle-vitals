# R1 Completion Checklist

Last updated: May 6, 2026
Status: In progress

Purpose: convert R1 production-readiness gates into execution-ready tasks with explicit evidence requirements.

## Progress Snapshot (May 6, 2026)

- Overall completion: 1/3 gates materially complete, 2/3 awaiting manual validation/signoff.
- Gate 1: Automated reliability checks are green (12/12 reminder tests), but authenticated deployed HTTP/manual-send validation is still open.
- Gate 1 blocker detail: anonymous token minting is disabled for this project (`ADMIN_ONLY_OPERATION`), so authenticated validation requires a real test user token.
- Gate 2: Build/runtime smoke is green (analyze + iOS release no-codesign), but hands-on acceptance execution and backend-traffic evidence are still open.
- Gate 3: Automated CSV + PDF structural parity is green; manual visual QA + signoff entry are still open.

### Immediate Next-Step Sequence

1. Gate 1 authenticated validation
   - `FUNCTIONS_BASE_URL="https://us-central1-<project>.cloudfunctions.net" ID_TOKEN="<firebase-id-token>" ./scripts/smoke-r1-reminder-reliability.sh`
   - Verify 200 response, provider delivery evidence, and function logs.
2. Gate 2 manual acceptance run
   - Run mobile app on simulator/device and execute 7-phase acceptance checklist.
   - Fill latest acceptance and backend traffic logs with observed evidence.
3. Gate 3 manual visual signoff
   - Compare latest generated PDFs side-by-side for readability/spacing/styling.
   - Complete signoff fields in latest parity report.

## How to Use This Checklist

- Assign an owner and target date for each gate before execution begins.
- Attach evidence artifacts under `artifacts/smoke/`.
- Mark each gate Done only when all acceptance checks pass.

## Gate 1: Reminder Delivery Reliability

Owner: Functions Lead (TBD)
Target date: May 9, 2026
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
- `artifacts/smoke/r1-reminder-reliability-20260506T153444Z.log` (12 reminder-focused integration tests passed, scheduled/manual test paths exercised)
- `artifacts/smoke/r1-reminder-reliability-20260506T175103Z.log` (12 reminder-focused integration tests passed; authenticated HTTP step still skipped due missing exported base URL + token in execution shell)
- `artifacts/smoke/r1-reminder-reliability-20260506T213128Z.log` (12 reminder-focused integration tests passed; authenticated HTTP step still pending due missing exported base URL + token in execution shell)
- `artifacts/smoke/r1-reminder-reliability-20260506T214821Z.log` (12 reminder-focused integration tests passed; authenticated HTTP step still skipped because project requires non-anonymous auth token)

### Validation Helpers Available

- `artifacts/smoke/r1-gate1-quick-reference-2026-05-06T15-51-58-772Z.md` - TL;DR setup guide with credentials gathering steps
- `artifacts/smoke/r1-gate1-reminder-manual-send-validation-2026-05-06T15-51-58-772Z.md` - Full validation template with curl examples and success criteria

### Remaining to Close Gate

- Gather `FUNCTIONS_BASE_URL` from Firebase Console (Project → Functions → Details)
- Generate or copy `ID_TOKEN` from Firebase Authentication (Console → Users → Custom Claims)
- Execute: `FUNCTIONS_BASE_URL="https://..." ID_TOKEN="eyJ..." ./scripts/smoke-r1-reminder-reliability.sh --authenticated`
- Note: anonymous token minting against Identity Toolkit currently returns `ADMIN_ONLY_OPERATION`; use a valid test-user token (email/password sign-in or custom token exchange).
- Verify email delivery to configured test recipient within 10 seconds
- Confirm function logs show successful execution

### Done Criteria

- Manual and scheduled paths both execute successfully.
- Authenticated HTTP requests pass (200 OK response).
- Email delivery confirmed to real provider (not just Firebase logs).
- Delivery records are persisted and visible in client status surfaces.
- No critical errors in functions logs for reminder flow.

---

## Gate 2: Mobile Runtime Parity Validation

Owner: Mobile Lead (TBD)
Target date: May 9, 2026
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
- `artifacts/smoke/r1-mobile-build-20260506T153459Z.log` (flutter analyze + ios release build passed)
- `artifacts/smoke/r1-mobile-build-20260506T180447Z.log` (flutter analyze + ios release build passed after CocoaPods dependency refresh)
- `artifacts/smoke/r1-mobile-build-20260506T213134Z.log` (flutter analyze + ios release build passed; no analyzer issues)
- `artifacts/smoke/r1-mobile-acceptance-20260413T194544Z.log` (acceptance checklist template scaffold generated)
- `artifacts/smoke/r1-mobile-acceptance-20260506T154131Z.log` (acceptance checklist template scaffold refreshed)
- `artifacts/smoke/r1-mobile-acceptance-20260506T213424Z.log` (acceptance checklist template scaffold refreshed)
- `artifacts/smoke/r1-mobile-backend-traffic-20260413T194544Z.log` (backend traffic log template scaffold generated)
- `artifacts/smoke/r1-mobile-backend-traffic-20260506T154131Z.log` (backend traffic log template scaffold refreshed)
- `artifacts/smoke/r1-mobile-backend-traffic-20260506T213424Z.log` (backend traffic log template scaffold refreshed)

### Acceptance Helper Generated

- `artifacts/smoke/r1-gate2-mobile-acceptance-checklist-2026-05-06T15-51-24-135Z.md` - Comprehensive 7-phase acceptance test (auth, vehicle CRUD, maintenance CRUD, reminders, exports, backend verification, performance)

### Remaining to Close Gate

1. Run the mobile app on iOS simulator or device (using latest build from `r1-mobile-build-20260506T213134Z.log`)
2. Follow the acceptance checklist phases in order:
   - Phase 1: Authentication & sign-in
   - Phase 2: Vehicle CRUD (create, edit, view)
   - Phase 3: Maintenance record CRUD (create, edit, delete)
   - Phase 4: Reminder configuration & delivery
   - Phase 5: Export (CSV, PDF)
   - Phase 6: Backend traffic verification (Firestore & Functions logs)
   - Phase 7: Network & performance validation
3. Capture evidence (screenshots, log excerpts, file contents)
4. Complete and sign the checklist at the end
5. Update `artifacts/smoke/r1-mobile-acceptance-<timestamp>.log` with results
6. Attach Firestore/Functions log excerpts to `artifacts/smoke/r1-mobile-backend-traffic-<timestamp>.log`

### Done Criteria

- Release-like build succeeds (✅ confirmed in r1-mobile-build-20260506T153459Z.log).
- All 6 CRUD operations (vehicle create/edit, maintenance create/edit/delete, list) complete without crashes.
- Reminder notification displays and is actionable.
- Export (CSV, PDF) generates successfully and is readable.
- Backend logs confirm real auth, Firestore writes, and Function calls for each operation.
- At least one full end-to-end flow (sign-in → vehicle → maintenance → export) verified with device/emulator screenshots.

---

## Gate 3: Export Parity Signoff (Web + Mobile)

Owner: Web + Mobile QA Lead (TBD)
Target date: May 13, 2026
Status: In progress

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

# Automated CSV parity
node scripts/validate-export-parity.mjs

# Automated PDF artifact generation + structural parity report
node scripts/validate-export-pdf-parity.mjs
```

### Automated CSV Parity Validation

CSV structure parity is now **automatically validated** by the `validate-export-parity.mjs` script. This validates:

- Header order and naming
- Row counts between web and mobile
- Data value sample spot-checking

Run: `node scripts/validate-export-parity.mjs`

### Automated PDF Parity Validation (Structural)

PDF artifact generation and structural parity are now automated by `validate-export-pdf-parity.mjs`. This generates:

- Web PDF export artifact
- Mobile PDF export artifact
- Parity report covering shared required fields and intentional differences

Run: `node scripts/validate-export-pdf-parity.mjs`

### Evidence to Capture

- `artifacts/smoke/r1-export-web-csv-<timestamp>.csv`
- `artifacts/smoke/r1-export-mobile-csv-<timestamp>.csv`
- `artifacts/smoke/r1-export-web-pdf-<timestamp>.pdf`
- `artifacts/smoke/r1-export-mobile-pdf-<timestamp>.pdf`
- `artifacts/smoke/r1-export-parity-report-<timestamp>.md`

### Evidence Captured So Far

- `artifacts/smoke/r1-export-web-csv-2026-05-06T15-50-51-423Z.csv` (web export from shared fixture - 3 maintenance entries)
- `artifacts/smoke/r1-export-mobile-csv-2026-05-06T15-50-51-423Z.csv` (mobile export from shared fixture - 3 maintenance entries)
- `artifacts/smoke/r1-export-parity-report-2026-05-06T15-50-51-423Z.md` (**✅ CSV PARITY PASSED**: Headers match, row counts match, sample data match)
- `artifacts/smoke/r1-export-web-pdf-2026-05-06T17-50-03-993Z.pdf` (web PDF artifact generated from shared fixture)
- `artifacts/smoke/r1-export-mobile-pdf-2026-05-06T17-50-03-993Z.pdf` (mobile PDF artifact generated from shared fixture)
- `artifacts/smoke/r1-export-parity-report-2026-05-06T17-50-03-993Z.md` (**✅ PDF STRUCTURAL PARITY PASSED**: shared fields present, known mileage-column difference documented)
- `artifacts/smoke/r1-export-web-csv-2026-05-06T21-34-24-232Z.csv` (web export from shared fixture refreshed)
- `artifacts/smoke/r1-export-mobile-csv-2026-05-06T21-34-24-232Z.csv` (mobile export from shared fixture refreshed)
- `artifacts/smoke/r1-export-parity-report-2026-05-06T21-34-24-232Z.md` (**✅ CSV PARITY PASSED**: headers, row counts, and sample data match)
- `artifacts/smoke/r1-export-web-pdf-2026-05-06T21-34-24-391Z.pdf` (web PDF artifact regenerated)
- `artifacts/smoke/r1-export-mobile-pdf-2026-05-06T21-34-24-391Z.pdf` (mobile PDF artifact regenerated)
- `artifacts/smoke/r1-export-parity-report-2026-05-06T21-34-24-391Z.md` (**✅ PDF STRUCTURAL PARITY PASSED**: required shared sections/fields validated)
- `artifacts/smoke/r1-export-parity-report-20260413T193203Z.md` (earlier template scaffold)
- `artifacts/smoke/r1-export-parity-report-20260506T154131Z.md` (earlier template scaffold)

### Remaining to Close Gate

1. ✅ **CSV parity automated validation** - PASSED (headers, row counts, data values all match)
2. ✅ **PDF artifact generation + structural parity automation** - PASSED (`validate-export-pdf-parity.mjs`)
3. Manual visual QA review: Compare rendering quality, spacing, and readability in both PDFs
4. Complete QA signoff in latest parity report (tester name, date, verdict, notes)

### Done Criteria

- ✅ CSV structure parity confirmed (automated validation passed)
- ✅ PDF structural parity confirmed for core sections and required fields (automated)
- [ ] PDF visual parity confirmed (manual QA review)
- [ ] Signoff note completed in parity report (tester name, date, verdict, notes)
- [ ] All evidence artifacts linked in this checklist

---

## Gate Status Dashboard

| Gate                             | Owner                      | Target Date  | Status      | Evidence Linked |
| -------------------------------- | -------------------------- | ------------ | ----------- | --------------- |
| Reminder delivery reliability    | Functions Lead (TBD)       | May 9, 2026  | In progress | Yes             |
| Mobile runtime parity validation | Mobile Lead (TBD)          | May 9, 2026  | In progress | Yes             |
| Export parity signoff            | Web + Mobile QA Lead (TBD) | May 13, 2026 | In progress | Yes             |

## Completion Rule

R1 is complete only when all three gates are marked Done with linked evidence artifacts.
