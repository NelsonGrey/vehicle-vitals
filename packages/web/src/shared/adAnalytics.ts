/**
 * Ad Analytics Service
 * Tracks ad impressions, clicks, and conversions
 * Integrates with Google Analytics and custom analytics
 */

import { logEvent } from 'firebase/analytics';
import type { UserTier } from './featureFlags';
import { analytics } from './firebaseConfig';

export type AdPlacement =
  | 'header'
  | 'sidebar'
  | 'maintenanceHistory'
  | 'providerDirectory'
  | 'reminderNotification'
  | 'exportReport';

export interface AdEvent {
  placement: AdPlacement;
  tier: UserTier;
  eventType: 'impression' | 'click' | 'conversion' | 'error';
  advertiserId?: string;
  campaignId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Track ad impression
 */
export function trackAdImpression(
  placement: AdPlacement,
  tier: UserTier,
  advertiserId?: string
): void {
  try {
    const event: AdEvent = {
      placement,
      tier,
      eventType: 'impression',
      advertiserId,
      timestamp: Date.now(),
    };

    // Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'ad_impression', {
        placement,
        tier,
        advertiser_id: advertiserId || 'unknown',
      });
    }

    // Local analytics
    recordAdEvent(event);
  } catch (error) {
    console.error('Error tracking ad impression:', error);
  }
}

/**
 * Track ad click
 */
export function trackAdClick(
  placement: AdPlacement,
  tier: UserTier,
  advertiserId?: string,
  campaignId?: string
): void {
  try {
    const event: AdEvent = {
      placement,
      tier,
      eventType: 'click',
      advertiserId,
      campaignId,
      timestamp: Date.now(),
    };

    // Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'ad_click', {
        placement,
        tier,
        advertiser_id: advertiserId || 'unknown',
        campaign_id: campaignId || 'unknown',
      });
    }

    // Local analytics
    recordAdEvent(event);
  } catch (error) {
    console.error('Error tracking ad click:', error);
  }
}

/**
 * Track tier change
 */
export function trackTierChange(
  oldTier: UserTier,
  newTier: UserTier,
  upgradeSource?: string
): void {
  try {
    if (analytics) {
      logEvent(analytics, 'tier_upgraded', {
        old_tier: oldTier,
        new_tier: newTier,
        source: upgradeSource || 'unknown',
      });
    }
  } catch (error) {
    console.error('Error tracking tier change:', error);
  }
}

/**
 * Track feature access denied (blocked by tier)
 */
export function trackFeatureDenied(
  featureName: string,
  tier: UserTier,
  requiredTier: UserTier
): void {
  try {
    if (analytics) {
      logEvent(analytics, 'feature_access_denied', {
        feature: featureName,
        user_tier: tier,
        required_tier: requiredTier,
      });
    }
  } catch (error) {
    console.error('Error tracking feature denied:', error);
  }
}

/**
 * Track subscription page view
 */
export function trackSubscriptionPageView(
  source: string,
  fromTier?: UserTier
): void {
  try {
    if (analytics) {
      logEvent(analytics, 'subscription_page_viewed', {
        source,
        from_tier: fromTier || 'unknown',
      });
    }
  } catch (error) {
    console.error('Error tracking subscription page view:', error);
  }
}

/**
 * Track upgrade modal shown
 */
export function trackUpgradeModalShown(trigger: string, tier: UserTier): void {
  try {
    if (analytics) {
      logEvent(analytics, 'upgrade_modal_shown', {
        trigger,
        current_tier: tier,
      });
    }
  } catch (error) {
    console.error('Error tracking upgrade modal:', error);
  }
}

/**
 * Track upgrade modal action
 */
export function trackUpgradeModalAction(
  action: 'closed' | 'upgrade_clicked' | 'learn_more_clicked',
  targetTier: UserTier,
  currentTier: UserTier
): void {
  try {
    if (analytics) {
      logEvent(analytics, 'upgrade_modal_action', {
        action,
        target_tier: targetTier,
        current_tier: currentTier,
      });
    }
  } catch (error) {
    console.error('Error tracking upgrade modal action:', error);
  }
}

/**
 * Track payment flow initiated
 */
export function trackPaymentInitiated(
  targetTier: UserTier,
  billingPeriod: 'monthly' | 'annual',
  source: string
): void {
  try {
    if (analytics) {
      logEvent(analytics, 'payment_initiated', {
        target_tier: targetTier,
        billing_period: billingPeriod,
        source,
      });
    }
  } catch (error) {
    console.error('Error tracking payment initiated:', error);
  }
}

/**
 * Track payment completed
 */
export function trackPaymentCompleted(
  tier: UserTier,
  amount: number,
  currency: string,
  billingPeriod: 'monthly' | 'annual'
): void {
  try {
    if (analytics) {
      logEvent(analytics, 'payment_completed', {
        tier,
        value: amount,
        currency,
        billing_period: billingPeriod,
      });
    }
  } catch (error) {
    console.error('Error tracking payment completed:', error);
  }
}

/**
 * Record ad event locally (for future analytics backend)
 * Currently buffers in memory; can be extended to send to custom endpoint
 */
const adEventBuffer: AdEvent[] = [];
const MAX_BUFFER_SIZE = 100;

function recordAdEvent(event: AdEvent): void {
  adEventBuffer.push(event);

  // Keep buffer size manageable
  if (adEventBuffer.length > MAX_BUFFER_SIZE) {
    adEventBuffer.shift();
  }

  // Optional: Send to backend if buffer reaches threshold
  if (adEventBuffer.length % 25 === 0) {
    flushAdEvents();
  }
}

/**
 * Flush ad events to backend
 * Called periodically or on app exit
 */
async function flushAdEvents(): Promise<void> {
  if (adEventBuffer.length === 0) {
    return;
  }

  const eventsToSend = [...adEventBuffer];
  adEventBuffer.length = 0;

  try {
    // TODO: Send to Cloud Function or analytics backend
    // await fetch('/.netlify/functions/recordAdEvents', {
    //   method: 'POST',
    //   body: JSON.stringify({ events: eventsToSend }),
    // });
  } catch (error) {
    console.error('Error flushing ad events:', error);
    // Re-add events to buffer on failure
    adEventBuffer.unshift(...eventsToSend);
  }
}

/**
 * Get ad performance metrics
 */
export interface AdMetrics {
  placement: AdPlacement;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  avgCpm: number;
}

export function getAdMetrics(): Map<AdPlacement, AdMetrics> {
  const metrics = new Map<AdPlacement, AdMetrics>();

  for (const event of adEventBuffer) {
    if (!metrics.has(event.placement)) {
      metrics.set(event.placement, {
        placement: event.placement,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        avgCpm: 0,
      });
    }

    const metric = metrics.get(event.placement)!;

    if (event.eventType === 'impression') {
      metric.impressions++;
    } else if (event.eventType === 'click') {
      metric.clicks++;
    }

    // Update CTR
    if (metric.impressions > 0) {
      metric.ctr = (metric.clicks / metric.impressions) * 100;
    }
  }

  return metrics;
}

/**
 * Setup page visibility listener to flush events on page exit
 */
export function setupAdAnalyticsCleanup(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      flushAdEvents();
    }
  });

  // Also flush on page unload
  window.addEventListener('beforeunload', () => {
    flushAdEvents();
  });
}
