import { describe, expect, it } from 'vitest';
import {
  getActiveAdsForTier,
  getAdCountForTier,
  getAdDisplayConfig,
  shouldShowAd,
} from '../adPlacements';

describe('adPlacements tier behavior', () => {
  it('hides all ad placements for premium tier', () => {
    expect(getAdCountForTier('premium')).toBe(0);
    expect(getActiveAdsForTier('premium')).toHaveLength(0);
  });

  it('shows reduced ad placements for pro tier', () => {
    expect(shouldShowAd('header', 'pro')).toBe(true);
    expect(shouldShowAd('providerDirectory', 'pro')).toBe(true);
    expect(shouldShowAd('sidebar', 'pro')).toBe(false);
    expect(shouldShowAd('maintenanceHistory', 'pro')).toBe(false);
    expect(getAdCountForTier('pro')).toBe(2);
  });

  it('shows full placement set for free tier', () => {
    expect(shouldShowAd('header', 'free')).toBe(true);
    expect(shouldShowAd('sidebar', 'free')).toBe(true);
    expect(shouldShowAd('maintenanceHistory', 'free')).toBe(true);
    expect(shouldShowAd('providerDirectory', 'free')).toBe(true);
    expect(shouldShowAd('reminderNotification', 'free')).toBe(true);
    expect(shouldShowAd('exportReport', 'free')).toBe(true);
    expect(getAdCountForTier('free')).toBe(6);
  });

  it('builds ad display config with tier visibility', () => {
    const premiumHeader = getAdDisplayConfig('header', 'premium', false);
    const freeHeader = getAdDisplayConfig('header', 'free', false);

    expect(premiumHeader.shouldShow).toBe(false);
    expect(freeHeader.shouldShow).toBe(true);
    expect(typeof freeHeader.adSlot).toBe('string');
  });

  it('does not throw for unknown runtime placement values', () => {
    const unknownPlacement = 'inlineAuth' as any;

    expect(shouldShowAd(unknownPlacement, 'free')).toBe(false);
    expect(getAdDisplayConfig(unknownPlacement, 'free', false)).toMatchObject({
      shouldShow: false,
      maxImpressions: 0,
      dismissible: false,
    });
  });
});
