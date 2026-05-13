/**
 * Feature Flag System
 * Enables/disables features per user tier and tracks quotas
 *
 * Usage:
 * const isEnabled = useFeatureFlag('calendar_sync', userTier);
 * const hasQuota = useFeatureFlag('ai_analysis', userTier, { quota: 5 });
 */

export type UserTier = 'free' | 'pro' | 'premium';

export interface FeatureFlagConfig {
  name: string;
  enabledFor: UserTier[];
  quota?: {
    limit: number;
    resetPeriod: 'monthly' | 'daily' | 'none';
  };
  description: string;
}

/**
 * Feature flag definitions - source of truth for all tier-based features
 */
export const FEATURE_FLAGS: Record<string, FeatureFlagConfig> = {
  // Vehicle management
  vehicle_limit: {
    name: 'vehicle_limit',
    enabledFor: ['free', 'pro', 'premium'],
    description: 'Maximum number of vehicles user can track',
  },

  // Reminder features
  advanced_reminders: {
    name: 'advanced_reminders',
    enabledFor: ['pro', 'premium'],
    description: 'Time-based + AI predictive reminders (vs. mileage-only)',
  },

  // Calendar integration
  calendar_sync: {
    name: 'calendar_sync',
    enabledFor: ['pro', 'premium'],
    description: 'Sync maintenance events to Google Calendar, Outlook, etc.',
  },

  // AI-powered features
  ai_analysis: {
    name: 'ai_analysis',
    enabledFor: ['pro', 'premium'],
    quota: {
      limit: 5, // Pro: 5/month; Premium: unlimited (handled separately)
      resetPeriod: 'monthly',
    },
    description: 'AI document analysis and receipt scanning',
  },

  ai_predictions: {
    name: 'ai_predictions',
    enabledFor: ['premium'],
    description: 'AI-powered predictive maintenance recommendations',
  },

  // Exports and data
  pdf_export: {
    name: 'pdf_export',
    enabledFor: ['pro', 'premium'],
    description: 'Export maintenance records as PDF',
  },

  excel_export: {
    name: 'excel_export',
    enabledFor: ['pro', 'premium'],
    description: 'Export maintenance records as Excel',
  },

  cloud_sync: {
    name: 'cloud_sync',
    enabledFor: ['premium'],
    description: 'Cloud backup and cross-device sync for exports',
  },

  // Maintenance planning
  maintenance_planning_12mo: {
    name: 'maintenance_planning_12mo',
    enabledFor: ['pro', 'premium'],
    description: '12-month maintenance forecast',
  },

  maintenance_planning_36mo: {
    name: 'maintenance_planning_36mo',
    enabledFor: ['premium'],
    description: '36-month maintenance forecast with alerts',
  },

  // Ads
  ad_free: {
    name: 'ad_free',
    enabledFor: ['premium'],
    description: 'Completely ad-free experience',
  },

  reduced_ads: {
    name: 'reduced_ads',
    enabledFor: ['pro', 'premium'],
    description: 'Reduced ad density (1-2 placements vs 3-5)',
  },

  // Support
  priority_support: {
    name: 'priority_support',
    enabledFor: ['pro', 'premium'],
    description: 'Priority email support (vs community only)',
  },

  phone_support: {
    name: 'phone_support',
    enabledFor: ['premium'],
    description: 'Phone + email support',
  },

  // Multi-vehicle
  multi_vehicle_dashboard: {
    name: 'multi_vehicle_dashboard',
    enabledFor: ['pro', 'premium'],
    description: 'Single dashboard view of all vehicles',
  },

  // API access
  api_access: {
    name: 'api_access',
    enabledFor: ['premium'],
    description: 'REST API for custom integrations',
  },

  zapier_integration: {
    name: 'zapier_integration',
    enabledFor: ['premium'],
    description: 'Zapier and IFTTT automation integrations',
  },
};

/**
 * Get vehicle limit for a given tier
 */
export function getVehicleLimit(tier: UserTier): number {
  switch (tier) {
    case 'free':
      return 3;
    case 'pro':
      return 10;
    case 'premium':
      return 999; // Effectively unlimited
    default:
      return 3;
  }
}

/**
 * Check if a feature is enabled for a given tier
 * @param featureName - Feature flag name
 * @param tier - User tier
 * @returns true if feature is enabled for this tier
 */
export function isFeatureEnabled(featureName: string, tier: UserTier): boolean {
  const flag = FEATURE_FLAGS[featureName];
  if (!flag) {
    console.warn(`Unknown feature flag: ${featureName}`);
    return false;
  }
  return flag.enabledFor.includes(tier);
}

/**
 * Get quota limit for a feature (if applicable)
 * @param featureName - Feature flag name
 * @param tier - User tier
 * @returns quota limit, or null if no quota applies
 */
export function getQuotaLimit(
  featureName: string,
  tier: UserTier
): number | null {
  const flag = FEATURE_FLAGS[featureName];
  if (!flag || !flag.quota) {
    return null;
  }

  // Premium users get unlimited quota for certain features
  if (
    tier === 'premium' &&
    ['ai_analysis', 'receipt_uploads'].includes(featureName)
  ) {
    return 999999; // Effectively unlimited
  }

  return flag.quota.limit;
}

/**
 * Get tier rank (for comparison: premium > pro > free)
 */
export function getTierRank(tier: UserTier): number {
  switch (tier) {
    case 'premium':
      return 3;
    case 'pro':
      return 2;
    case 'free':
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if a tier can access a feature (accounting for quotas)
 */
export function canAccessFeature(
  featureName: string,
  tier: UserTier,
  currentUsage?: number
): boolean {
  if (!isFeatureEnabled(featureName, tier)) {
    return false;
  }

  // If no usage tracking, just check if enabled
  if (currentUsage === undefined) {
    return true;
  }

  const limit = getQuotaLimit(featureName, tier);
  if (limit === null) {
    return true; // No quota limit
  }

  return currentUsage < limit;
}

/**
 * List all available features for a tier
 */
export function getAvailableFeaturesForTier(
  tier: UserTier
): FeatureFlagConfig[] {
  return Object.values(FEATURE_FLAGS).filter(flag =>
    flag.enabledFor.includes(tier)
  );
}

/**
 * Compare features between tiers (for UI display)
 */
export function compareFeatures(
  featureName: string
): Record<UserTier, boolean> {
  return {
    free: isFeatureEnabled(featureName, 'free'),
    pro: isFeatureEnabled(featureName, 'pro'),
    premium: isFeatureEnabled(featureName, 'premium'),
  };
}

/**
 * Get human-readable tier name
 */
export function getTierDisplayName(tier: UserTier): string {
  switch (tier) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'premium':
      return 'Premium';
    default:
      return 'Unknown';
  }
}

/**
 * Tier pricing information
 */
export interface TierPricing {
  tier: UserTier;
  monthlyPrice: number;
  annualPrice: number;
  monthlyDisplayPrice: string;
  annualDisplayPrice: string;
  annualSavings: string;
}

export const TIER_PRICING: Record<UserTier, TierPricing> = {
  free: {
    tier: 'free',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyDisplayPrice: 'Free',
    annualDisplayPrice: 'Free',
    annualSavings: '',
  },
  pro: {
    tier: 'pro',
    monthlyPrice: 2.99,
    annualPrice: 29.99,
    monthlyDisplayPrice: '$2.99/month',
    annualDisplayPrice: '$29.99/year',
    annualSavings: 'Save $6 vs monthly',
  },
  premium: {
    tier: 'premium',
    monthlyPrice: 6.99,
    annualPrice: 69.99,
    monthlyDisplayPrice: '$6.99/month',
    annualDisplayPrice: '$69.99/year',
    annualSavings: 'Save $14 vs monthly',
  },
};

/**
 * Get pricing information for a tier
 */
export function getTierPricing(tier: UserTier): TierPricing {
  return TIER_PRICING[tier] || TIER_PRICING['free'];
}

/**
 * Validation: Check if tier is valid
 */
export function isValidTier(tier: any): tier is UserTier {
  return ['free', 'pro', 'premium'].includes(tier);
}
