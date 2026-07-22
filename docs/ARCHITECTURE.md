# Vehicle-Vitals Architecture

Last verified: July 20, 2026

Status: Canonical architecture reference. See `ARCHITECTURE_DIAGRAM.md` for
the compact visual and `README.md` for documentation precedence.

## System Overview

Vehicle-Vitals is a Firebase-backed vehicle ownership and maintenance product
with:

- a React 18/Vite web application containing public marketing and an
  authenticated app;
- a Flutter mobile application currently delivered for iOS;
- shared TypeScript/JavaScript domain calculations and Firestore helpers;
- Firestore, Storage, Authentication, Hosting, Messaging, and Cloud Functions;
- a private companion repository for server-side Functions business logic;
- a single GitHub Actions pipeline for tests, builds, and Firebase deployment.

The public repository is an npm workspace for JavaScript packages, plus a
separate Flutter package. It intentionally excludes Cloud Functions source from
version control in this public checkout.

## Repository Ownership Boundary

### Public repository: `NelsonGrey/vehicle-vitals`

Owns:

- `packages/web`: web UI, Firebase client integration, analytics/consent, UAT;
- `packages/mobile`: Flutter UI/services/platform projects/tests;
- `packages/shared`: shared domain calculations, types, and Firestore routing;
- `packages/firebase-utils`: Firebase utility abstraction;
- `firebase/firestore.rules` and `firebase/storage.rules`;
- `firestore.indexes.json` and environment-specific Firebase config;
- the master CI/CD workflow, release tooling, documentation, and evidence.

### Private companion: `NelsonGrey/vehicle-vitals-functions`

Owns Firebase Cloud Functions, provider adapters, scheduled work, privileged
organization/billing/compliance operations, and server-side tests. CI checks it
out at `packages/functions` using the branch that matches the target
environment. Local backend work uses the same gitignored mount point.

This preserves existing Firebase `source: packages/functions` configuration and
shared-package vendoring without exposing private server logic in the public
repository.

## Runtime Components

### Web application

Technology:

- React 18 and React Router 7;
- Vite 8;
- Tailwind CSS 4 and local CSS refinements;
- Firebase JavaScript SDK;
- Vitest/Testing Library for unit tests;
- Playwright for hosted/browser UAT.

Major route groups:

- public marketing, persona, pricing/subscription, Getting Started, Product
  Tour, Help, Support, legal, and authentication routes;
- protected `/app` routes for Garage, vehicle CRUD, Records, Timeline,
  Upcoming, Shops & Services, Subscription, profile/account/privacy, support,
  and admin/development surfaces;
- environment-controlled Coming Soon behavior.

`packages/web/src/App.tsx` is the route composition source. Customer-facing
capability wording should follow `LAUNCH_CLAIMS_MATRIX.md` and the canonical
labels established in the current navigation/components.

The web client performs ordinary user-authorized Firestore/Storage operations
and calls Functions for privileged, integration, entitlement, and billing
operations. UI feature flags are presentation controls, not authorization.

### Flutter mobile application

Technology:

- Flutter/Dart with `go_router` and Provider;
- Firebase Auth, Firestore, Functions, Storage, Messaging, and Crashlytics;
- Apple in-app purchase through `in_app_purchase`;
- local/offline support through mobile services;
- Flutter test and analyzer validation.

The app exposes authentication/onboarding, Garage, vehicle, maintenance,
Records, Timeline, Upcoming, account/privacy/support/preferences, service
provider, and subscription surfaces.

The codebase includes Android, desktop, and web platform scaffolding generated
by Flutter, but release scope is not equivalent to generated platform folders:
iOS is the current mobile product; Android is on hold. Automated iOS build and
TestFlight upload are temporarily disabled in the CI manifest.

### Shared domain package

`packages/shared` provides reusable pure/domain behavior and Firestore routing,
including:

- vehicle and maintenance defaults/types;
- VIN validation;
- maintenance schedules;
- vehicle health forecasts and portfolio calculations;
- ownership insights and document-analysis summaries;
- currency helpers;
- personal versus organization-scoped Firestore paths.

Shared calculations should remain deterministic and Firebase-independent where
practical. Backend code vendors built shared output so client and server can use
the same calculation contracts without importing public-repo source at runtime.

### Firebase utility package

`packages/firebase-utils` is a separate TypeScript package for reusable Firebase
client/admin helpers. It is not the primary domain model and should not absorb
product-specific business rules merely because they involve Firebase.

### Cloud Functions companion

The companion backend is responsible for operations that require secrets,
trusted identity, provider credentials, server-side authorization, scheduled
execution, or server-authoritative state. Examples include:

- VIN/data-provider integrations and caching;
- reminder/email/push execution;
- calendar/manual/warranty/maintenance-plan providers;
- Stripe checkout, webhook, portal, and reconciliation;
- Apple/Google purchase verification and entitlements;
- quotas and subscription state;
- organization membership/role management;
- compliance/export/deletion requests;
- audit, finance, retention, and idempotency operations;
- server-derived vehicle health/portfolio data.

Exact function names and secrets are owned by the current companion checkout.
Public documentation may describe contracts but must not assume a dated list is
complete.

## Data Architecture

### Personal garage

Primary vehicle data is stored below:

```text
users/{uid}/vehicles/{vin}
```

Vehicle child collections/documents include maintenance, reminders, files, and
preferences according to the current client/shared service contracts.

### Organization/shared garage

Shared household and light-fleet data uses organization scope:

```text
orgs/{orgId}
orgs/{orgId}/members/{uid}
orgs/{orgId}/vehicles/{vin}
users/{uid}/orgMemberships/{orgId}
```

Current path helpers resolve a primary organization context and choose personal
or org vehicle paths. Adding multiple simultaneous active organizations per
user requires reworking that resolution model; it is not a safe presentation-
only change.

### Server-authoritative state

Clients can read applicable subscription/quota state but cannot write it:

```text
users/{uid}/subscription/{document}
users/{uid}/quotas/{month}
```

Organization audit, compliance, finance invoice, and payable documents are also
server-managed. Firestore rules in `firebase/firestore.rules` are the executable
authorization source.

### Public collection inputs

Coming Soon signup/suggestion collections allow tightly schema-constrained
anonymous creates and deny public reads. This is a deliberate public trust
boundary, not a general anonymous-write policy.

## Authentication and Authorization

- Firebase Auth establishes user identity.
- Web auth state is exposed through `AuthContext`; components should not reach
  directly into `auth.currentUser` when a service/context abstraction exists.
- Firestore/Storage rules enforce client-access boundaries.
- Callable Functions revalidate authentication, authorization, role, input,
  request size, idempotency, and rate limits for privileged work.
- Organization roles include owner/admin/billing/support/read-only semantics;
  rule and callable role sets must stay aligned.
- Subscription and quota checks are enforced server-side for protected value,
  even if client flags also hide or explain unavailable UI.

## Monetization Architecture

The product models Free, Pro, Premium, and Enterprise tiers. Client feature
catalogs and marketing presentation live in the web/mobile code; effective
entitlements and billing state remain server-authoritative.

- Web paid checkout uses Stripe callable/backend flows.
- iOS paid purchases use Apple in-app purchase and backend verification.
- Enterprise is a sales/organization workflow rather than a self-serve client
  purchase.
- Ads are shown only when the effective entitlement permits them and the
  environment has a valid placement configuration.

Pricing/feature labels must stay synchronized across marketing data, web
feature flags, mobile feature flags/catalog, and backend entitlements. The
presence of UI controls is not proof of production payment readiness.

## Analytics, Advertising, and SEO

- Production web builds can receive GTM/GA4 and AdSense configuration.
- Consent state controls marketing/ad measurement behavior.
- Non-production Hosting sends noindex headers.
- Production uses canonical domain metadata, robots, sitemap, CSP, and other
  security headers from `firebase.prod.json` plus public assets.
- Marketing funnel events are emitted through the marketing analytics helper;
  dashboard/container-side configuration remains external evidence.

## Environment Model

| Environment | Branch | Firebase project | Purpose |
| --- | --- | --- | --- |
| Development | `develop` | `vehicle-vitals-dev` | Active integration |
| Staging | `staging` | `vehicle-vitals-staging` | Pre-production validation |
| Production | `main` | `vehicle-vitals-prod` | Live service |

Web builds use sanitized environment scripts to prevent inherited `VITE_*`
values from silently overriding the selected target. Mobile selects
environment-specific Firebase configuration. Functions CI selects the matching
private companion branch.

Secret values belong in GitHub/Firebase/App Store/provider secret systems, not
source files or documentation.

## CI/CD Architecture

The active workflow is `.github/workflows/master-pipeline.yml`.

Core gates:

1. Load target configuration and trigger context.
2. Run web unit tests.
3. Run mobile unit tests.
4. Run hosted Playwright UAT on Chromium, Firefox, and WebKit.
5. Evaluate the Quality Gate.
6. Build the environment-specific web artifact.
7. Optionally build/upload iOS when enabled.
8. Check out the private Functions repository.
9. Build shared packages, vendor shared output, and deploy Firebase.

Android and iOS enablement is controlled by `.cicd/projects/vehicle-vitals.yml`.
The pipeline file containing a job does not mean that target currently runs.

## Testing Architecture

- Web unit/integration: Vitest and Testing Library.
- Shared package: Vitest.
- Mobile: Flutter test and analyzer.
- Browser UAT: Playwright against hosted environment URLs in CI.
- Firebase behavior: emulator/rules tests.
- Backend: private companion build/lint/tests.
- Release evidence: smoke scripts and dated artifacts.

See `TESTING_INSTRUCTIONS.md` for commands. A skipped UAT test, successful build,
or rules-load check is narrower evidence than an end-to-end production flow.

## Deployment and Availability

Firebase Hosting serves development, staging, and production. Production is
available at `https://vehicle-vitals.com` and the Firebase hosting alias.

Normal deployment includes Firestore, Storage, Functions, and Hosting after the
quality gate. Exceptional reduced-target retries exist for specific Firebase
failures; they must be documented and must not be treated as proof that skipped
components are compatible.

See `DEPLOY.md`, `STAGING_TO_PRODUCTION_RUNBOOK.md`, and
`GO_LIVE_RUNBOOK.md` for operational procedures and current status.

## Known Architectural Boundaries and Debt

- The public/private repository split requires explicit branch compatibility
  and two-repository release coordination.
- Some older services remain user-scoped while org-aware routing is expanded;
  shared-garage changes require path-level tests.
- Household trip attribution is designed but not a current shipped subsystem.
- Web bundle size/dynamic-import warnings remain.
- Flutter-generated platform folders do not imply supported release platforms.
- Several planning and historical documents contain snapshots that must not
  override executable code or the current release runbook.

## Change Governance

Architecture-affecting changes should update, as applicable:

- this document and `ARCHITECTURE_DIAGRAM.md`;
- `API_DATA_MODELS.md` for contract changes;
- Firebase rules/indexes and their tests;
- public and companion repository branches/contracts;
- `REQUIREMENTS.md` for delivery status;
- `GO_LIVE_RUNBOOK.md` for release risk.
