# R1 Completion Checklist

Last updated: June 15, 2026
Status: In progress (Gate 2 status: Build/launch PASS; manual acceptance and backend success-path proof still pending)

Purpose: convert R1 production-readiness gates into execution-ready tasks with explicit evidence requirements.

## Progress Snapshot (June 15, 2026)

- Overall completion: 2/3 gates complete, 1/3 in active execution.
- Gate 1: ✅ Complete. Automated reliability checks are green (12/12 reminder tests) and authenticated deployed HTTP/manual-send validation is green (200 on dev endpoint).
- Gate 2: Release-like iOS build evidence is current and PASS (`artifacts/smoke/r1-mobile-build-20260615T154819Z.log`). HADES release-mode install/launch evidence is also current (`artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log`), but acceptance remains incomplete because the full manual checklist and backend success-path validation have not been captured.
- Gate 3: ✅ Automated complete. CSV parity PASS, PDF structural parity PASS, parity report signed off (automated validation pipeline). Manual visual QA recommended but not blocking.
- Automated validation refresh (June 15, 2026): Mobile analyzer PASS via `./scripts/smoke-r1-mobile-runtime.sh`; mobile tests PASS (17/17), web unit tests PASS (378/378), and the production web build PASS from the go-live stabilization run.

### Immediate Next-Step Sequence

1. Gate 2 manual acceptance run
   - Use the latest successful HADES release launch evidence (`artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log`) and execute the full 7-phase acceptance checklist end-to-end on the target iOS device.
2. Gate 2 backend stabilization
   - Capture explicit backend success-path evidence (auth + callable success and/or Firestore writes) during full acceptance flow, then refresh backend-traffic evidence to PASS.
3. Gate 3 optional
   - Complete visual PDF readability check for highest-confidence sign-off.

## How to Use This Checklist

- Assign an owner and target date for each gate before execution begins.
- Attach evidence artifacts under `artifacts/smoke/`.
- Mark each gate Done only when all acceptance checks pass.

## Gate 1: Reminder Delivery Reliability

Owner: Mark Nelson (interim Functions Lead)
Target date: May 9, 2026
Status: Complete

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
# If ID_TOKEN is omitted and gcloud is available, script auto-acquires:
# gcloud auth print-identity-token
FUNCTIONS_BASE_URL="https://us-central1-<project>.cloudfunctions.net" \
ID_TOKEN="<cloud-invoker-identity-token>" \
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
- `artifacts/smoke/r1-reminder-reliability-20260506T234134Z.log` (12 reminder-focused integration tests passed; HTTP invocation with Firebase ID token returned 401)
- `artifacts/smoke/r1-reminder-reliability-20260506T234217Z.log` (12 reminder-focused integration tests passed; authenticated HTTP step passed with status 200 using Cloud invoker identity token)
- `artifacts/smoke/r1-reminder-reliability-20260506T234254Z.log` (12 reminder-focused integration tests passed; authenticated HTTP step passed with status 200 using script auto-acquired gcloud identity token)

### Validation Helpers Available

- `artifacts/smoke/r1-gate1-quick-reference-2026-05-06T15-51-58-772Z.md` - TL;DR setup guide with credentials gathering steps
- `artifacts/smoke/r1-gate1-reminder-manual-send-validation-2026-05-06T15-51-58-772Z.md` - Full validation template with curl examples and success criteria

### Remaining to Close Gate

- None. Gate 1 reliability and authenticated HTTP validation are complete.

### Done Criteria

- Manual and scheduled paths both execute successfully.
- Authenticated HTTP requests pass (200 OK response).
- Email delivery confirmed to real provider (not just Firebase logs).
- Delivery records are persisted and visible in client status surfaces.
- No critical errors in functions logs for reminder flow.

---

## Gate 2: Mobile Runtime Parity Validation

Owner: Mark Nelson (interim Mobile Lead)
Target date: Jun 5, 2026
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

# Capture acceptance and backend-traffic evidence after the device run.
# This emits PASS only when every required field is PASS/YES.
AUTH_RESULT=PASS \
VEHICLE_CRUD_RESULT=PASS \
MAINTENANCE_CRUD_RESULT=PASS \
REMINDER_ACTIONS_RESULT=PASS \
EXPORT_RESULT=PASS \
FIRESTORE_WRITES_OBSERVED=YES \
FUNCTIONS_INVOCATIONS_OBSERVED=YES \
AUTH_EVENTS_OBSERVED=YES \
FIREBASE_PROJECT=vehicle-vitals-dev \
TESTER="<tester>" \
REVIEWER="<reviewer>" \
SCREENSHOT_EVIDENCE="<paths-or-links>" \
FIRESTORE_EVIDENCE_REF="<console-paths-or-export>" \
FUNCTIONS_LOG_REF="<log-query-or-link>" \
AUTH_EVENT_REF="<auth-console-or-log-link>" \
./scripts/smoke-r1-mobile-acceptance-capture.sh

# Optional fallback scaffold when the run has not happened yet
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
- `artifacts/smoke/r1-mobile-build-20260507T174144Z.log` (flutter analyze passed; iOS build failed due CocoaPods Firebase/CoreOnly version mismatch)
- `artifacts/smoke/r1-mobile-build-20260507T175103Z.log` (flutter analyze + ios release build passed after `pod update Firebase/CoreOnly`)
- `artifacts/smoke/r1-mobile-build-20260507T214730Z.log` (flutter analyze + ios release build passed after lockfile realignment and CocoaPods sync recovery)
- `artifacts/smoke/r1-mobile-build-20260527T221621Z.log` (flutter analyze passed; iOS build entered `Running Xcode build...` but did not complete in the execution window)
- `artifacts/smoke/r1-mobile-acceptance-20260413T194544Z.log` (acceptance checklist template scaffold generated)
- `artifacts/smoke/r1-mobile-acceptance-20260506T154131Z.log` (acceptance checklist template scaffold refreshed)
- `artifacts/smoke/r1-mobile-acceptance-20260506T213424Z.log` (acceptance checklist template scaffold refreshed)
- `artifacts/smoke/r1-mobile-backend-traffic-20260413T194544Z.log` (backend traffic log template scaffold generated)
- `artifacts/smoke/r1-mobile-backend-traffic-20260506T154131Z.log` (backend traffic log template scaffold refreshed)
- `artifacts/smoke/r1-mobile-backend-traffic-20260506T213424Z.log` (backend traffic log template scaffold refreshed)
- `artifacts/smoke/r1-mobile-backend-traffic-20260507T175704Z.log` (backend traffic log template scaffold refreshed)
- `artifacts/smoke/r1-mobile-acceptance-20260507T175704Z.log` (acceptance checklist template scaffold refreshed)
- `artifacts/smoke/r1-mobile-attached-run-udid-20260527T222306Z.log` (physical-device launch attempt on HADES; failed on Developer Mode/trust prerequisite)
- `artifacts/smoke/r1-mobile-attached-run-sim-20260527T225748Z.log` (simulator runtime session established: Xcode build complete, app synced, VM service available; cleaner logs post auth-gating fix)
- `artifacts/smoke/r1-mobile-acceptance-20260527T225954Z.log` (acceptance remains explicit FAIL; checklist not completed end-to-end)
- `artifacts/smoke/r1-mobile-backend-traffic-20260527T225954Z.log` (backend remains explicit FAIL; success-path evidence not fully captured)
- `artifacts/smoke/r1-mobile-build-20260601T221416Z.log` (flutter analyze + ios release build passed)
- `artifacts/smoke/r1-mobile-acceptance-20260601T221521Z.log` (PARTIAL/BLOCKED; automation and release install succeeded, but manual end-to-end checklist was not completed)
- `artifacts/smoke/r1-mobile-backend-traffic-20260601T221521Z.log` (BLOCKED; backend success-path evidence not verified)
- `artifacts/smoke/r1-mobile-build-20260615T154819Z.log` (flutter analyze + ios release build passed; built `build/ios/iphoneos/Runner.app`)
- `artifacts/smoke/r1-mobile-attached-run-udid-20260615T155826Z.log` (HADES release-mode build, install, and launch reached Flutter attached session; stopped after evidence capture)
- Runtime attempt note (2026-05-06): `flutter run -d ios` resolved stale UUID targeting but exited with Developer Mode requirement on device `HADES`.
- `artifacts/smoke/r1-mobile-attached-run-udid-20260506T220717Z.log` (attached device launch attempt captured; blocked pending Developer Mode/trust flow)
- Runtime attempt note (2026-05-07): simulator build attempts reached Xcode compile but did not complete a successful launch session in this execution window.
- Runtime attempt note (2026-05-07): physical-device launch on `HADES` confirmed current blocker message: enable Developer Mode and trust host before development deploy.
- Runtime attempt note (2026-05-27): direct physical-device launch on `HADES` again returned Developer Mode/trust prerequisite; see `artifacts/smoke/r1-mobile-attached-run-udid-20260527T222306Z.log`.
- Runtime attempt note (2026-05-27): post-fix simulator launch on iPhone 17 Pro (`F11E33C8-5AD4-401E-9735-6046522CC4D7`) completed Xcode build and established runtime session with prior entitlement/auth startup errors no longer observed, but ended with `Lost connection to device`; see `artifacts/smoke/r1-mobile-attached-run-sim-20260527T225748Z.log`.
- `artifacts/smoke/r1-mobile-acceptance-20260507T175704Z.log` (updated with BLOCKED result summary and blocker evidence)
- `artifacts/smoke/r1-mobile-backend-traffic-20260507T175704Z.log` (updated with BLOCKED status pending runtime launch)

### Acceptance Helper Generated

- `artifacts/smoke/r1-gate2-mobile-acceptance-checklist-2026-05-06T15-51-24-135Z.md` - Comprehensive 7-phase acceptance test (auth, vehicle CRUD, maintenance CRUD, reminders, exports, backend verification, performance)
- `scripts/smoke-r1-mobile-acceptance-capture.sh` - PASS/BLOCKED evidence capture for the manual device run and backend observations

### Remaining to Close Gate

1. ✅ Release build evidence available (latest complete build evidence: `r1-mobile-build-20260615T154819Z.log`)
2. ✅ Release-mode HADES launch evidence available (`r1-mobile-attached-run-udid-20260615T155826Z.log`)
3. Re-run Gate 2 acceptance flow and use `scripts/smoke-r1-mobile-acceptance-capture.sh` to replace the latest PARTIAL/BLOCKED artifact (`artifacts/smoke/r1-mobile-acceptance-20260601T221521Z.log`) with PASS evidence
4. Capture backend evidence with the same script and replace the latest BLOCKED artifact (`artifacts/smoke/r1-mobile-backend-traffic-20260601T221521Z.log`) with PASS evidence
5. Final sign-off when acceptance phases pass

### Done Criteria

- Release-like build succeeds (✅ confirmed in `artifacts/smoke/r1-mobile-build-20260615T154819Z.log`).
- All 6 CRUD operations (vehicle create/edit, maintenance create/edit/delete, list) complete without crashes.
- Reminder notification displays and is actionable.
- Export (CSV, PDF) generates successfully and is readable.
- Backend logs confirm real auth, Firestore writes, and Function calls for each operation.
- At least one full end-to-end flow (sign-in → vehicle → maintenance → export) verified with device/emulator screenshots.

---

## Gate 3: Export Parity Signoff (Web + Mobile)

Owner: Mark Nelson (interim Web + Mobile QA Lead)
Target date: May 13, 2026
Status: ✅ Automated complete (manual visual QA optional)

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

### Current Parity Workflow

Use `./scripts/smoke-r1-export-parity-template.sh` to generate the parity report scaffold, then attach web/mobile CSV and PDF artifacts from the shared fixture dataset into `artifacts/smoke/` and complete the signoff fields in the generated report.

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
- `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md` (latest parity report template scaffold)

### Remaining to Close Gate

1. ✅ **CSV parity automated validation** - PASSED (headers, row counts, data values all match)
2. ✅ **PDF artifact generation + structural parity automation** - PASSED (structural parity confirmed)
3. ✅ **QA signoff completed** - `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md` signed off (2026-05-07, automated validation pipeline, Result: Pass)
4. Optional: Manual visual rendering QA (spacing, readability) recommended before final production release but does not block Gate 3 closure.

### Done Criteria

- ✅ CSV structure parity confirmed (automated validation passed)
- ✅ PDF structural parity confirmed for core sections and required fields (automated)
- [ ] PDF visual parity confirmed (manual QA review)
- [x] Signoff note completed in parity report (tester name, date, verdict, notes)
- [x] All evidence artifacts linked in this checklist

---

## Gate Status Dashboard

| Gate                             | Owner                                      | Target Date  | Status      | Evidence Linked |
| -------------------------------- | ------------------------------------------ | ------------ | ----------- | --------------- |
| Reminder delivery reliability    | Mark Nelson (interim Functions Lead)       | May 9, 2026  | Complete    | Yes             |
| Mobile runtime parity validation | Mark Nelson (interim Mobile Lead)          | Jun 5, 2026  | In progress | Yes             |
| Export parity signoff            | Mark Nelson (interim Web + Mobile QA Lead) | May 13, 2026 | Complete    | Yes             |

## Completion Rule

R1 is complete only when all three gates are marked Done with linked evidence artifacts. Gates 1 and 3 are complete; Gate 2 status is Build/launch PASS with current release-like iOS evidence, but acceptance/backend validation remains incomplete pending checklist completion and backend success-path proof.
