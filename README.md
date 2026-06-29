# Vehicle Vitals

One garage for every vehicle record, reminder, and repair cost.

Vehicle Vitals is a cross-platform vehicle management application — web (React) and iOS (Flutter) — backed by Firebase. It lets owners track service history, plan upcoming maintenance, and build a credible ownership record across personal cars, shared household vehicles, and light business fleets.

## Who it's for

| Persona | Need | Recommended tier |
|---|---|---|
| **Responsible owner** | Keep one car reliable and documented | Free → Pro |
| **Household garage** | Coordinate every vehicle in the family | Pro |
| **New driver / new owner** | Build confidence with plain-language maintenance guidance | Free → Pro |
| **DIY maintainer** | Document the work you do yourself | Pro → Premium |
| **Light fleet** | Replace vehicle spreadsheets with operating visibility | Premium → Enterprise |

## Subscription tiers

| Tier | Price | Vehicles | Positioning |
|---|---|---|---|
| **Free** | Free | 2 | Learn and document |
| **Pro** | $2.99/month | 10 | Plan and coordinate |
| **Premium** | $6.99/month | 25 | Forecast and automate |
| **Enterprise** | Custom | 25+ | Govern and integrate |

## Repository structure

```
packages/
├── shared/      # Common types, Firebase services, Firestore factory, feature flags
├── web/         # React 18 + Vite + Tailwind web app (public marketing + authenticated app)
├── mobile/      # Flutter iOS app (Android on hold)
└── functions/   # Firebase Cloud Functions (reminders, VIN, calendar, entitlements, providers)
```

Supporting packages: `packages/firebase-utils` (admin SDK helpers).

## Documentation

**Product & business**

| Doc | Purpose |
|---|---|
| [docs/PRODUCT_DESIGN.md](docs/PRODUCT_DESIGN.md) | Product vision, persona definitions, tier matrix, UX flows |
| [docs/APP_ALIGNMENT_PLAN.md](docs/APP_ALIGNMENT_PLAN.md) | Web app + iOS changes needed to align with marketing direction |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Feature implementation status and production-readiness baseline |
| [docs/NEXT_FEATURES_EXECUTION_PLAN.md](docs/NEXT_FEATURES_EXECUTION_PLAN.md) | Prioritized execution roadmap (R1 → R4) |
| [docs/RELEASE_SCOPE_MATRIX.md](docs/RELEASE_SCOPE_MATRIX.md) | What is and is not in scope for R1 launch |
| [docs/MONETIZATION_STRATEGY.md](docs/MONETIZATION_STRATEGY.md) | Subscription tiers, ad placements, revenue model |

**Release & operations**

| Doc | Purpose |
|---|---|
| [docs/GO_LIVE_RUNBOOK.md](docs/GO_LIVE_RUNBOOK.md) | Executable go-live checklist, P0 blockers, validation gates, rollback plan |
| [docs/PRODUCTION_RELEASE_BRIEF.md](docs/PRODUCTION_RELEASE_BRIEF.md) | Release brief for the R1 launch |
| [docs/R1_COMPLETION_CHECKLIST.md](docs/R1_COMPLETION_CHECKLIST.md) | R1 gate evidence checklist |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Deployment guide for all environments |
| [docs/PROD_SETUP_GUIDE.md](docs/PROD_SETUP_GUIDE.md) | Production secrets and environment setup |
| [docs/DEPLOYMENT_STATUS.md](docs/DEPLOYMENT_STATUS.md) | Current environment status |

**Developer reference**

| Doc | Purpose |
|---|---|
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Local dev setup, testing workflow, conventions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flow |
| [docs/FIREBASE_CONFIG.md](docs/FIREBASE_CONFIG.md) | Firebase configuration and multi-environment patterns |
| [docs/FIREBASE_INDEXES.md](docs/FIREBASE_INDEXES.md) | Firestore composite indexes |
| [docs/MONETIZATION_DEVELOPER_GUIDE.md](docs/MONETIZATION_DEVELOPER_GUIDE.md) | Feature flags, entitlement hooks, tier gating |
| [docs/IOS_DOCUMENTATION_INDEX.md](docs/IOS_DOCUMENTATION_INDEX.md) | iOS certificate, signing, and CI/CD index |

## Quick start

### Web

```bash
npm install          # install all workspace dependencies
npm run dev:web      # start Vite dev server
npm run build:web    # production build
```

### Mobile (iOS)

```bash
cd packages/mobile
flutter pub get
flutter run -d ios
```

### Functions (local emulator)

```bash
firebase emulators:start --only firestore,functions,auth
```

## Testing

```bash
# Web unit tests (Vitest)
npm --workspace=@vehicle-vitals/web run test:unit

# Shared package tests (Vitest)
cd packages/shared && npx vitest run tests

# Mobile tests (Flutter)
cd packages/mobile && flutter test && flutter analyze

# Functions tests (Vitest)
npm --workspace=functions run test

# Web UAT (Playwright — requires a running dev or staging URL)
npm --workspace=@vehicle-vitals/web run test:uat:chromium
```

## Environments

| Environment | Firebase project | Branch | Purpose |
|---|---|---|---|
| Development | `vehicle-vitals-dev` | `develop` | Active development |
| Staging | `vehicle-vitals-staging` | `staging` | Pre-release validation |
| Production | `vehicle-vitals-prod` | `main` | Live application |

The `VITE_SHOW_COMING_SOON_PRODUCTION` GitHub secret controls whether production shows the coming-soon gate or the full app.

## CI/CD

The master pipeline (`master-pipeline.yml`) runs on `staging` and `main`. It gates on:

1. **Quality Gate** — web unit tests + mobile unit tests
2. **Build Web App** — Vite production build
3. **Build iOS App** — Xcode archive (macOS runner)
4. **Deploy Firebase** — Hosting, Firestore, Storage, Functions, Indexes

Use `gh workflow run master-pipeline.yml -f action=build_and_deploy -f environment=staging` to trigger manually.

## Conventions

- **Auth**: components read from `AuthContext`; do not access `auth.currentUser` directly outside services.
- **Data shape**: use `defaultVehicle` from `packages/shared/src/types.js` when creating vehicles.
- **Feature gating**: use `useSubscription()` and `hasFeature()` from `packages/web/src/shared/featureFlags.ts`; never hard-code tier checks in UI components.
- **Firestore paths**: user data lives at `users/{uid}/vehicles/{vin}`; org data at `orgs/{orgId}/vehicles/{vin}`.
- **Bundle ID**: `com.vehiclevitals` (migrated from `com.nelsongrey.vehiclevitals` June 2026).

## iOS app distribution

Internal testers receive builds via Firebase App Distribution. Production will use TestFlight / App Store.

```bash
cd packages/mobile
bundle exec fastlane ios beta    # build + distribute to internal testers
```

Signing certificates are managed via Fastlane Match. See [docs/IOS_CERTIFICATE_SETUP_GUIDE.md](docs/IOS_CERTIFICATE_SETUP_GUIDE.md).

## Android status

Android is on hold. The CI pipeline skips Android jobs. Do not include Android in launch copy or store plans until the Android deployment path is re-established.

## Support

- User support: support@vehicle-vitals.com
- Sales: sales@vehicle-vitals.com
