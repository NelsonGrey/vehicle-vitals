# Vehicle Vitals Capability Architecture Refactor Prompt

## Role and objective

Act as a senior product engineer and application architect working in the
`vehicle-vitals` monorepo. Implement layers 2–4 of the capability and
information-architecture refactor across the React web application, Flutter
mobile application, shared code, analytics, tests, and documentation.

The presentation-only terminology pass has already established these
customer-facing capabilities:

- Garage
- Maintenance Plan
- Service History
- Shops & Services
- Account
- Getting Started
- Product Tour
- Help
- Support

Your objective is to make the underlying application structure, navigation,
product journeys, and technical contracts support this capability model without
introducing data loss, breaking existing URLs, fragmenting analytics, or
unnecessarily renaming stable backend identifiers.

Work end-to-end. Inspect the repository before changing it, preserve unrelated
worktree changes, implement the refactor, add compatibility behavior, update
tests and documentation, and validate both web and mobile.

## Repository context

Important existing web surfaces include:

- `packages/web/src/components/SiteHeader.tsx`
- `packages/web/src/components/SiteFooter.tsx`
- `packages/web/src/pages/Instructions.tsx`
- `packages/web/src/pages/StartSteps.tsx`
- `packages/web/src/pages/ShortVideoTours.tsx`
- `packages/web/src/pages/EverydayScreens.tsx`
- `packages/web/src/pages/Help.tsx`
- `packages/web/src/pages/ServiceProviders.tsx`
- `packages/web/src/pages/TimelineDashboard.tsx`
- `packages/web/src/pages/UpcomingTasks.tsx`
- `packages/web/src/pages/Profile.tsx`
- `packages/web/src/App.tsx`
- `packages/web/src/shared/seoMeta.ts`
- `packages/web/public/sitemap.xml`

Important mobile surfaces include:

- `packages/mobile/lib/components/app_bottom_nav.dart`
- `packages/mobile/lib/screens/account_screen.dart`
- `packages/mobile/lib/screens/instructions_screen.dart`
- `packages/mobile/lib/screens/onboarding_screen.dart`
- `packages/mobile/lib/screens/service_providers_screen.dart`
- `packages/mobile/lib/screens/timeline_dashboard_screen.dart`
- `packages/mobile/lib/screens/upcoming_tasks_screen.dart`
- `packages/mobile/lib/main.dart`

Search for all routes, labels, analytics calls, help references, accessibility
labels, tests, screenshot fixtures, and documentation before editing. Do not
assume the list above is exhaustive.

## Required capability model

Use one canonical capability vocabulary across web and mobile:

| Capability ID | Full customer label | Compact mobile label | Current implementation |
| --- | --- | --- | --- |
| `garage` | Garage | Garage | `/app` |
| `maintenance_plan` | Maintenance Plan | Plan | web `/app/upcoming`; mobile `/app/upcoming` |
| `service_history` | Service History | History | web `/app/timeline`; mobile `/app/timeline` |
| `shops_services` | Shops & Services | none required in bottom navigation | web `/app/providers`; mobile `/app/service-providers` |
| `account` | Account | Account | web `/app/profile`; mobile `/app/profile` |
| `getting_started` | Getting Started | Getting Started | web `/getting-started`; mobile onboarding/help entry points |

The capability ID is the durable semantic identifier. Display labels may vary
by surface and available space, but their meaning must remain consistent.

## Layer 2: front-end application architecture

### 2.1 Centralize capability and navigation metadata

Create an appropriate shared or platform-specific typed configuration so
headers, footers, menus, help links, empty states, and analytics do not maintain
independent hardcoded terminology.

The metadata should support, where relevant:

- durable capability ID;
- full label;
- compact label;
- description;
- web route;
- mobile route;
- icon identifier or platform icon mapping;
- whether the capability appears in public navigation, authenticated
  navigation, mobile bottom navigation, secondary navigation, or help;
- analytics identifier that does not depend on mutable display copy;
- ordering.

Do not force React-specific values into code that must be consumed by Flutter.
Choose a maintainable source-of-truth strategy and document it. If a truly
cross-language generated artifact would add too much build complexity, use
parallel typed definitions with contract tests that assert the same IDs and
labels.

### 2.2 Consolidate Getting Started and How It Works

Make `/getting-started` the canonical onboarding and first-use guide.

- Move any useful three-step summary, screenshots, and calls to action from
  `StartSteps.tsx` into the canonical Getting Started experience.
- Remove duplicate or contradictory copy.
- Replace internal links to `/start-steps` with `/getting-started`.
- Keep `/start-steps` as a client-side redirect to `/getting-started`.
- Use a replace-style redirect so the obsolete URL does not remain in browser
  history.
- Update canonical metadata, sitemap entries, tests, analytics labels, and
  documentation.
- Preserve inbound links and campaign URLs.

### 2.3 Consolidate Screens into Product Tour

Make `/short-video-tours`—or a deliberately chosen new stable route—the
canonical Product Tour.

- Combine the strongest screenshots, short videos, capability explanations,
  and feature-demo links into one coherent Product Tour.
- Organize the tour by the canonical capability model rather than by media
  format alone.
- Replace internal links to `/everyday-screens` with the canonical Product Tour.
- Redirect `/everyday-screens` to the Product Tour with replace semantics.
- Do not delete underlying image or video assets that remain in use.
- Update SEO metadata, sitemap entries, tests, analytics, and documentation.
- If changing `/short-video-tours` to a cleaner `/product-tour` route, preserve
  `/short-video-tours` as an additional redirect and make only one URL
  canonical.

### 2.4 Make authenticated and public navigation intentional

Public navigation should support evaluation and conversion. Authenticated
navigation should support accomplishing work.

Authenticated web navigation should use:

- Getting Started
- Garage
- Service History
- Maintenance Plan
- Shops & Services
- Account

The authenticated footer should not render redundant public-product and app
groups containing duplicate destinations. Keep Pricing accessible where it is
useful for subscription management, but do not overload the primary task
navigation.

Public footer/navigation should retain clear access to:

- Getting Started
- Product Tour
- Pricing
- persona/use-case paths where appropriate
- Help
- Support
- Privacy
- Terms

Ensure responsive behavior at 1024×768, 1280×720, 1366×768, standard desktop,
tablet, and mobile widths. Avoid horizontal overflow and preserve accessible
focus order.

### 2.5 Preserve route compatibility

Do not rename stable authenticated routes merely to make URLs match the new
copy unless there is a demonstrated architectural benefit. Prefer semantic
route aliases and redirects over breaking changes.

At minimum, verify compatibility for:

- `/start-steps`
- `/getting-started`
- `/everyday-screens`
- `/short-video-tours`
- `/app/profile`
- `/app/timeline`
- `/app/upcoming`
- `/app/providers`
- `/app/service-providers`

Add route-level tests for canonical destinations and legacy redirects.

## Layer 3: product and interaction architecture

### 3.1 Define distinct user journeys

Enforce these responsibilities:

- Getting Started: help a user complete initial setup and reach first value.
- Product Tour: help a prospective or evaluating user understand capabilities.
- Help: help a user find instructions or resolve a problem.
- Support: help a user contact a person or escalate an unresolved issue.

Remove loops where these surfaces repeatedly send users to one another without
advancing the task.

### 3.2 Create a meaningful Getting Started journey

Design the canonical setup flow around concrete milestones:

1. Create or access an account.
2. Add the first vehicle.
3. Save the first service record.
4. Review Service History.
5. Configure Maintenance Plan and reminder preferences.
6. Optionally find or save a place in Shops & Services.

Decide whether the experience should be static guidance or a stateful progress
checklist. Base the decision on existing data that can safely prove completion.
If progress is implemented:

- derive completion from authoritative user/garage data where possible;
- do not create duplicate sources of truth for vehicle or record completion;
- distinguish automatic completion from manually dismissed guidance;
- support personal and shared-garage contexts;
- allow a user to reopen or restart guidance;
- define behavior for anonymous, new, returning, and migrated users;
- preserve accessibility and reduced-motion preferences;
- document the completion model.

If a stateful checklist would require backend or data-model expansion beyond
the evidence available in the repository, document the decision and implement
the strongest safe static/contextual version instead of inventing fragile
state.

### 3.3 Align empty states and contextual entry points

Use capability-aware empty states and cross-links:

- An empty Garage should lead to the appropriate Getting Started step.
- A vehicle without records should lead to adding its first service record.
- Empty Service History should explain how records populate it.
- Empty Maintenance Plan should explain reminder inputs and next actions.
- Shops & Services should be reachable contextually from Garage, maintenance
  entry/edit flows, and relevant account/settings surfaces.

Do not add Shops & Services as a fifth mobile bottom-navigation item. Keep four
mobile destinations:

- Garage
- Plan
- History
- Account

Add a clear Shops & Services entry point from Garage and retain a secondary
entry under Account or Settings. Use full screen titles and accessible labels
even when compact bottom-navigation labels are used.

### 3.4 Reorganize Help by capability

Structure Help around:

1. Search.
2. Common tasks.
3. Garage and vehicles.
4. Service records and Service History.
5. Maintenance Plan and reminders.
6. Shops & Services.
7. Account, billing, privacy, and synchronization.
8. Troubleshooting.
9. Glossary.
10. Support escalation.

Treat web/iOS/Android as filters or answer metadata rather than forcing users
to browse three unrelated FAQ walls. Preserve linkable anchors for important
help topics, including reminder guidance. Ensure search continues to find
legacy terms such as Timeline, Upcoming Tasks, Mechanics, Profile, and Service
Providers during the transition, even when those terms are no longer primary
display copy.

### 3.5 Accessibility and interaction requirements

- Preserve semantic headings and logical heading order.
- Give compact mobile labels full accessibility labels where needed.
- Use `+` and `−` only for inline disclosure controls; retain directional
  chevrons for navigation.
- Preserve keyboard operation, visible focus, screen-reader names, and touch
  target sizes.
- Announce dynamic progress, search results, saves, and errors appropriately.
- Avoid relying on color alone.

## Layer 4: data, services, analytics, and compatibility architecture

### 4.1 Preserve stable persisted and backend contracts by default

The following are examples of identifiers that should not be renamed merely
for presentation consistency:

- Firestore fields such as `preferredProviders`;
- callable/function names such as `getLocalServiceProvidersCallable`;
- service/module names such as `LocalProvidersService`;
- persisted values such as `performedBy: 'mechanic'`;
- current authenticated route paths;
- existing document structures used by released clients.

Treat `provider` and `mechanic` as legacy/internal domain vocabulary where
required for compatibility. Map it to customer-facing Shops & Services language
at presentation boundaries.

Before changing any internal identifier, trace all web, mobile, Functions,
rules, tests, scripts, analytics, and persisted-data consumers. Only perform an
internal rename when it materially improves the architecture and includes a
backward-compatible migration plan.

### 4.2 Add an explicit terminology boundary

Create adapters, selectors, constants, or typed mappings that prevent raw
backend vocabulary from leaking into visible copy. Error messages returned by
services should be converted into helpful UI language without changing stable
machine-readable error codes.

Do not use broad string replacement on internal identifiers.

### 4.3 Analytics continuity

- Preserve stable event names and capability IDs when possible.
- Do not use mutable display labels as the only analytics dimension.
- Add or standardize a `capability_id` dimension using the canonical IDs.
- If existing reports depend on old labels, send compatibility fields during a
  documented transition window.
- Update navigation-click, help-search, Getting Started, Product Tour, and
  contextual-entry events.
- Prevent redirects from double-counting page views.
- Document dashboard/report changes that must be performed outside the repo.

### 4.4 SEO and public URL migration

- Select one canonical URL for Getting Started and one for Product Tour.
- Update titles, descriptions, canonical tags, Open Graph metadata, structured
  data where applicable, `sitemap.xml`, and internal links.
- Remove obsolete URLs from the sitemap only after redirects exist.
- Preserve redirect behavior for external links.
- Ensure legacy routes do not render competing canonical content.

### 4.5 Backward compatibility and rollout

Provide a rollout plan that covers:

- older mobile clients reading existing data;
- mixed web/mobile client versions;
- cached public URLs;
- saved bookmarks;
- analytics continuity;
- rollback behavior;
- any Remote Config or feature-flag use justified by risk.

Avoid a feature flag for simple copy. Use flags only when product behavior or a
stateful Getting Started flow needs controlled rollout.

## Required tests and validation

### Web

- Unit/component tests for public and authenticated header/footer navigation.
- Route tests for canonical pages and all legacy redirects.
- Getting Started and Product Tour content tests.
- Help search tests covering both new and legacy terminology.
- Accessibility assertions for navigation names, headings, disclosure controls,
  and focus behavior.
- Production build.
- Type check, distinguishing pre-existing failures from regressions.
- Browser verification at representative laptop, desktop, tablet, and mobile
  viewports.

### Mobile

- Widget tests for bottom navigation labels and routes.
- Widget tests for full screen titles and Shops & Services entry points.
- Tests for Getting Started progress or contextual behavior if implemented.
- Tests showing persisted `preferredProviders` and `performedBy: 'mechanic'`
  data still renders correctly with the new UI language.
- Flutter analyze.
- Relevant unit/widget tests.
- At least one Android and one iOS-compatible build validation appropriate to
  the repository environment.

### Cross-platform consistency

- Add a contract test or documented verification ensuring canonical capability
  IDs and full labels match across web and mobile.
- Verify Garage, Maintenance Plan, Service History, Shops & Services, Account,
  Getting Started, Help, and Support are used consistently in visible UI.
- Verify legacy terms remain searchable in Help but are not used as primary
  navigation labels.

## Documentation deliverables

Update relevant architecture, product-design, user-guide, and marketing
documentation. Include:

- canonical capability vocabulary;
- public versus authenticated navigation model;
- web/mobile label differences;
- canonical and legacy route table;
- internal-versus-display terminology boundary;
- analytics compatibility notes;
- Getting Started completion model, if any;
- rollout and rollback plan.

## Completion criteria

The work is complete only when:

- duplicate public journeys are consolidated behind canonical pages;
- legacy public URLs redirect safely;
- headers, footers, mobile navigation, page titles, Help, empty states, and
  contextual links follow the capability model;
- Shops & Services is discoverable on mobile without crowding bottom
  navigation;
- stable data and backend contracts remain compatible or have a fully tested
  migration;
- analytics and SEO continuity are addressed;
- tests, builds, analysis, responsive checks, and accessibility checks pass or
  any verified pre-existing failures are clearly documented;
- no unrelated worktree changes are overwritten.

Finish with a concise implementation report listing changed architecture,
compatibility decisions, redirects, validation results, and any external
dashboard or release actions still required.
