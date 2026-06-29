# Vehicle Vitals - Deployment Status

Last updated: May 29, 2026 (cross-platform identity recovery and account consolidation)
Primary production project: `vehicle-vitals-prod`

## Development Progress Update (May 29, 2026 - Cross-Platform Identity Recovery)

Status: cross-platform identity hardening is now paired with a user-facing web recovery flow for existing split accounts.

Progress evaluation completed:

- Backend callable `consolidateAccountDataCallable` now supports retry-safe batch migration of vehicles, subscription tier state, and premium entitlements from a secondary UID into the signed-in primary UID.
- Web auth now exposes `consolidateAccountData` through `AuthContext`, keeping the recovery path inside existing authenticated Profile flows.
- Profile now includes an `Account Consolidation` section with source-UID entry, destructive-action confirmation, and success reporting for migrated and skipped vehicles.
- Mobile account screens now expose sync-identity diagnostics so users can verify environment, Firebase project, and auth UID before attempting recovery.

Automation updates delivered:

- Focused web unit coverage updated in `packages/web/tests/Profile.push.test.jsx` to validate:
  - self-consolidation is blocked client-side
  - successful consolidation renders migration results
- Web UAT updated in `packages/web/tests/uat.spec.ts` to validate the Profile recovery surface and the safe self-consolidation validation path.
- End-user documentation updated in `docs/USER_FAQ_WEBSITE_IOS.md` with split-account troubleshooting and website consolidation instructions.

Validation snapshot:

- Functions compile: PASS via `npm --prefix packages/functions run build`
- Web production build: PASS via `npm --prefix packages/web run build`
- Focused web unit tests: PASS (`7/7`) via `npm --prefix packages/web run test -- tests/Profile.push.test.jsx`
- Full web unit suite: PASS (`358/358`) via `npm --prefix packages/web run test:unit`
- Flutter analyzer: PASS via `flutter analyze` in `packages/mobile`
- Full Chromium UAT: PASS/SKIP-GATED (`8 passed`, `20 skipped`) via `npm --prefix packages/web run test:uat:chromium`; auth-dependent cases, including the Profile recovery checks, were skipped because auth UI is unavailable in the current deployment target

## Development Progress Update (May 27, 2026 - Billing Recovery and Checkout UX)

Status: Stripe subscription settlement now has clearer post-checkout and recovery handling in the web app.

Progress evaluation completed:

- Subscription checkout now returns users to `/app/subscription` with explicit `checkout=success` and `checkout=cancelled` banners.
- Past-due subscription states now surface Stripe-specific recovery text and a dedicated support panel with links to `/contact` and support email.
- Stripe webhook handling continues to record payment-failure, dispute, and refund outcomes into subscription state for downstream UI recovery.

Automation updates delivered:

- Unit tests updated in `packages/web/src/shared/__tests__/subscriptionService.test.ts` and `packages/web/tests/SubscriptionPage.test.jsx`.
- UAT coverage updated in `packages/web/tests/uat.spec.ts` to validate checkout feedback banners on the subscription page.

Validation snapshot:

- Focused web test slice: PASS (`12/12`) via `npm --prefix packages/web run test -- tests/SubscriptionPage.test.jsx src/shared/__tests__/subscriptionService.test.ts`.

## Beta Readiness

The current beta-test access matrix is documented in [docs/BETA_ACCESS_MATRIX.md](docs/BETA_ACCESS_MATRIX.md). It defines the required Free, Pro, Premium, Enterprise, and Super-Admin identities plus the capability proofs each one must satisfy before beta handoff.

## Development Progress Update (May 26, 2026 - Marketing Link Cleanup)

Status: Public marketing pages now stay on public routes and no longer funnel users into login-only app screens.

Progress evaluation completed:

- `Start in 3 simple steps` now points its reminders CTA to the public help anchor instead of the cross-platform demo.
- `Everyday screens you will use` now routes each card to a public demo or help destination instead of `/app/*`.
- `Help Center` reminder guidance uses a public anchor and no longer shows the support skip link.
- Redundant bottom back-home/product-overview links were removed from the public marketing pages.

Automation updates delivered:

- Unit tests updated in `packages/web/tests/StartSteps.test.jsx`, `packages/web/tests/EverydayScreens.test.jsx`, `packages/web/tests/ShortVideoTours.test.jsx`, and `packages/web/tests/Help.test.jsx`.
- UAT coverage updated in `packages/web/tests/uat.spec.ts` to assert the public marketing hrefs and help anchor behavior.

Validation snapshot:

- Web unit suite: PASS (`334/334`) via `npm run test` in `packages/web`.

## Development Progress Update (May 26, 2026 - Header Visibility Rules)

Status: Header navigation now enforces role/state-specific visibility exactly as requested.

Progress evaluation completed:

- Logged-in header now hides `Product Overview`.
- Header `Help & How-To` link removed; footer `Help` remains the primary help entry point.
- `Getting Started` now renders only for authenticated users.
- Logged-out marketing nav remains focused on feature demos (`VIN Decode`, `Maintenance`, `Cross Platform`, `Ownership History`) plus auth action.

Automation updates delivered:

- Unit coverage updated in `packages/web/tests/SiteHeader.test.jsx` to assert:
  - Logged-out state: no `Product Overview`, no `Help & How-To`, no `Getting Started`.
  - Logged-in state: `Getting Started` is visible while `Product Overview` and `Help & How-To` are absent.
- UAT coverage updated in `packages/web/tests/uat.spec.ts` (`TC-UI-004`, `TC-UI-005`, `TC-UI-010`, `TC-UI-011`) to validate the same auth-aware visibility rules.

Validation snapshot:

- Web unit suite: PASS (`333/333`) via `npm run test` in `packages/web`.

## Development Progress Update (May 26, 2026 - Context Separation and Reliability)

Status: Marketing, Help, and App workspace boundaries are now explicit in both page content and global navigation.

Progress evaluation completed:

- Added persistent route-aware context messaging in the shared app shell (`Product Overview`, `Help & How-To`, `Application Workspace`).
- Added explicit context panel on landing so first-time users understand they are in product-overview mode.
- Reinforced Help route labeling and retained a clear `Product overview vs. Help` separation section.
- Promoted cross-context navigation in header for both logged-out and logged-in users:
  - `Product Overview`
  - `Help & How-To`
  - Existing functional app links remain intact.

Automation updates delivered:

- Unit tests updated for context-aware UX and navigation behavior:
  - `packages/web/tests/Layout.test.jsx`
  - `packages/web/tests/Landing.media.test.jsx`
  - `packages/web/tests/SiteHeader.test.jsx`
- Unit test reliability hardening:
  - `packages/web/tests/AddVehicle.test.jsx` now mocks `findVehiclePhotoFromWeb` for deterministic save-path assertions.
  - `packages/web/tests/EditVehicle.test.jsx` now mocks `findVehiclePhotoFromWeb` for deterministic save-path assertions.
- UAT coverage updated in `packages/web/tests/uat.spec.ts`:
  - Marketing/authenticated header expectations aligned to `Product Overview` first-link model.
  - Explicit checks added for `Help & How-To` visibility in both nav states.
  - Help context label assertions added.
  - Duplicate UI test case ID corrected (`TC-UI-012`).

Validation snapshot:

- Web unit suite: PASS (`322/322`) via `npm --prefix packages/web run test`.
- Focused context/navigation suites: PASS.
- UAT spec updated and ready for hosted Chromium validation in CI.

## Development Progress Update (May 22, 2026 - Navigation & Terminology Alignment)

Status: User-facing terminology and top-level navigation are aligned across web and mobile.

Progress evaluation completed:

- User-facing web/mobile copy now consistently uses `Mechanics` in nearby shop discovery flows.
- Header navigation now surfaces `Getting Started` as the first nav item for both:
  - logged-out marketing navigation
  - logged-in application navigation
- Marketing header no longer includes a separate `Home` link; the Vehicle Vitals logo remains the home path.
- Footer navigation no longer duplicates `Getting Started`.

Automation updates delivered:

- Web unit tests updated to validate:
  - marketing header omits `Home`
  - `Getting Started` is first in both marketing and authenticated header nav sequences
- New footer unit coverage validates `Getting Started` is no longer present in footer links.
- Web UAT expanded with navigation checks for both marketing and authenticated header sequences.

Validation snapshot:

- Web unit suite: PASS (`316/316`)
- Web UAT (Chromium): PASS with environment-gated skips (`8` passed, `17` skipped)
- Flutter analyzer: PASS (`No issues found`)

## Development Progress Update (May 22, 2026)

Status: Garage lifecycle and ownership transfer capability implemented across backend, web, and mobile.

Progress evaluation completed:

- Vehicle lifecycle state added as `vehicleStatus` (`active` or `stored`) across shared/web/mobile data models.
- Garage UI now separates active vehicles and storage vehicles on both web and mobile.
- Vehicle edit flows now support status changes (`In Garage` / `In Storage`) on web and mobile.
- New secure callable `transferVehicleCallable` implemented in functions:
  - Transfers vehicle doc ownership between users by recipient email/uid.
  - Copies and moves subcollections: `maintenance`, `reminders`, `attachmentAnalyses`.
  - Prevents self-transfer and duplicate VIN transfer collisions.
  - Preserves idempotency behavior and writes transfer audit events.

Automation updates delivered:

- Functions integration testing now includes transfer callable coverage for document/subcollection migration behavior.
- Web unit testing expanded to validate:
  - Edit flow status persistence (`vehicleStatus`).
  - Transfer flow validation and successful transfer action handling.
  - Garage active/storage section rendering and status summary.
- Web UAT updated:
  - Shell width assertion aligned to 1280px baseline.
  - Add Vehicle acceptance now validates location status options.
- Mobile unit testing expanded with model-level coverage for `vehicleStatus` defaults and serialization/copy behavior.

Validation snapshot:

- Functions build: PASS (`npm --workspace=packages/functions run build`)
- Functions integration tests (focused transfer + adjacent callables): PASS
- Web unit suite: PASS (`311/311`)
- Flutter analyzer: PASS (`No issues found`)

## Development Progress Update (May 20, 2026)

Status: Quality automation strengthened; baseline local verification passed.

Progress evaluation completed today:

- Web unit tests: PASS (`311/311`) via `npm run test:unit` in `packages/web`.
- Mobile unit tests: PASS via `flutter test` in `packages/mobile`.
- Web UAT (chromium): PASS (`8` passed, `14` skipped) against `https://vehicle-vitals-dev.web.app`.

Automation updates delivered:

- Added root test automation scripts:
  - `npm run test:unit:all` -> runs web + mobile unit suites.
  - `npm run test:uat:all` -> runs chromium UAT against env-selected hosted URL.
- Added script implementations:
  - `scripts/run-unit-tests.sh`
  - `scripts/run-uat-tests.sh`
- CI workflow hardening (`.github/workflows/master-pipeline.yml`):
  - Added explicit `mobile-unit-tests` job.
  - Added explicit `quality-gate` job requiring successful web unit, mobile unit, and web UAT matrix completion.
  - Wired `build-web` to require `quality-gate` success for `build_all` and `build_and_deploy` triggers.
  - Expanded pipeline summary output to include gate-level status lines.

Operational impact:

- Build/deploy paths now have deterministic quality checks for both platforms and browser UAT before web build proceeds in build flows.
- Local reproducibility improved with single-command automation entry points for ongoing release confidence checks.

## Development Progress Update (May 19, 2026)

Status: In active iteration; interactive marketing demo generation is now implemented and all demo assets have been regenerated as real UI interaction recordings with synchronized narration output.

- Added explicit `Getting Started` workflow and dedicated `Help` section in web routes and content pages.
- Partitioned header navigation by authentication state:
  - Logged out: marketing nav only.
  - Logged in: application nav only.
- Kept auth action in a fixed header slot while toggling state (`Login / Sign Up` vs `Sign Out`).
- Restricted `Data Seed` header navigation visibility to demonstration environment only.
- Standardized centered shell width to `1024px` across header/main/footer/auth/landing containers.
- Converted ads to standalone ad-break sections and removed embedded in-flow ad placements from feature pages.
- Added/updated automation coverage for header behavior and shell/ad-break architecture in unit and UAT suites.
- Implemented robust marketing-side visual system with real application screenshots across major app capabilities (web + mobile) and dedicated video showcase lanes.
- Added runtime-safe video handling in marketing pages: if a demo clip is missing or fails, UI automatically falls back to poster preview without page break.
- Centralized marketing video rendering in reusable component `packages/web/src/components/MarketingVideoPanel.tsx`.
- Generated and committed placeholder MP4 clips for all referenced marketing demo lanes in `packages/web/public/videos/feature-demos/`.
- Added dedicated help/getting-started video surfaces in `packages/web/src/pages/Help.tsx` and `packages/web/src/pages/Instructions.tsx`.
- Expanded automation for media release quality gates:
  - Unit: CTA fallback rendering behavior in `packages/web/tests/MarketingVideoPanel.test.jsx`.
  - UAT: Help + getting-started video section coverage (`TC-UI-008`) in `packages/web/tests/uat.spec.ts`.
- Added reusable interaction-based generation pipeline:
  - `scripts/generate-interactive-feature-demos.js` for all demo/help clips.
  - `scripts/generate-interactive-vin-demo.js` for VIN-focused targeted generation.
  - Root scripts: `videos:generate:interactive` and `videos:generate:interactive:vin` in `package.json`.
- Regenerated all 10 marketing demo/help clips in `packages/web/public/videos/feature-demos/` as interaction recordings with narration audio streams.
- Added unit coverage for landing media surface integrity and expected MP4 source wiring (`packages/web/tests/Landing.media.test.jsx`).
- Added UAT coverage for hosted MP4 asset availability/content type validation (`TC-UI-009`) in `packages/web/tests/uat.spec.ts`.

Immediate next implementation focus:

1. Validate develop and demonstration CI workflow outcomes on pushed branches.
2. Resolve any failing checks before merge/review handoff.
3. Enable neural narration in production generation runs via `VV_TTS_PROVIDER=openai` and `OPENAI_API_KEY`, then regenerate clips for final non-robotic voice quality.
4. Add per-clip transcript/caption assets and include transcript quality checks in release review.

## Web Deployment

Status: Live

- Platform: Firebase Hosting
- URL: https://vehicle-vitals-prod.web.app
- Core state: deployed and accessible
- Notes: production web is constrained to marketing routes only; app/auth routes are redirected in production mode.

## Environment Security Posture

Status: Hardened in application layer

- Development: password-gated via environment access password.
- Demonstration: password-gated via environment access password.
- Staging: password-gated via environment access password.
- Production: marketing-only routing enabled (no user app/auth surface exposed).

Reference: `docs/SECURE_ENVIRONMENTS.md`.

## Firebase Services

Status: Active

- Firestore rules: deployed
- Authentication: configured
- Hosting: active
- Functions: active with reminder, calendar, premium, and integration endpoints

## Mobile Deployment Readiness

### iOS

Status: Buildable, release validation pending

- Release-like build path exists.
- Runtime uses real Firebase initialization/options in `packages/mobile/lib/main.dart`.
- Remaining: release-confidence acceptance run, signing/distribution verification, backend-traffic evidence capture.

### Android

Status: Build path exists, production validation pending

- Codebase includes active Android target/package.
- Remaining: release testing and deployment workflow validation.

## Revenue and Monetization Status

### Web (AdSense)

Status: Implemented

- Ad banner and placement configuration are wired via env-driven components.
- Remaining: production monetization QA and placement optimization validation.

### Mobile (AdMob and Premium)

Status: Implemented in code, production validation pending

- Ad components (banner/interstitial/rewarded helpers) are present.
- Premium purchase and backend entitlement verification flows are wired.
- Remaining: real-store purchase verification, entitlement transition QA, release monetization signoff.

## DataConnect and Integrations

Status: Configured with partial product integration

- DataConnect artifacts and generated clients exist.
- Manuals/warranty/maintenance-plan provider endpoints exist behind integration settings.
- Remaining: client UX surfacing and full contract validation in production-like environments.

## R1 Gate Execution Status

As of May 27, 2026 (updated with latest available gate evidence):

- Gate 1 (Reminder delivery reliability): ✅ COMPLETE (automated checks pass and authenticated manual-send validation returns HTTP 200 on dev endpoint).
- Gate 2 (Mobile runtime parity): Gate 2 status is Build PASS; runtime acceptance BLOCKED pending iOS Developer Mode/trust and successful release-like runtime session with backend-traffic evidence. Latest build evidence: `artifacts/smoke/r1-mobile-build-20260507T214730Z.log`. Blocker-marked evidence captured in `artifacts/smoke/r1-mobile-acceptance-20260507T175704Z.log` and `artifacts/smoke/r1-mobile-backend-traffic-20260507T175704Z.log`.
- Gate 3 (Export parity): ✅ AUTOMATED COMPLETE — CSV parity PASS, PDF structural parity PASS, signoff recorded in `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md`. Manual visual rendering QA is optional/recommended.

Primary evidence index: `docs/R1_COMPLETION_CHECKLIST.md`.

## Remaining Go-Live Gates

1. Resolve iOS device Developer Mode/trust prerequisite and complete Gate 2 runtime acceptance with backend-traffic evidence logs.
2. (Optional) Gate 3 manual visual PDF rendering review.

Production-ready completion is blocked until Gate 2 acceptance is closed.
