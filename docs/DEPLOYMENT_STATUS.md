# Vehicle Vitals - Deployment Status

Last updated: May 19, 2026 (interactive demo pipeline update)
Primary production project: `vehicle-vitals-prod`

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

As of May 7, 2026 (updated):

- Gate 1 (Reminder delivery reliability): ✅ COMPLETE (automated checks pass and authenticated manual-send validation returns HTTP 200 on dev endpoint).
- Gate 2 (Mobile runtime parity): build/analyze PASS on latest smoke run (`artifacts/smoke/r1-mobile-build-20260507T214730Z.log`); acceptance currently BLOCKED on runtime launch prerequisites (physical device requires Developer Mode/trust; simulator launch not yet completed in current execution window). Blocker-marked evidence captured in `artifacts/smoke/r1-mobile-acceptance-20260507T175704Z.log` and `artifacts/smoke/r1-mobile-backend-traffic-20260507T175704Z.log`.
- Gate 3 (Export parity): ✅ AUTOMATED COMPLETE — CSV parity PASS, PDF structural parity PASS, signoff recorded in `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md`. Manual visual rendering QA is optional/recommended.

Primary evidence index: `docs/R1_COMPLETION_CHECKLIST.md`.

## Remaining Go-Live Gates

1. Resolve iOS device Developer Mode/trust prerequisite and complete Gate 2 runtime acceptance with backend-traffic evidence logs.
2. (Optional) Gate 3 manual visual PDF rendering review.

Production-ready completion is blocked until Gate 2 acceptance is closed.
