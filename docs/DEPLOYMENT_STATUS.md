# Vehicle Vitals - Deployment Status

Last updated: May 7, 2026
Primary production project: `vehicle-vitals-prod`

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
- Gate 2 (Mobile runtime parity): build/analyze PASS (`artifacts/smoke/r1-mobile-build-20260507T175103Z.log`); acceptance currently BLOCKED on runtime launch prerequisites (physical device requires Developer Mode/trust; simulator launch not yet completed in current execution window). Blocker-marked evidence captured in `artifacts/smoke/r1-mobile-acceptance-20260507T175704Z.log` and `artifacts/smoke/r1-mobile-backend-traffic-20260507T175704Z.log`.
- Gate 3 (Export parity): ✅ AUTOMATED COMPLETE — CSV parity PASS, PDF structural parity PASS, signoff recorded in `artifacts/smoke/r1-export-parity-report-20260507T174923Z.md`. Manual visual rendering QA is optional/recommended.

Primary evidence index: `docs/R1_COMPLETION_CHECKLIST.md`.

## Remaining Go-Live Gates

1. Resolve iOS device Developer Mode/trust prerequisite and complete Gate 2 runtime acceptance with backend-traffic evidence logs.
2. (Optional) Gate 3 manual visual PDF rendering review.

Production-ready completion is blocked until Gate 2 acceptance is closed.
