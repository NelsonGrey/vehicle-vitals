# Vehicle Vitals Component Library

Last reviewed: July 20, 2026

This is an inventory and contribution guide for the reusable UI building
blocks that exist now. Component props and behavior are defined by source and
tests; this document deliberately avoids duplicating full interfaces that can
drift.

## Design Foundations

### Web

- Global styles and responsive tokens: `packages/web/src/styles.css`
- Tailwind configuration: `packages/web/tailwind.config.js`
- Reusable React components: `packages/web/src/components/`
- Page composition: `packages/web/src/pages/`
- Capability vocabulary and routes: `packages/web/src/data/capabilities.ts`

The web app uses React, TypeScript, Tailwind CSS, and React Router. Components
must support keyboard navigation, visible focus, meaningful accessible names,
reduced motion, dark mode where the surrounding surface supports it, mobile
widths, and compact laptop heights.

### Mobile

- Theme: `packages/mobile/lib/theme/app_theme.dart`
- Design tokens: `packages/mobile/lib/theme/design_tokens.dart`
- Utility mappings: `packages/mobile/lib/theme/tailwind_utilities.dart`
- Reusable widgets: `packages/mobile/lib/components/`
- Canonical capability vocabulary: `packages/mobile/lib/data/capabilities.dart`

The mobile app uses Flutter Material components with app-specific tokens. The
web and mobile capability literals are intentionally mirrored and verified by
the web capability-contract test.

## Current Web Components

### Shell and navigation

- `Layout.tsx` composes the shared page shell.
- `SiteHeader.tsx` and `SiteFooter.tsx` render navigation from the canonical
  capability vocabulary.
- `StackedVLogo.tsx` renders the code-native brand mark.
- `CollapsibleSection.tsx` provides the shared disclosure pattern.

### Authentication and route boundaries

- `AuthLayout.tsx` supplies the authentication page shell.
- `AuthAnonButton.tsx` handles anonymous authentication entry.
- `ProtectedRoute.tsx` requires a signed-in, non-anonymous user.
- `SuperAdminRoute.tsx` adds the application super-admin check.
- `AppEntryLink.tsx` keeps app-entry CTAs visible but disabled when Remote
  Config reports the app offline.
- `AppOfflineNotice.tsx` communicates that runtime state.

There is no current `EnvironmentGate` component. See
`SECURE_ENVIRONMENTS.md`.

### Reliability, media, and page metadata

- `ErrorBoundary.tsx` contains unhandled render failures.
- `CachedImage.tsx` provides the shared image-loading behavior.
- `PageSEO.tsx` applies route-specific metadata.
- `CookieConsentBanner.tsx` captures consent before optional analytics and ad
  behavior.
- `MarketingVideoPanel.tsx` renders marketing video content.

### Product UI

- `VehicleListItem.tsx`, `VehicleAlerts.tsx`, `VehicleHealthPanel.tsx`, and
  `CostAnalysisReportlet.tsx` render garage and vehicle insights.
- `UpgradeModal.tsx` presents tier-upgrade context.
- `DevStatusPanel.tsx` and development-only route content must never be exposed
  as production controls.

### Advertising

- `AdBanner.tsx`, `AdPlacement.tsx`, `HeaderAdBar.tsx`, and
  `InlineAdSection.tsx` compose consent- and entitlement-aware ad surfaces.
- Placement definitions live in `packages/web/src/shared/adPlacements.ts`.

## Current Mobile Components

- `app_bottom_nav.dart` routes between Garage, Plan, History, and Account.
- `app_logo.dart` renders the mobile brand mark.
- `ad_banner.dart` and `inline_ad_section.dart` provide monetization surfaces.
- `error_boundary.dart` contains application errors.
- `plus_minus_expansion_tile.dart` provides the standard disclosure affordance.
- `safe_back_button.dart` provides guarded navigation behavior.
- `vehicle_health_widgets.dart` groups vehicle-health presentation widgets.
- `vehicle_thumbnail.dart` renders vehicle imagery and fallbacks.

Reusable mobile widgets belong in `lib/components`; full screens belong in
`lib/screens`. The removed `lib/widgets` paths from the original component
catalog are not part of the current project.

## Contribution Rules

1. Search the existing component directory before adding a new primitive.
2. Keep route names and customer-facing capability labels in the canonical
   capability files instead of duplicating them in headers or navigation.
3. Keep data fetching, authorization, and mutations in shared services/hooks
   where practical; components should focus on interaction and presentation.
4. Use semantic HTML and native Flutter controls before custom interaction
   patterns.
5. Preserve loading, empty, error, offline, unauthorized, and reduced-motion
   states.
6. Add focused unit/widget tests for behavior and update UAT coverage when a
   user-critical route or navigation contract changes.
7. Validate with the commands in `TESTING_INSTRUCTIONS.md`.

## Source Precedence

For exact props, state, or styling, read the component and its tests. For
navigation labels, read the capability files. For routes, read
`packages/web/src/App.tsx` and `packages/mobile/lib/main.dart`. If this inventory
drifts from source, source wins and this file should be updated in the same
change.
