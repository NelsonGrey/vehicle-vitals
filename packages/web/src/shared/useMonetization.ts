/**
 * React Hooks for Monetization Features
 * Provides convenient hooks for using feature flags, subscriptions, and ads in components
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  trackFeatureDenied,
  trackSubscriptionPageView,
  trackUpgradeModalShown,
} from './adAnalytics';
import { useAuth } from './AuthContext';
import {
  canAccessFeature,
  getVehicleLimit,
  isFeatureEnabled,
  type UserTier,
} from './featureFlags';
import {
  watchSubscription,
  type SubscriptionData,
} from './subscriptionService';

/**
 * Hook: Get user's subscription data
 * Automatically refetches on user change
 */
export function useSubscription(): {
  subscription: SubscriptionData | null;
  tier: UserTier;
  isLoading: boolean;
  error: Error | null;
} {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Watch subscription in real-time
    const unsubscribe = watchSubscription(user.uid, sub => {
      setSubscription(sub);
      setIsLoading(false);
      setError(null);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [user]);

  return {
    subscription,
    tier: subscription?.tier || 'free',
    isLoading,
    error,
  };
}

/**
 * Hook: Check if a feature is available for current user
 * Automatically handles subscription loading and updates
 */
export function useFeatureFlag(
  featureName: string,
  options?: { onDenied?: () => void }
): boolean {
  const { tier, subscription } = useSubscription();
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const enabled = isFeatureEnabled(featureName, tier);
    setIsEnabled(enabled);

    // Track if user is denied access
    if (!enabled && user) {
      trackFeatureDenied(featureName, tier, tier);
      options?.onDenied?.();
    }
  }, [featureName, tier, user, options]);

  return isEnabled;
}

/**
 * Hook: Get vehicle limit for current tier
 */
export function useVehicleLimit(): number {
  const { tier } = useSubscription();
  return getVehicleLimit(tier);
}

/**
 * Hook: Check if user can access a feature with quota
 */
export function useCanAccessFeatureWithQuota(
  featureName: string,
  currentUsage: number,
  onQuotaExceeded?: () => void
): boolean {
  const { tier } = useSubscription();

  const canAccess = canAccessFeature(featureName, tier, currentUsage);

  useEffect(() => {
    if (!canAccess && currentUsage > 0) {
      onQuotaExceeded?.();
    }
  }, [canAccess, currentUsage, onQuotaExceeded]);

  return canAccess;
}

/**
 * Hook: Show upgrade prompt when user tries to access premium feature
 * Automatically tracks analytics events
 */
export function useUpgradePrompt(): {
  shouldShowModal: boolean;
  targetTier: UserTier | null;
  requiredTier: UserTier;
  trigger: string | null;
  openUpgradeModal: (requiredTier: UserTier, trigger: string) => void;
  closeUpgradeModal: () => void;
} {
  const { tier } = useSubscription();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [targetTier, setTargetTier] = useState<UserTier | null>(null);
  const [trigger, setTrigger] = useState<string | null>(null);

  const requiredTier: UserTier = targetTier || 'pro';

  const openUpgradeModal = (requiredTier: UserTier, triggerName: string) => {
    if (tier === 'premium' || (tier === 'pro' && requiredTier !== 'premium')) {
      // User already has access
      return;
    }

    setTargetTier(requiredTier);
    setTrigger(triggerName);
    setShouldShowModal(true);

    // Track analytics
    trackUpgradeModalShown(triggerName, tier);
  };

  const closeUpgradeModal = () => {
    setShouldShowModal(false);
    setTargetTier(null);
    setTrigger(null);
  };

  return {
    shouldShowModal,
    targetTier,
    requiredTier,
    trigger,
    openUpgradeModal,
    closeUpgradeModal,
  };
}

/**
 * Hook: Navigate to subscription page with tracking
 */
export function useNavigateToSubscription(): (source: string) => void {
  const { tier } = useSubscription();
  const navigate = useNavigate();

  return (source: string) => {
    trackSubscriptionPageView(source, tier);
    navigate('/app/subscription');
  };
}

/**
 * Hook: Check if feature is available (for conditional rendering)
 */
export function useIfFeatureAvailable(featureName: string): {
  isAvailable: boolean;
  tier: UserTier;
  openUpgrade: (trigger: string) => void;
} {
  const { tier } = useSubscription();
  const { shouldShowModal, openUpgradeModal, closeUpgradeModal } =
    useUpgradePrompt();
  const isAvailable = isFeatureEnabled(featureName, tier);

  return {
    isAvailable,
    tier,
    openUpgrade: (trigger: string) => {
      const requiredTier = tier === 'free' ? 'pro' : 'premium';
      openUpgradeModal(requiredTier, trigger);
    },
  };
}

/**
 * Hook: Determine ad count for current tier (for responsive layout)
 */
export function useAdCount(): number {
  const { tier } = useSubscription();

  switch (tier) {
    case 'free':
      return 3; // to 5 ads per page
    case 'pro':
      return 1; // to 2 ads per page
    case 'premium':
      return 0; // Ad-free
    default:
      return 3;
  }
}
