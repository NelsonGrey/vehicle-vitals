import { describe, expect, it } from 'vitest';
import {
  getAdMetrics,
  trackAdClick,
  trackAdImpression,
  type AdPlacement,
} from '../adAnalytics';

function getCounts(placement: AdPlacement) {
  const metrics = getAdMetrics().get(placement);
  return {
    impressions: metrics?.impressions ?? 0,
    clicks: metrics?.clicks ?? 0,
  };
}

describe('adAnalytics local metrics buffer', () => {
  it('records impressions and clicks for a placement', () => {
    const placement: AdPlacement = 'header';
    const before = getCounts(placement);

    trackAdImpression(placement, 'free', 'adv-1');
    trackAdClick(placement, 'free', 'adv-1', 'cmp-1');

    const after = getCounts(placement);
    expect(after.impressions).toBe(before.impressions + 1);
    expect(after.clicks).toBe(before.clicks + 1);
  });

  it('computes CTR from buffered events', () => {
    const placement: AdPlacement = 'exportReport';

    // Add at least two impressions and one click for a deterministic floor.
    trackAdImpression(placement, 'free');
    trackAdImpression(placement, 'free');
    trackAdClick(placement, 'free');

    const metric = getAdMetrics().get(placement);
    expect(metric).toBeDefined();
    expect(metric!.impressions).toBeGreaterThanOrEqual(2);
    expect(metric!.clicks).toBeGreaterThanOrEqual(1);
    expect(metric!.ctr).toBeGreaterThan(0);
  });
});
