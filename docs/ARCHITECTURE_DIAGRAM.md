# Vehicle-Vitals Architecture Diagram

Last verified: July 20, 2026

This is the compact visual companion to `docs/ARCHITECTURE.md`. The
documentation catalog and source precedence rules are in `docs/README.md`.

## System Context

```text
                 Public repository                         Private repository
       ┌──────────────────────────────────┐       ┌───────────────────────────┐
       │ React 18 / Vite web client       │       │ Firebase Cloud Functions  │
       │ packages/web                     │       │ vehicle-vitals-functions  │
       ├──────────────────────────────────┤       │ mounted at                │
       │ Flutter iOS client               │       │ packages/functions in CI  │
       │ packages/mobile                  │       └─────────────┬─────────────┘
       ├──────────────────────────────────┤                     │
       │ Shared calculations/data helpers │                     │ Admin SDK /
       │ packages/shared                  │                     │ callable APIs
       ├──────────────────────────────────┤                     │
       │ Firebase client/admin helpers    │                     │
       │ packages/firebase-utils          │                     │
       └───────────────┬──────────────────┘                     │
                       │ Firebase client SDKs                    │
                       └────────────────────┬────────────────────┘
                                            ▼
                         ┌────────────────────────────────────┐
                         │ Firebase projects                 │
                         │ Auth · Firestore · Storage        │
                         │ Functions · Hosting · Messaging   │
                         └────────────────┬───────────────────┘
                                          │
                                          ▼
                         ┌────────────────────────────────────┐
                         │ External services                 │
                         │ NHTSA · Stripe · Apple/Google IAP │
                         │ SMTP · calendar/manual/warranty   │
                         │ analytics and advertising         │
                         └────────────────────────────────────┘
```

The public repository contains Firebase rules, indexes, hosting configuration,
the deployment workflow, and client/shared code. Business-sensitive server
code is intentionally isolated in the private companion repository.

## Repository Layout

```text
vehicle-vitals/
├── .cicd/projects/vehicle-vitals.yml       # Deployment target enablement
├── .github/
│   ├── workflows/master-pipeline.yml       # Active CI/CD workflow
│   ├── actions/                            # Reusable setup actions
│   ├── dependabot.yml
│   └── SECURITY.md
├── packages/
│   ├── web/                                # React/Vite web app and UAT
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── shared/
│   │   │   ├── utils/
│   │   │   └── App.tsx
│   │   ├── public/
│   │   └── tests/
│   ├── mobile/                             # Flutter app (iOS current; Android on hold)
│   │   ├── lib/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── main.dart
│   │   ├── test/
│   │   ├── ios/
│   │   ├── android/
│   │   └── config/
│   ├── shared/                             # Pure/shared domain and Firestore helpers
│   └── firebase-utils/                     # Firebase utility package
├── packages/functions/                     # Gitignored companion mount; not tracked here
├── firebase/
│   ├── firestore.rules
│   └── storage.rules
├── firestore.indexes.json
├── firebase.json                           # Default Firebase config
├── firebase.dev.json
├── firebase.staging.json
├── firebase.prod.json
├── scripts/                                # Build, release, smoke, and media helpers
├── tools/                                  # Setup/diagnostic helpers
├── monitoring/                             # Optional runner monitor
├── docs/                                   # Current, planning, historical, and generated docs
└── artifacts/                              # Dated release/smoke evidence
```

## Client Architecture

### Web

```text
Browser
  │
  ├─ public marketing/persona/getting-started/product-tour routes
  ├─ auth routes
  └─ protected /app routes
       │
       ├─ AuthContext and route guards
       ├─ Firebase service modules
       ├─ shared package calculations/types
       ├─ org-aware garage path resolution
       └─ callable Functions for server-authoritative operations
```

The web app uses React Router, lazy-loaded pages, Tailwind-based styling,
Firebase Auth/Firestore/Storage/Functions, consent-aware marketing analytics,
and environment-controlled coming-soon/marketing-only behavior.

### Mobile

```text
Flutter UI and GoRouter
  │
  ├─ authentication/onboarding
  ├─ garage, vehicle, records, maintenance, timeline, upcoming
  ├─ account/privacy/support/preferences
  ├─ subscription and Apple in-app purchase
  └─ Firebase services plus local/offline helpers
```

The repository carries iOS and Android platform trees, but current delivery
policy treats iOS as the mobile product and Android as on hold. The manifest
temporarily disables automated iOS build/upload as well.

## Data Scope

```text
Personal garage
users/{uid}/vehicles/{vin}/...

Shared household / organization garage
orgs/{orgId}/vehicles/{vin}/...
orgs/{orgId}/members/{uid}
users/{uid}/orgMemberships/{orgId}

Server-authoritative user state
users/{uid}/subscription/*
users/{uid}/quotas/*

Server-authoritative organization state
orgs/{orgId}/audit/*
orgs/{orgId}/compliance/*
orgs/{orgId}/financeInvoices/*
orgs/{orgId}/financePayables/*
```

Web, mobile, and shared helpers support personal and organization-scoped garage
paths. Some legacy services remain explicitly user-scoped; consult
`docs/HOUSEHOLD_TRIP_TELEMETRY_ARCHITECTURE.md` before extending trip or shared
garage behavior.

## Trust Boundaries

```text
Untrusted client input
  │
  ├─ Firebase Auth identity
  ├─ Firestore and Storage rules
  ├─ callable authentication/authorization guards
  ├─ server-side entitlement and quota enforcement
  └─ schema/size/type validation
       │
       ▼
Trusted Firebase Admin operations and external provider credentials
```

Client UI flags improve experience but are not security controls.
Subscription, quota, privileged organization, compliance, finance, billing,
and provider actions must remain server-authoritative.

## CI/CD Flow

```text
PR or branch push
  │
  ├─ Load project manifest and target environment
  ├─ Web unit tests
  ├─ Mobile unit tests
  ├─ Hosted Playwright UAT: Chromium + Firefox + WebKit
  └─ Quality Gate
       │
       ├─ optional iOS signed build/TestFlight (currently disabled)
       ├─ environment-specific web build
       └─ Firebase deploy
            ├─ checkout private Functions branch
            ├─ build shared packages
            ├─ vendor shared output into Functions
            └─ deploy rules, indexes, Storage, Functions, Hosting
```

Branch mapping is `develop` to development, `staging` to staging, and `main` to
production. The current release posture is in `docs/GO_LIVE_RUNBOOK.md`.

## Environment Boundaries

| Environment | Firebase project | Public branch | Search exposure |
| --- | --- | --- | --- |
| Development | `vehicle-vitals-dev` | `develop` | noindex |
| Staging | `vehicle-vitals-staging` | `staging` | noindex |
| Production | `vehicle-vitals-prod` | `main` | public/canonical |

Configuration is selected by the sanitized build scripts, Firebase config
files, GitHub secrets, and mobile environment config. Secret values are never
part of architecture documentation.

Development and staging are publicly reachable hosts; noindex headers are not
an authorization boundary. There is no current site-wide environment gate.
