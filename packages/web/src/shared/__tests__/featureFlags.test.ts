import { describe, expect, it } from 'vitest';
import {
  canAccessFeature,
  compareFeatures,
  getQuotaLimit,
  getTierPricing,
  getVehicleLimit,
  isFeatureEnabled,
} from '../featureFlags';

describe('featureFlags monetization rules', () => {
  it('enables and disables features by tier', () => {
    expect(isFeatureEnabled('calendar_sync', 'free')).toBe(false);
    expect(isFeatureEnabled('calendar_sync', 'pro')).toBe(true);
    expect(isFeatureEnabled('calendar_sync', 'enterprise')).toBe(true);
    expect(isFeatureEnabled('ai_analysis', 'free')).toBe(false);
    expect(isFeatureEnabled('ai_analysis', 'pro')).toBe(true);
    expect(isFeatureEnabled('ai_analysis', 'enterprise')).toBe(true);
    expect(isFeatureEnabled('api_access', 'pro')).toBe(false);
    expect(isFeatureEnabled('api_access', 'premium')).toBe(true);
    expect(isFeatureEnabled('api_access', 'enterprise')).toBe(true);
  });

  it('enforces expected vehicle limits', () => {
    expect(getVehicleLimit('free')).toBe(2);
    expect(getVehicleLimit('pro')).toBe(10);
    expect(getVehicleLimit('premium')).toBe(25);
    expect(getVehicleLimit('enterprise')).toBe(999999);
  });

  it('returns quota limits with premium override', () => {
    expect(getQuotaLimit('ai_analysis', 'pro')).toBe(5);
    expect(getQuotaLimit('ai_analysis', 'premium')).toBe(999999);
    expect(getQuotaLimit('ai_analysis', 'enterprise')).toBe(999999);
    expect(getQuotaLimit('calendar_sync', 'pro')).toBeNull();
  });

  it('checks access with quotas correctly', () => {
    expect(canAccessFeature('ai_analysis', 'pro', 0)).toBe(true);
    expect(canAccessFeature('ai_analysis', 'pro', 4)).toBe(true);
    expect(canAccessFeature('ai_analysis', 'pro', 5)).toBe(false);
    expect(canAccessFeature('calendar_sync', 'free')).toBe(false);
  });

  it('compares feature availability across tiers', () => {
    expect(compareFeatures('ad_free')).toEqual({
      free: false,
      pro: false,
      premium: true,
      enterprise: true,
    });
  });

  it('exposes enterprise pricing descriptor', () => {
    const enterprisePricing = getTierPricing('enterprise');
    expect(enterprisePricing.monthlyDisplayPrice).toBe('Custom pricing');
  });

  it('exposes pricing for paid plans', () => {
    const proPricing = getTierPricing('pro');
    const premiumPricing = getTierPricing('premium');

    expect(proPricing.monthlyPrice).toBe(2.99);
    expect(proPricing.annualPrice).toBe(29.99);
    expect(premiumPricing.monthlyPrice).toBe(6.99);
    expect(premiumPricing.annualPrice).toBe(69.99);
  });
});
