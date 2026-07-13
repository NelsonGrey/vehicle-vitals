// Canonical capability vocabulary shared by SiteHeader, SiteFooter, and
// analytics — durable IDs and labels in one place so navigation surfaces
// can't drift the way SiteHeader/SiteFooter previously did (each hardcoded
// its own label/path strings independently). See
// docs/CAPABILITY_ARCHITECTURE_REFACTOR_PROMPT.md for the full spec.
//
// Mirrored (not code-generated) at packages/mobile/lib/data/capabilities.dart
// — kept in sync via packages/web/src/data/__tests__/capabilities.contract.test.ts,
// which reads that Dart file as plain text. Keep id/fullLabel/compactLabel
// literals free of string interpolation in both files so that test can
// regex-parse them.

export type CapabilityId =
  | 'garage'
  | 'maintenance_plan'
  | 'service_history'
  | 'shops_services'
  | 'account'
  | 'getting_started';

export interface Capability {
  id: CapabilityId;
  fullLabel: string;
  /** Compact label for tight spaces (mobile bottom nav); equals fullLabel where no shorter form is needed. */
  compactLabel: string;
  description: string;
  webRoute: string;
  /** Absent for capabilities without a single dedicated mobile route (e.g. getting_started, which is an onboarding/help entry point rather than one screen). */
  mobileRoute?: string;
  /** Stable analytics dimension value — kept distinct from `id` so it can diverge later without a breaking rename. */
  analyticsId: CapabilityId;
  surfaces: {
    publicNav: boolean;
    authNav: boolean;
    mobileBottomNav: boolean;
    mobileSecondaryEntry: boolean;
    help: boolean;
  };
  /** Sort order within authenticated navigation. */
  order: number;
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'getting_started',
    fullLabel: 'Getting Started',
    compactLabel: 'Getting Started',
    description: 'Help completing initial setup and reaching first value.',
    webRoute: '/getting-started',
    analyticsId: 'getting_started',
    surfaces: {
      publicNav: true,
      authNav: true,
      mobileBottomNav: false,
      mobileSecondaryEntry: true,
      help: false,
    },
    order: 1,
  },
  {
    id: 'garage',
    fullLabel: 'Garage',
    compactLabel: 'Garage',
    description: 'The vehicle list and overview.',
    webRoute: '/app',
    mobileRoute: '/app',
    analyticsId: 'garage',
    surfaces: {
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    },
    order: 2,
  },
  {
    id: 'service_history',
    fullLabel: 'Service History',
    compactLabel: 'History',
    description: 'A date-by-date view of completed work.',
    webRoute: '/app/timeline',
    mobileRoute: '/app/timeline',
    analyticsId: 'service_history',
    surfaces: {
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    },
    order: 3,
  },
  {
    id: 'maintenance_plan',
    fullLabel: 'Maintenance Plan',
    compactLabel: 'Plan',
    description: 'Upcoming maintenance and reminders.',
    webRoute: '/app/upcoming',
    mobileRoute: '/app/upcoming',
    analyticsId: 'maintenance_plan',
    surfaces: {
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    },
    order: 4,
  },
  {
    id: 'shops_services',
    fullLabel: 'Shops & Services',
    compactLabel: 'Shops & Services',
    description: 'Find and save nearby shops and services.',
    webRoute: '/app/providers',
    mobileRoute: '/app/service-providers',
    analyticsId: 'shops_services',
    surfaces: {
      publicNav: false,
      authNav: true,
      mobileBottomNav: false,
      mobileSecondaryEntry: true,
      help: true,
    },
    order: 5,
  },
  {
    id: 'account',
    fullLabel: 'Account',
    compactLabel: 'Account',
    description: 'Profile, subscription, and settings.',
    webRoute: '/app/profile',
    mobileRoute: '/app/profile',
    analyticsId: 'account',
    surfaces: {
      publicNav: false,
      authNav: true,
      mobileBottomNav: true,
      mobileSecondaryEntry: false,
      help: true,
    },
    order: 6,
  },
];

export const CAPABILITIES_BY_ID: Record<CapabilityId, Capability> =
  Object.fromEntries(
    CAPABILITIES.map(capability => [capability.id, capability])
  ) as Record<CapabilityId, Capability>;

/** Authenticated web/header nav, in display order. */
export const AUTH_NAV_CAPABILITIES: Capability[] = CAPABILITIES.filter(
  capability => capability.surfaces.authNav
).sort((a, b) => a.order - b.order);
