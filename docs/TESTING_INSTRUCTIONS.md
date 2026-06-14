# IMMEDIATE TESTING INSTRUCTIONS

## Local Quick Validation (June 11, 2026 update)

Run these after Firebase-backed garage improvements (pagination, cached images, error boundaries):

1. `cd packages/shared && npx vitest run tests/firestoreServiceFactory.pagination.test.ts`
2. `cd packages/web`
3. `npm run test -- tests/CachedImage.test.tsx tests/VehicleListItem.test.tsx tests/ErrorBoundary.test.tsx tests/Home.test.jsx`
4. `npm run test:uat:chromium -- tests/uat.spec.ts -g "TC-PAGINATION-001|TC-CACHE-001|TC-ERROR-001|TC-ERROR-002"`

Coverage objective for this update:

- Firestore pagination returns `{ data, lastDoc, hasMore }` when `pageSize` is provided and remains backward compatible without options.
- Garage page renders `VehicleListItem` thumbnails through `CachedImage` and can load additional vehicle pages.
- Web `ErrorBoundary` reports caught UI failures to Firebase Analytics.
- Mobile Crashlytics receives global widget/runtime errors through `ErrorWidget.builder`.

## Local Quick Validation (May 26, 2026 update)

Run these before triggering GitHub Actions to validate navigation, auth-aware header visibility, shell/ad layout behavior, and dedicated marketing preview routes.

1. `cd packages/web`
2. `npm run test -- tests/SiteHeader.test.jsx tests/Layout.test.jsx tests/Landing.media.test.jsx tests/StartSteps.test.jsx tests/EverydayScreens.test.jsx tests/ShortVideoTours.test.jsx tests/AddVehicle.test.jsx tests/EditVehicle.test.jsx`
3. `npm run test:uat:chromium -- tests/uat.spec.ts -g "TC-UI-004|TC-UI-005|TC-UI-006|TC-UI-007|TC-UI-008|TC-UI-010|TC-UI-011|TC-UI-012"`
4. `ls -lh public/videos/feature-demos/*.mp4`

Coverage objective for this update:

- Logged-out users see marketing demo links and no `Product Overview`, `Help & How-To`, or `Getting Started` links in the header.
- Logged-in users see `Getting Started` in the header while `Product Overview` and `Help & How-To` remain hidden.
- Header auth control remains in fixed location and toggles by auth state.
- Footer `Help` remains available as the primary always-on navigation entry for help content.
- Site shell is centered and width-limited to `1280px` (`max-w-7xl`).
- Ad rendering is isolated to standalone ad-break sections outside functional UI content flow.
- Landing page links users to dedicated preview routes (`/start-steps`, `/everyday-screens`, `/short-video-tours`) instead of rendering all media-heavy sections inline.
- Dedicated screenshot and video routes render real app capability media and preserve fallback behavior.
- Help and Getting Started routes preserve clear purpose boundaries, including explicit context labeling and walkthrough video/fallback states.

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

Current status: Ready for validation.

## OpenAI TTS Validation (June 14, 2026 update)

Run these after changes to the marketing demo narration pipeline:

1. `npm run test:scripts`
2. `OPENAI_API_KEY=... npm run openai:tts:validate`
3. `VV_TTS_PROVIDER=openai VV_INTERACTIVE_ONLY=vin-decode-demo npm run videos:generate:interactive`

Coverage objective for this update:

- Shared OpenAI TTS helper validates config, cache keys, and common error mapping.
- OpenAI speech generation succeeds without running the full demo batch.
- Interactive demo generation can reuse cached narration and still produce the expected MP4 artifact.
