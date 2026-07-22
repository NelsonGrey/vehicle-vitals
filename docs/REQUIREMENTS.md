# Vehicle-Vitals Requirements and Delivery Status

Last verified: July 20, 2026

Status: Canonical implementation baseline. This document describes repository
delivery, not current release approval. Use `GO_LIVE_RUNBOOK.md` for release
evidence and blockers, `BUSINESS_REQUIREMENTS.md` for business requirements, and
`PRODUCT_DESIGN.md` for UX/product intent.

## Scope Contract

Vehicle-Vitals helps individuals, households, hands-on maintainers, and light
fleets keep vehicle records, plan maintenance, understand vehicle health, and
coordinate ownership responsibilities across web and iOS.

Delivery terms:

- **Implemented**: source and automated coverage exist in the applicable
  repository.
- **Partial**: meaningful implementation exists, but a platform, workflow, or
  production proof remains incomplete.
- **Planned**: specification/roadmap exists without a complete customer flow.
- **External verification**: repository code cannot establish the current
  provider/store/legal/operations state.

## Platform Status

| Platform/component | Status | Current boundary |
| --- | --- | --- |
| Production web | Implemented/deployed | React/Vite app served at `vehicle-vitals.com`; next deployment currently blocked by production Chromium UAT |
| Development/staging web | Implemented/deployed | Separate Firebase projects and noindex Hosting headers |
| iOS app | Implemented; release state external | Flutter client and iOS project are present; automated CI build/upload is temporarily disabled |
| Android app | On hold | Flutter Android project exists, but manifest disables build/distribution |
| Shared package | Implemented | Domain calculations, data helpers, and garage routing |
| Firebase rules/indexes/hosting | Implemented | Tracked in the public repository |
| Cloud Functions | Implemented in private companion | Mounted at `packages/functions` for local/CI work; public checkout does not contain backend source |

## Functional Requirements

### Authentication and account

| Requirement | Status | Evidence surface |
| --- | --- | --- |
| Email sign-up/sign-in/sign-out/reset | Implemented | Web auth routes, mobile auth screens/services, UAT/unit coverage |
| Google/Apple provider support | Partial | Client integration exists; provider console/store behavior requires environment verification |
| Profile, account, preferences, privacy, legal, support | Implemented | Web and mobile routes/screens |
| Account consolidation/recovery | Partial | Web flow/callable client exists; backend is companion-owned and production success evidence remains required |
| User data export/deletion intake | Partial | Client/backend contracts exist; operational fulfillment and legal SLA are external |

### Garage and vehicle records

| Requirement | Status | Evidence surface |
| --- | --- | --- |
| Add, edit, view, and remove vehicles | Implemented | Web/mobile pages/screens/services/tests |
| VIN validation/lookup | Implemented with provider dependency | Shared validation and client/backend calls; external availability requires runtime evidence |
| Vehicle photos and record attachments | Implemented | Web/mobile Storage services and rules |
| Maintenance/service history | Implemented | Web Records, mobile maintenance/records screens, shared models |
| Timeline and upcoming work | Implemented | Web/mobile timeline and upcoming surfaces |
| Export CSV/PDF/share | Implemented | Web/mobile export services and historical parity evidence |
| Vehicle health and ownership insights | Implemented/iterating | Shared calculations, web/mobile presentation, regression tests; provider/server enrichment can vary |
| Shops & Services/provider directory | Partial | Web/mobile discovery surfaces exist; live provider coverage and conversion are integration-dependent |

### Reminders and integrations

| Requirement | Status | Evidence surface |
| --- | --- | --- |
| Reminder lifecycle and preferences | Implemented | Client services/UI and companion backend contracts |
| Email/push execution | Partial | Integration code and client setup exist; release requires current production delivery/log evidence |
| Calendar actions | Partial | Web/mobile/backend integration paths exist; provider authorization and end-to-end evidence required |
| Manuals, warranty, maintenance-plan integrations | Partial | Companion/provider architecture and client entry points exist; live coverage varies |
| AI/document analysis | Partial | Client summary/quota flows and shared formatting exist; provider quota and runtime evidence required |

### Shared household and organization scope

| Requirement | Status | Evidence surface |
| --- | --- | --- |
| Organization membership and roles | Implemented foundation | Firestore rules, client context, companion callables |
| Personal/org garage path routing | Implemented foundation | Shared and mobile/web scope helpers with targeted tests |
| Household garage presentation | Partial | Persona/product and implementation slices exist; end-to-end multi-user validation remains required |
| Multiple simultaneous active organizations | Not supported by current assumptions | Primary-org resolution must be redesigned first |
| Multi-driver trip telemetry and attribution | Planned | `HOUSEHOLD_TRIP_TELEMETRY_ARCHITECTURE.md` |
| Light-fleet finance/compliance administration | Partial | Rule/client/backend foundations exist; full operations workflow is not proven |

## Monetization Requirements

The product catalog includes Free, Pro, Premium, and Enterprise.

| Requirement | Status | Release qualification |
| --- | --- | --- |
| Web/mobile tier presentation | Implemented | Labels/prices/features must remain synchronized |
| Client feature flags and vehicle limits | Implemented | UX control only; server enforcement still required for protected value |
| Server-authoritative entitlements | Implemented in companion | Must be verified against the compatible deployed backend |
| Web Stripe checkout/portal/webhooks | Partial | Code paths exist; current live checkout, webhook, cancellation, and recovery evidence is external/release-gated |
| iOS Pro/Premium purchase and restore | Partial | Apple IAP code exists; App Store product/review/purchase evidence is external |
| Enterprise sales handoff | Implemented presentation; operationally external | Support/sales staffing and contracts are outside the repository |
| Web AdSense and mobile AdMob | Partial/deployed by configuration | Consent, fill, placement, policy, and revenue require production/provider evidence |
| Quotas | Implemented foundation | Firestore client writes are denied; companion enforcement must stay aligned with client catalogs |

Do not claim paid tiers are generally available merely because checkout or
purchase UI exists. Availability is a release and external-provider decision.

## Security and Privacy Requirements

- Users must be isolated from other users' data.
- Organization data must require active membership and role-appropriate access.
- Subscription, quota, audit, compliance, and finance state must be
  server-authoritative.
- Public anonymous form writes must use exact schema/type/size validation and
  deny public reads.
- Storage writes must be user/org scoped and content constrained.
- Callable Functions must validate identity, role, input, rate, size, and
  idempotency as appropriate.
- Secrets must stay in GitHub/Firebase/App Store/provider secret stores.
- Development/staging must remain isolated from production data and noindexed.
- Privacy, terms, deletion, retention, and incident procedures require both
  implementation and accountable external operations.

Executable client access policy is in `firebase/firestore.rules` and
`firebase/storage.rules`. The public repository had zero open Dependabot,
CodeQL, and secret-scanning alerts when verified July 20; that is a point-in-
time signal, not a permanent guarantee.

## Quality Requirements

For ordinary changes:

- deterministic dependency install;
- TypeScript checks;
- web/shared/Firebase-utils unit coverage;
- Flutter analyzer and tests;
- script tests when operational/media tooling changes;
- production web build;
- targeted rules/emulator tests for access changes;
- companion build/lint/tests for backend/shared contract changes.

For a deployment-capable release:

- hosted Playwright UAT on Chromium, Firefox, and WebKit;
- green Quality Gate;
- environment-specific build;
- compatible private Functions branch;
- successful Firebase deployment and smoke evidence.

See `TESTING_INSTRUCTIONS.md` for commands and `GO_LIVE_RUNBOOK.md` for the
current baseline.

## Non-Functional Requirements

- Responsive web behavior must support phones, tablets, standard desktops, and
  short laptop viewports without excessive scrolling.
- Production web must use canonical metadata, security headers, and consent-
  aware analytics/advertising.
- Development and staging must be isolated and noindexed.
- Critical records must preserve backward-compatible parsing for historical
  stored data.
- Personal and org-scope changes must be tested separately.
- Build output should remain deployable; current bundle-size/dynamic-import
  warnings are tracked performance debt.
- Release and rollback must be reproducible through the master pipeline and
  documented companion-repository alignment.

## Known Open Delivery Areas

- Reconcile production Chromium UAT with current marketing navigation/content.
- Prove the next green staging and production deploy-capable run.
- Re-enable and validate iOS automation only when a new signed/TestFlight build
  is intended.
- Capture current paid web and iOS production purchase evidence before broad
  paid-tier claims.
- Complete operational/legal/support approvals outside the repository.
- Continue household/shared-garage validation before expanding its claims.
- Keep future trip telemetry, deeper fleet workflows, and vehicle-health
  enrichment classified as plans until their acceptance criteria are met.

## Governance

When a feature ships or changes materially, update this file in the same change
as the code/tests. Preserve dated plans and evidence as historical records, but
do not use them to override current implementation or release status.
