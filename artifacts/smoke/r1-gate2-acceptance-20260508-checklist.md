# Gate 2: Mobile Runtime Acceptance Test Checklist
**Date:** May 8, 2026  
**Build ID:** r1-mobile-build-20260507T214730Z (rebuilt fresh on 2026-05-08)  
**Simulator:** iPhone 16e (UDID: AA12D964-3359-43A2-8A24-B1C7A70685DC)  
**Xcode Build Time:** 577.7s  
**Firebase Project:** vehicle-vitals-prod  

## Test Phases

### Phase 1: App Launch & Firebase Initialization ✅
- [x] Build completes without errors
- [x] App launches on simulator
- [x] Firebase initializes successfully
- [x] Log output: "Firebase initialized: project=vehicle-vitals-prod, appId=1:489413148337:ios:b55d0b37718e299368ac90"
- [x] DevTools available at http://127.0.0.1:62792/

### Phase 2: Authentication
- [ ] Test sign-up flow (email/password)
- [ ] Test sign-in flow
- [ ] Verify Auth state persists in Firestore
- [ ] Check /users/{userId}/ document created

### Phase 3: Vehicle Management (CRUD)
- [ ] Add vehicle (manual VIN entry)
- [ ] Verify vehicle saved to /users/{userId}/vehicles/{vehicleId}
- [ ] Edit vehicle (update mileage/license plate)
- [ ] View vehicle details
- [ ] List all vehicles
- [ ] Delete vehicle (verify Firestore cleanup)

### Phase 4: Maintenance Records
- [ ] Add maintenance record to vehicle
- [ ] Attach document/image to record
- [ ] Verify stored in /users/{userId}/vehicles/{vehicleId}/maintenance/
- [ ] Edit maintenance record
- [ ] Delete maintenance record

### Phase 5: Reminders
- [ ] Create maintenance reminder
- [ ] Verify reminder in /users/{userId}/reminders/
- [ ] Complete reminder (mark as done)
- [ ] Snooze reminder
- [ ] Dismiss and reopen reminder

### Phase 6: Export Functionality
- [ ] Export vehicle data to CSV
- [ ] Export vehicle data to PDF
- [ ] Verify exports contain all fields
- [ ] Verify no data corruption in exports

### Phase 7: Backend Traffic Validation
- [ ] Monitor Firestore writes
- [ ] Verify Cloud Functions invoked
- [ ] Check error logs for exceptions
- [ ] Verify analytics events recorded
- [ ] Confirm no auth/permission errors

## Test Results

| Phase | Status | Notes | Timestamp |
|-------|--------|-------|-----------|
| 1 | ✅ PASS | App launched, Firebase initialized | 2026-05-08 11:20:56 |
| 2 | ⏳ PENDING | - | - |
| 3 | ⏳ PENDING | - | - |
| 4 | ⏳ PENDING | - | - |
| 5 | ⏳ PENDING | - | - |
| 6 | ⏳ PENDING | - | - |
| 7 | ⏳ PENDING | - | - |

## Overall Status
**PENDING** - Phase 1 verified, Phases 2-7 require manual interaction on simulator

## Instructions for Manual Testing
1. Open iPhone 16e simulator app
2. Follow Phase 2-7 test cases above
3. For each phase, verify Firestore writes in Firebase Console
4. Document any failures or unexpected behaviors
5. Once all phases complete, update status to PASS/FAIL
