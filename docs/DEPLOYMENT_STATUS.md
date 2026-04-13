# Vehicle Vitals - Deployment Status

Last updated: April 13, 2026
Primary production project: `vehicle-vitals-prod`

## Web Deployment

Status: Live

- Platform: Firebase Hosting
- URL: https://vehicle-vitals-prod.web.app
- Core state: deployed and accessible
- Notes: production hardening and reminder/calendar/export reliability validation still in progress

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
- Remaining: release-confidence acceptance run, signing/distribution verification, production smoke evidence.

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

## Remaining Go-Live Gates

1. Close R1 reminder delivery reliability gate.
2. Complete iOS release-mode parity validation with evidence logs.
3. Complete web/mobile export parity signoff.

Production-ready completion is blocked until these gates are closed.

