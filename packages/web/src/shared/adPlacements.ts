/**
 * Ad Placements Configuration
 * Defines all ad units, their placement rules, and rendering logic
 * See: docs/MONETIZATION_STRATEGY.md for placement strategy details
 */

import type { UserTier } from './featureFlags';

export type WebAdPlacement =
  | 'header' // Dashboard banner (320x50 mobile, 728x90 web)
  | 'sidebar' // Right rail (300x600 or 300x250)
  | 'maintenanceHistory' // Below maintenance entries (300x250)
  | 'providerDirectory' // Provider discovery page (featured listings)
  | 'reminderNotification' // Within reminder cards (native)
  | 'exportReport'; // Export page footer (728x90)

export interface AdUnit {
  placement: WebAdPlacement;
  name: string;
  sizes: string[];
  mobileSize: string;
  desktopSize: string;
  location: string;
  frequency:
    | 'always'
    | 'daily'
    | 'rotate_30s'
    | 'rotate_60s'
    | 'once_per_session';
  maxImpressionsPerSession: number;
  showForTiers: UserTier[];
  dismissible: boolean;
  disabled: boolean; // For gradual rollout
  notes: string;
}

/**
 * Ad placement configuration - source of truth for all ad units
 */
export const AD_PLACEMENTS: Record<WebAdPlacement, AdUnit> = {
  header: {
    placement: 'header',
    name: 'Dashboard Header Banner',
    sizes: ['320x50', '728x90'],
    mobileSize: '320x50',
    desktopSize: '728x90',
    location: 'Above vehicle list (sticky)',
    frequency: 'rotate_60s',
    maxImpressionsPerSession: 20, // Rotates every 60s, 20 min session = ~20 impressions
    showForTiers: ['free', 'pro'], // Premium gets no ads
    dismissible: false,
    disabled: false,
    notes: 'Sticky header persists on scroll. Auto-rotate every 60 seconds.',
  },

  sidebar: {
    placement: 'sidebar',
    name: 'Sidebar Rectangle (Desktop)',
    sizes: ['300x600', '300x250'],
    mobileSize: '', // Not shown on mobile
    desktopSize: '300x600',
    location: 'Right rail on vehicle dashboard (desktop only)',
    frequency: 'rotate_30s',
    maxImpressionsPerSession: 30,
    showForTiers: ['free'], // Pro/Premium don't see sidebar
    dismissible: false,
    disabled: false,
    notes:
      'Desktop-only placement. Highest CPM target ($2-5). Rotates every 30 seconds.',
  },

  maintenanceHistory: {
    placement: 'maintenanceHistory',
    name: 'Maintenance History Ad',
    sizes: ['300x250'],
    mobileSize: '300x250',
    desktopSize: '300x250',
    location: 'After every 3-5 maintenance entries in timeline',
    frequency: 'always',
    maxImpressionsPerSession: 10, // User scrolls through ~5-10 records
    showForTiers: ['free'], // Pro/Premium don't see this placement
    dismissible: false,
    disabled: false,
    notes:
      'High engagement placement. User actively browsing maintenance records. Strong conversion potential for parts retailers.',
  },

  providerDirectory: {
    placement: 'providerDirectory',
    name: 'Provider Directory Sponsored Listings',
    sizes: ['featured_listing', '300x250'],
    mobileSize: 'featured_listing',
    desktopSize: 'featured_listing',
    location: '"Find Providers" page - mixed with organic listings',
    frequency: 'always',
    maxImpressionsPerSession: 5,
    showForTiers: ['free', 'pro'], // Premium gets bonus: all organic, no ads
    dismissible: false,
    disabled: false,
    notes:
      'B2B merchant tier: Mechanics pay $9-15/month to be featured. 70% organic / 30% sponsored mix.',
  },

  reminderNotification: {
    placement: 'reminderNotification',
    name: 'Reminder Notification Ad',
    sizes: ['native'],
    mobileSize: 'native',
    desktopSize: 'native',
    location: 'Native ad within maintenance reminder cards',
    frequency: 'once_per_session',
    maxImpressionsPerSession: 3,
    showForTiers: ['free'], // Pro/Premium don't see reminder ads
    dismissible: true,
    disabled: false,
    notes:
      'Contextual: "Oil change due soon - Get 10% off at Valvoline". Partner promo codes drive commission. High intent users.',
  },

  exportReport: {
    placement: 'exportReport',
    name: 'Export Report Footer Ad',
    sizes: ['728x90'],
    mobileSize: '320x50',
    desktopSize: '728x90',
    location: 'Bottom of PDF/web export reports',
    frequency: 'once_per_session',
    maxImpressionsPerSession: 1,
    showForTiers: ['free'], // Pro/Premium don't see this
    dismissible: false,
    disabled: false,
    notes:
      'Premium CPM placement ($8-15). Financial services target (loans, insurance). High commercial value.',
  },
};

/**
 * Get ad slot ID from environment variables
 * Fallback to default if not configured
 */
const getAdSlotFromEnv = (placement: WebAdPlacement): string => {
  const envKey = `VITE_ADSENSE_SLOT_${placement.toUpperCase()}`;
  return String(import.meta.env[envKey] || '').trim();
};

const fallbackSlot = String(import.meta.env.VITE_ADSENSE_SLOT || '').trim();

const placementSlotMap: Record<WebAdPlacement, string> = {
  header: getAdSlotFromEnv('header'),
  sidebar: getAdSlotFromEnv('sidebar'),
  maintenanceHistory: getAdSlotFromEnv('maintenanceHistory'),
  providerDirectory: getAdSlotFromEnv('providerDirectory'),
  reminderNotification: getAdSlotFromEnv('reminderNotification'),
  exportReport: getAdSlotFromEnv('exportReport'),
};

/**
 * Get ad slot/unit ID for a placement
 */
export function getAdSlot(placement: WebAdPlacement): string {
  return placementSlotMap[placement] || fallbackSlot;
}

/**
 * Get ad unit configuration
 */
export function getAdUnit(placement: WebAdPlacement): AdUnit {
  return AD_PLACEMENTS[placement];
}

/**
 * Check if ad placement should be shown for a tier
 */
export function shouldShowAd(
  placement: WebAdPlacement,
  tier: UserTier
): boolean {
  const unit = AD_PLACEMENTS[placement];
  if (!unit) {
    return false;
  }

  return !unit.disabled && unit.showForTiers.includes(tier);
}

/**
 * Get all active ad placements for a tier
 */
export function getActiveAdsForTier(tier: UserTier): AdUnit[] {
  return Object.values(AD_PLACEMENTS).filter(unit =>
    shouldShowAd(unit.placement, tier)
  );
}

/**
 * Count active ads per page for a tier
 */
export function getAdCountForTier(tier: UserTier): number {
  return getActiveAdsForTier(tier).length;
}

/**
 * Get ad size string for responsive rendering
 */
export function getAdSize(
  placement: WebAdPlacement,
  isMobile: boolean
): string {
  const unit = AD_PLACEMENTS[placement];
  if (!unit) {
    return '';
  }

  return isMobile ? unit.mobileSize : unit.desktopSize;
}

/**
 * Check if ad is visible on mobile
 */
export function isAdVisibleOnMobile(placement: WebAdPlacement): boolean {
  const unit = AD_PLACEMENTS[placement];
  if (!unit) {
    return false;
  }

  return unit.mobileSize.length > 0;
}

/**
 * Check if ad is visible on desktop
 */
export function isAdVisibleOnDesktop(placement: WebAdPlacement): boolean {
  const unit = AD_PLACEMENTS[placement];
  if (!unit) {
    return false;
  }

  return unit.desktopSize.length > 0;
}

/**
 * Ad display configuration for rendering
 */
export interface AdDisplayConfig {
  placement: WebAdPlacement;
  tier: UserTier;
  shouldShow: boolean;
  size: string;
  adSlot: string;
  maxImpressions: number;
  dismissible: boolean;
  frequency: string;
}

/**
 * Get complete ad display config for rendering
 */
export function getAdDisplayConfig(
  placement: WebAdPlacement,
  tier: UserTier,
  isMobile: boolean
): AdDisplayConfig {
  const unit = AD_PLACEMENTS[placement];
  if (!unit) {
    return {
      placement,
      tier,
      shouldShow: false,
      size: '',
      adSlot: '',
      maxImpressions: 0,
      dismissible: false,
      frequency: 'always',
    };
  }

  const shouldShow = shouldShowAd(placement, tier);

  return {
    placement,
    tier,
    shouldShow,
    size: getAdSize(placement, isMobile),
    adSlot: getAdSlot(placement),
    maxImpressions: unit.maxImpressionsPerSession,
    dismissible: unit.dismissible,
    frequency: unit.frequency,
  };
}

/**
 * Environment variables required for ad system
 */
export const REQUIRED_AD_ENV_VARS = [
  'VITE_ADSENSE_PUBLISHER_ID',
  'VITE_ADSENSE_SLOT',
  'VITE_ADSENSE_SLOT_HEADER',
  'VITE_ADSENSE_SLOT_SIDEBAR',
  'VITE_ADSENSE_SLOT_MAINTENANCEHISTORY',
  'VITE_ADSENSE_SLOT_PROVIDERDIRECTORY',
  'VITE_ADSENSE_SLOT_REMINDERNOTIFICATION',
  'VITE_ADSENSE_SLOT_EXPORTREPORT',
  'VITE_AD_IMPRESSIONS_TRACKING',
  'VITE_AD_CLICK_TRACKING',
];

/**
 * Check if ad system is properly configured
 */
export function isAdSystemConfigured(): boolean {
  return (
    Boolean(import.meta.env.VITE_ADSENSE_PUBLISHER_ID) &&
    Boolean(import.meta.env.VITE_ADSENSE_SLOT)
  );
}

/**
 * Get configuration status for debugging
 */
export function getAdSystemStatus(): {
  configured: boolean;
  publisherId: string;
  placementsConfigured: Record<WebAdPlacement, boolean>;
  trackingEnabled: boolean;
} {
  return {
    configured: isAdSystemConfigured(),
    publisherId: String(import.meta.env.VITE_ADSENSE_PUBLISHER_ID || 'NOT_SET'),
    placementsConfigured: {
      header: Boolean(placementSlotMap.header),
      sidebar: Boolean(placementSlotMap.sidebar),
      maintenanceHistory: Boolean(placementSlotMap.maintenanceHistory),
      providerDirectory: Boolean(placementSlotMap.providerDirectory),
      reminderNotification: Boolean(placementSlotMap.reminderNotification),
      exportReport: Boolean(placementSlotMap.exportReport),
    },
    trackingEnabled: import.meta.env.VITE_AD_IMPRESSIONS_TRACKING === 'true',
  };
}
