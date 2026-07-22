# Vehicle-Vitals Documentation Index

Last reviewed: July 20, 2026

This index defines which documents describe the current system, which are
supporting references, and which are retained as plans or historical evidence.
When documents conflict, use this precedence order:

1. Executable code, package manifests, Firebase configuration, and
   `.github/workflows/master-pipeline.yml`.
2. `GO_LIVE_RUNBOOK.md` for the current release posture.
3. `DEPLOY.md` and `STAGING_TO_PRODUCTION_RUNBOOK.md` for deployment and
   promotion operations.
4. `ARCHITECTURE.md`, `REQUIREMENTS.md`, and `BUSINESS_REQUIREMENTS.md` for the
   implemented system and product scope.
5. Planning, strategy, snapshot, generated, and archived documents.

## Current Repository Boundary

This public repository contains the React web app, Flutter mobile app, shared
libraries, Firebase rules/indexes/hosting configuration, CI/CD workflow,
scripts, media, and documentation.

Firebase Cloud Functions are maintained in the private companion repository
`NelsonGrey/vehicle-vitals-functions`. The active pipeline checks that repository
out at `packages/functions` before Firebase deployment. Local Functions work
uses the same gitignored path. Therefore, a reference in this documentation to
`packages/functions/...` means the mounted companion checkout, not a tracked
directory in this public repository.

## Current Operational Baseline

- Production web: `https://vehicle-vitals.com` and
  `https://vehicle-vitals-prod.web.app`.
- Branch mapping: `develop` -> development, `staging` -> staging, `main` ->
  production.
- Active workflow: `.github/workflows/master-pipeline.yml`.
- Web and Firebase deployment are enabled in `.cicd/projects/vehicle-vitals.yml`.
- iOS automated build/upload is temporarily disabled in that manifest; Android
  is disabled and on hold.
- The current release/deployment decision and verified test evidence live in
  `GO_LIVE_RUNBOOK.md`.

## Status Labels

- **Canonical**: maintained as a current source of truth.
- **Supporting**: current reference for a focused topic; defer to canonical
  sources if status differs.
- **Plan/specification**: desired or proposed work, not proof that the feature
  shipped.
- **Historical snapshot**: evidence from a dated milestone; not current status.
- **Generated/media**: derived output or production material.

## Release, Operations, and Testing

| Document | Status | Purpose |
| --- | --- | --- |
| `GO_LIVE_RUNBOOK.md` | Canonical | Current release posture, evidence, blockers, release gates, and rollback |
| `DEPLOY.md` | Canonical | Branch/environment mapping and automated/manual Firebase deployment |
| `STAGING_TO_PRODUCTION_RUNBOOK.md` | Canonical | Promotion sequence and readiness-report workflow |
| `PROD_SETUP_GUIDE.md` | Supporting | Required GitHub secret names and production setup without secret values |
| `ENVIRONMENT_SETUP.md` | Supporting | Local and hosted environment configuration |
| `SECURE_ENVIRONMENTS.md` | Supporting | Implemented environment exposure and access controls |
| `OAUTH_ENVIRONMENT_ACCESS.md` | Historical proposal | Retired site-wide OAuth gate design; not implemented |
| `OAUTH_GITHUB_SECRETS_SETUP.md` | Historical configuration | Residual CI secret names for the retired OAuth gate |
| `OAUTH_MIGRATION_GUIDE.md` | Historical record | Reconciliation of an earlier, unverified migration claim |
| `TESTING_INSTRUCTIONS.md` | Canonical | Current local and CI validation commands |
| `ACT_TESTING_GUIDE.md` | Supporting | Limited Linux-job workflow testing with `act` |
| `COST_EFFECTIVE_CICD.md` | Supporting | CI cost-control guidance; estimates must be rechecked before budgeting |
| `R1_COMPLETION_CHECKLIST.md` | Historical snapshot | R1 gate evidence captured through June 15, 2026 |
| `PRODUCTION_RELEASE_BRIEF.md` | Historical snapshot | Pre-production release decision from June 15, 2026 |
| `RELEASE_SCOPE_MATRIX.md` | Historical snapshot | Original R1-R4 release scope classification |
| `PROJECT_PLAN.md` | Historical plan | May-July 2026 rebaseline and closure templates |
| `EXTERNAL_LAUNCH_APPROVAL_PROMPT.md` | Supporting template | Manual commercial, legal, Apple, and operations approvals |
| `BETA_ACCESS_MATRIX.md` | Supporting template | Beta identity and access matrix |
| `BETA_TESTING_GUIDE.md` | Historical snapshot | Legacy beta distribution/testing process |

## Architecture, Engineering, and Security

| Document | Status | Purpose |
| --- | --- | --- |
| `ARCHITECTURE.md` | Canonical | System, client, Firebase, data, and companion-backend architecture |
| `ARCHITECTURE_DIAGRAM.md` | Supporting | Visual architecture and repository layout |
| `DEVELOPER_GUIDE.md` | Canonical | Developer setup, workflow, conventions, and commands |
| `REQUIREMENTS.md` | Canonical | Implemented feature and platform delivery baseline |
| `API_DATA_MODELS.md` | Historical/supporting | Long-form Firestore/API contract catalog; verify executable sources |
| `FIREBASE_CONFIG.md` | Supporting | Firebase project/configuration strategy |
| `FIREBASE_INDEXES.md` | Supporting | Firestore index source of truth and deployment |
| `FIRESTORE_MONETIZATION_RULES.md` | Supporting | Monetization rule intent; executable rules remain in `firebase/firestore.rules` |
| `SECURITY_IMPLEMENTATION.md` | Supporting | Security architecture and controls |
| `SECURITY_BEST_PRACTICES_REPORT.md` | Historical snapshot | July 2026 security findings and remediation record |
| `TECHNICAL_DEBT_RESOLUTION.md` | Historical snapshot | May 8, 2026 technical-debt review |
| `TROUBLESHOOTING.md` | Supporting | Diagnostics and common failure recovery |
| `AUTOMATION_README.md` | Historical/supporting | Legacy local automation helpers; not the deployment source of truth |

## Product, Monetization, and Future Architecture

| Document | Status | Purpose |
| --- | --- | --- |
| `BUSINESS_REQUIREMENTS.md` | Canonical | Product, market, operational, and business requirements |
| `PRODUCT_DESIGN.md` | Canonical | Product vision, personas, tiers, and UX specifications |
| `COMPONENT_LIBRARY.md` | Supporting | Current web/mobile reusable-component inventory and contribution rules |
| `MAINTENANCE_USER_CASES.md` | Supporting | Maintenance record taxonomy and user cases |
| `LAUNCH_CLAIMS_MATRIX.md` | Canonical | Approved customer-facing capability wording |
| `MONETIZATION_STRATEGY.md` | Supporting strategy | Pricing, ads, subscription, and revenue strategy |
| `MONETIZATION_DEVELOPER_GUIDE.md` | Supporting | Client feature flags, entitlements, ads, and quota integration |
| `MONETIZATION_IMPLEMENTATION.md` | Plan/status history | Implementation roadmap with dated progress; verify against code and companion repo |
| `APP_ALIGNMENT_PLAN.md` | Plan/specification | Marketing-to-product alignment backlog |
| `PRODUCT_DESIGN_PROGRESS.md` | Historical snapshot | Dated product-design progress summary |
| `NEXT_FEATURES_EXECUTION_PLAN.md` | Plan/specification | Prioritized future delivery plan |
| `API_INTEGRATION_ROADMAP.md` | Plan/specification | External data-provider roadmap and partial implementation notes |
| `CAPABILITY_ARCHITECTURE_REFACTOR_PROMPT.md` | Plan/specification | Implementation prompt for deeper capability-model refactoring |
| `HOUSEHOLD_FLEET_IMPLEMENTATION_PLAN.md` | Plan/status history | Household/shared-garage implementation slices |
| `HOUSEHOLD_TRIP_TELEMETRY_ARCHITECTURE.md` | Plan/specification | Future multi-driver trip attribution architecture |
| `VEHICLE_HEALTH_DASHBOARD_SPEC.md` | Plan/status history | Original vehicle-health design with core scoring now partially delivered |

## User, Marketing, and Media

| Document | Status | Purpose |
| --- | --- | --- |
| `USER_GUIDE.md` | Canonical | End-user product guide |
| `USER_FAQ_WEBSITE_IOS.md` | Canonical | Current website and iOS support FAQ |
| `MARKETING_STRATEGY.md` | Supporting strategy | Positioning, audiences, launch, and channel plan |
| `SOCIAL_MEDIA_STRATEGY_COMPREHENSIVE.md` | Supporting strategy | Social content and measurement plan |
| `MARKETING_ASSETS_OVERVIEW.md` | Supporting | Asset catalog and production guidance |
| `SCREENSHOT_AND_TUTORIAL_MEDIA_INVENTORY.md` | Supporting | Current screenshot/video inventory and capture sources |
| `SOLUTION_STORYBOARDS.md` | Generated/media | Editable website storyboard source |
| `SOLUTION_STORYBOARDS_PRINT.md` | Generated/media | Print-oriented storyboard source |
| `SOLUTION_STORYBOARDS_PRINT.pdf` | Generated/media | Rendered storyboard artifact |
| `PROMOTIONAL_VIDEO_SCRIPT.md` | Generated/media | Long-form promotional video script |
| `PROMOTIONAL_PODCAST_SCRIPT.md` | Generated/media | Promotional podcast/audio script |
| `AI_PODCAST_VIDEO_GENERATION_GUIDE.md` | Supporting | AI media generation workflow |
| `AI_PODCAST_VIDEO_GENERATION.ipynb` | Generated/media | Notebook for media generation experiments |
| `generated/NOTEBOOKLM_INSTRUCTIONS.md` | Generated/media | Generated NotebookLM instructions |
| `generated/podcast/podcast_clean.txt` | Generated/media | Generated clean podcast text |

## iOS and Android

| Document | Status | Purpose |
| --- | --- | --- |
| `IOS_FIREBASE_SETUP.md` | Supporting | Current Firebase configuration for iOS |
| `ASC_PRIVATE_KEY_SETUP.md` | Supporting | App Store Connect signing-key setup |
| `IOS_DOCUMENTATION_INDEX.md` | Supporting | Current index separating active and legacy iOS materials |
| `IOS_CERTIFICATE_SETUP_GUIDE.md` | Supporting | Certificate and Fastlane Match setup |
| `IOS_CERTIFICATE_QUICK_REFERENCE.md` | Historical snapshot | Legacy certificate quick reference |
| `IOS_CERTIFICATE_SETUP_SUMMARY.md` | Historical snapshot | Legacy setup summary |
| `IOS_CICD_INTEGRATION_GUIDE.md` | Historical template | Generic/legacy CI integration examples |
| `IOS_PROJECT_TEMPLATE.md` | Historical template | Generic/legacy iOS project template |
| `ANDROID_FIREBASE_SETUP.md` | On-hold reference | Android Firebase configuration; Android delivery is paused |

## Package and Repository-Level Documentation

- `../README.md`: project entry point and quick start.
- `../packages/web/README.md`: web package overview.
- `../packages/web/UAT_TESTING.md` and `UAT_QUICK_START.md`: detailed Playwright
  reference; current commands are summarized in `TESTING_INSTRUCTIONS.md`.
- `../packages/mobile/README.md`: Flutter package setup and structure.
- `../packages/mobile/config/README.md`: per-environment mobile Firebase files.
- `../packages/shared/README.md`: shared calculation/data package exports.
- `../packages/firebase-utils/README.md`: Firebase utility package reference.
- `../icons/README.md`: icon source and regeneration workflow.
- `../.github/SECURITY.md`: vulnerability reporting policy.

## Archived and Evidence Material

- `docs/archive/` contains superseded deployment/setup/status documents. Nothing
  there is an active instruction source.
- `artifacts/release/` and `artifacts/smoke/` contain dated evidence. They prove
  what happened during a particular run; they do not establish current status.
- `output/`, package build directories, Playwright result directories, and
  generated media are derived artifacts and should not be used to infer source
  behavior when code or configuration is available.

## Maintenance Rule

When a change affects behavior, update the smallest canonical document that
owns that behavior in the same pull request. If a dated plan or snapshot is no
longer current, preserve it and add or update its status banner rather than
rewriting historical evidence.
