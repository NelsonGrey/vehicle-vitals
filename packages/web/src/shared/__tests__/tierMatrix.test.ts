import { describe, expect, it } from 'vitest';

import {
  compareFeatures,
  getAvailableFeaturesForTier,
  getTierDisplayName,
  getTierPricing,
  getVehicleLimit,
  isValidTier,
} from '../featureFlags';

const expectedFeaturesByTier = {
  free: ['vehicle_limit'],
  pro: [
    'vehicle_limit',
    'advanced_reminders',
    'calendar_sync',
    'ai_analysis',
    'pdf_export',
    'excel_export',
    'maintenance_planning_12mo',
    'reduced_ads',
    'priority_support',
    'multi_vehicle_dashboard',
  ],
  premium: [
    'vehicle_limit',
    'advanced_reminders',
    'calendar_sync',
    'ai_analysis',
    'ai_predictions',
    'pdf_export',
    'excel_export',
    'cloud_sync',
    'maintenance_planning_12mo',
    'maintenance_planning_36mo',
    'ad_free',
    'reduced_ads',
    'priority_support',
    'phone_support',
    'multi_vehicle_dashboard',
    'api_access',
    'zapier_integration',
  ],
  enterprise: [
    'vehicle_limit',
    'advanced_reminders',
    'calendar_sync',
    'ai_analysis',
    'ai_predictions',
    'pdf_export',
    'excel_export',
    'cloud_sync',
    'maintenance_planning_12mo',
    'maintenance_planning_36mo',
    'ad_free',
    'reduced_ads',
    'priority_support',
    'phone_support',
    'multi_vehicle_dashboard',
    'api_access',
    'zapier_integration',
  ],
} as const;

describe('tier matrix', () => {
  it('maps the known tiers to the expected display names', () => {
    expect(getTierDisplayName('free')).toBe('Free');
    expect(getTierDisplayName('pro')).toBe('Pro');
    expect(getTierDisplayName('premium')).toBe('Premium');
    expect(getTierDisplayName('enterprise')).toBe('Enterprise');
  });

  it('keeps the expected vehicle limits intact', () => {
    expect(getVehicleLimit('free')).toBe(2);
    expect(getVehicleLimit('pro')).toBe(10);
    expect(getVehicleLimit('premium')).toBe(25);
    expect(getVehicleLimit('enterprise')).toBe(999999);
  });

  it('keeps the expected pricing descriptors intact', () => {
    expect(getTierPricing('free')).toMatchObject({
      monthlyDisplayPrice: 'Free',
      annualDisplayPrice: 'Free',
    });
    expect(getTierPricing('enterprise')).toMatchObject({
      monthlyDisplayPrice: 'Custom pricing',
      annualDisplayPrice: 'Annual contract',
    });
  });

  it('exposes the full feature matrix by tier', () => {
    for (const [tier, expectedFeatures] of Object.entries(
      expectedFeaturesByTier
    )) {
      const actualFeatures = getAvailableFeaturesForTier(
        tier as keyof typeof expectedFeaturesByTier
      )
        .map(feature => feature.name)
        .sort();

      expect(actualFeatures).toEqual([...expectedFeatures].sort());
    }
  });

  it('keeps tier comparisons aligned with plan expectations', () => {
    expect(compareFeatures('ad_free')).toEqual({
      free: false,
      pro: false,
      premium: true,
      enterprise: true,
    });

    expect(compareFeatures('calendar_sync')).toEqual({
      free: false,
      pro: true,
      premium: true,
      enterprise: true,
    });
  });

  it('accepts the supported monetization tiers only', () => {
    expect(isValidTier('free')).toBe(true);
    expect(isValidTier('pro')).toBe(true);
    expect(isValidTier('premium')).toBe(true);
    expect(isValidTier('enterprise')).toBe(true);
    expect(isValidTier('super-admin')).toBe(false);
  });
});
