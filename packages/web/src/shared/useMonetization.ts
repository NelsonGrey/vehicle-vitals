/**
 * React Hooks for Monetization Features
 * Provides convenient hooks for using feature flags, subscriptions, and ads in components
 */

import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  trackFeatureDenied,
  trackSubscriptionPageView,
  trackUpgradeModalShown,
} from './adAnalytics';
import { useAuth } from './AuthContext';
import {
  bootstrapEnterpriseContext,
  getEffectiveEntitlements,
  type EffectiveEntitlements,
} from './entitlementsService';
import {
  canAccessFeature,
  getTierRank,
  getVehicleLimit,
  isFeatureEnabled,
  type UserTier,
} from './featureFlags';
import { db } from './firebaseConfig';
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

    // Ensure a personal organization exists for enterprise-ready entitlements.
    void bootstrapEnterpriseContext().catch(() => {
      // Keep subscription UX resilient if enterprise context is unavailable.
    });

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
 * Hook: Resolve effective entitlements from backend (tier + org + overrides)
 */
export function useEffectiveEntitlements(): {
  entitlements: EffectiveEntitlements | null;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const [entitlements, setEntitlements] =
    useState<EffectiveEntitlements | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    if (!user || !db) {
      return;
    }

    const subscriptionRef = doc(
      db,
      'users',
      user.uid,
      'subscription',
      'current'
    );
    const premiumEntitlementRef = doc(
      db,
      'users',
      user.uid,
      'entitlements',
      'premium'
    );

    const triggerRefresh = () => {
      setRefreshSignal(current => current + 1);
    };

    const unsubscribeSubscription = onSnapshot(
      subscriptionRef,
      triggerRefresh,
      triggerRefresh
    );
    const unsubscribePremium = onSnapshot(
      premiumEntitlementRef,
      triggerRefresh,
      triggerRefresh
    );

    return () => {
      unsubscribeSubscription();
      unsubscribePremium();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEntitlements(null);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    void getEffectiveEntitlements()
      .then(nextEntitlements => {
        if (!isActive) {
          return;
        }

        setEntitlements(nextEntitlements);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setEntitlements(null);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, refreshSignal]);

  return { entitlements, isLoading };
}

/**
 * Hook: Check if a feature is available for current user
 * Automatically handles subscription loading and updates
 */
export function useFeatureFlag(
  featureName: string,
  options?: { onDenied?: () => void }
): boolean {
  const { tier } = useSubscription();
  const { entitlements } = useEffectiveEntitlements();
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const enabled =
      entitlements?.features?.[featureName] ??
      isFeatureEnabled(featureName, tier);
    setIsEnabled(enabled);

    // Track if user is denied access
    if (!enabled && user) {
      trackFeatureDenied(featureName, tier, tier);
      options?.onDenied?.();
    }
  }, [featureName, tier, user, options, entitlements]);

  return isEnabled;
}

/**
 * Hook: Get vehicle limit for current tier
 */
export function useVehicleLimit(): number {
  const { tier } = useSubscription();
  const { entitlements } = useEffectiveEntitlements();
  return entitlements?.vehicleLimit || getVehicleLimit(tier);
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
    if (getTierRank(tier) >= getTierRank(requiredTier)) {
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
  const { openUpgradeModal } = useUpgradePrompt();
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
