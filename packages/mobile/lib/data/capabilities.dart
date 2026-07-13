// Canonical capability vocabulary shared by mobile nav/screens and web's
// header/footer. Mirrors packages/web/src/data/capabilities.ts — kept in
// sync via packages/web/src/data/__tests__/capabilities.contract.test.ts,
// which reads this file as plain text and regex-parses the `id:` and
// `fullLabel:` literals below. Keep those two fields (and compactLabel) as
// plain string literals with NO interpolation so that test keeps working.

class CapabilitySurfaces {
  final bool publicNav;
  final bool authNav;
  final bool mobileBottomNav;
  final bool mobileSecondaryEntry;
  final bool help;

  const CapabilitySurfaces({
    required this.publicNav,
    required this.authNav,
    required this.mobileBottomNav,
    required this.mobileSecondaryEntry,
    required this.help,
  });
}

class Capability {
  final String id;
  final String fullLabel;
  final String compactLabel;
  final String description;
  final String webRoute;
  final String? mobileRoute;
  final String analyticsId;
  final CapabilitySurfaces surfaces;
  final int order;

  const Capability({
    required this.id,
    required this.fullLabel,
    required this.compactLabel,
    required this.description,
    required this.webRoute,
    this.mobileRoute,
    required this.analyticsId,
    required this.surfaces,
    required this.order,
  });
}

const List<Capability> capabilities = [
  Capability(
    id: 'getting_started',
    fullLabel: 'Getting Started',
    compactLabel: 'Getting Started',
    description: 'Help completing initial setup and reaching first value.',
    webRoute: '/getting-started',
    analyticsId: 'getting_started',
    surfaces: CapabilitySurfaces(
      publicNav: true,
      authNav: true,
      mobileBottomNav: false,
      mobileSecondaryEntry: true,
      help: false,
    ),
    order: 1,
  ),
  Capability(
    id: 'garage',
    fullLabel: 'Garage',
    compactLabel: 'Garage',
    description: 'The vehicle list and overview.',
    webRoute: '/app',
    mobileRoute: '/app',
    analyticsId: 'garage',
    surfaces: CapabilitySurfaces(
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    ),
    order: 2,
  ),
  Capability(
    id: 'service_history',
    fullLabel: 'Service History',
    compactLabel: 'History',
    description: 'A date-by-date view of completed work.',
    webRoute: '/app/timeline',
    mobileRoute: '/app/timeline',
    analyticsId: 'service_history',
    surfaces: CapabilitySurfaces(
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    ),
    order: 3,
  ),
  Capability(
    id: 'maintenance_plan',
    fullLabel: 'Maintenance Plan',
    compactLabel: 'Plan',
    description: 'Upcoming maintenance and reminders.',
    webRoute: '/app/upcoming',
    mobileRoute: '/app/upcoming',
    analyticsId: 'maintenance_plan',
    surfaces: CapabilitySurfaces(
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    ),
    order: 4,
  ),
  Capability(
    id: 'shops_services',
    fullLabel: 'Shops & Services',
    compactLabel: 'Shops & Services',
    description: 'Find and save nearby shops and services.',
    webRoute: '/app/providers',
    mobileRoute: '/app/service-providers',
    analyticsId: 'shops_services',
    surfaces: CapabilitySurfaces(
      publicNav: false,
      authNav: true,
      mobileBottomNav: false,
      mobileSecondaryEntry: true,
      help: true,
    ),
    order: 5,
  ),
  Capability(
    id: 'account',
    fullLabel: 'Account',
    compactLabel: 'Account',
    description: 'Profile, subscription, and settings.',
    webRoute: '/app/profile',
    mobileRoute: '/app/profile',
    analyticsId: 'account',
    surfaces: CapabilitySurfaces(
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    ),
    order: 6,
  ),
];

Capability? capabilityById(String id) {
  for (final capability in capabilities) {
    if (capability.id == id) return capability;
  }
  return null;
}
