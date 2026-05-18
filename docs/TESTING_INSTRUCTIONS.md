# 🚀 IMMEDIATE TESTING INSTRUCTIONS

## Local Quick Validation (May 18, 2026 update)

Run these before triggering GitHub Actions to validate the latest navigation partitioning changes.

1. `cd packages/web`
2. `npm run test:unit -- tests/SiteHeader.test.jsx`
3. `npm run test:uat:chromium -- tests/uat.spec.ts`

Coverage objective for this update:

- Logged-out users see marketing header navigation only.
- Logged-in users see application header navigation only.
- Header auth control remains in fixed location and toggles by auth state.

## Step 1: Test Emulator Tests Workflow

1. Go to: https://github.com/mnelson3/vehicle-vitals/actions
2. Click 'Emulator Tests' workflow
3. Click 'Run workflow' → Select 'develop' branch → 'Run workflow'
4. Monitor the 'Run tests with Firestore emulator' step

## Step 2: Test iOS Distribution Workflow

1. Go to: https://github.com/mnelson3/vehicle-vitals/actions
2. Click 'iOS Distribution' workflow
3. Click 'Run workflow' → Select 'develop' branch → Choose build-only mode → 'Run workflow'
4. **CRITICAL**: Monitor build and signing steps for deterministic completion
5. Look for:
   - ✅ Fastlane lane starts successfully
   - ✅ Flutter iOS build completes
   - ✅ Artifact generation completes without interactive prompts

## Step 3: Verify Secrets are Set

Before running, ensure these GitHub secrets exist:

- APP_STORE_CONNECT_KEY (complete .p8 content)
- APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID
- FASTLANE_APPLE_ID, FASTLANE_TEAM_ID, etc.

## Expected Results:

- **Emulator Tests**: Should pass all test suites without Firebase CLI issues
- **iOS Distribution**: Should complete build-only workflow without interactive failures

## If Issues Persist:

Share the output from the Fastlane + Flutter build steps for debugging.

---

**Current Status**: All fixes committed and ready for testing! 🎯
