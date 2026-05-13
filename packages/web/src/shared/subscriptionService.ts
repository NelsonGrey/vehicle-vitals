/**
 * Subscription Service
 * Manages user subscription state, tier, and status
 * Syncs with Firestore and provides reactive hooks
 */

import {
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import type { UserTier } from './featureFlags';
import { db } from './firebaseConfig';

export interface SubscriptionData {
  tier: UserTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  currentPeriodStart: Timestamp | null;
  currentPeriodEnd: Timestamp | null;
  renewalDate: Timestamp | null;
  autoRenew: boolean;
  trialEndDate: Timestamp | null;
  paymentMethod: 'stripe' | 'app_store' | 'play_store' | null;
  lastPaymentError: string | null;
  updatedAt: Timestamp;
  // Metadata
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export const DEFAULT_SUBSCRIPTION: SubscriptionData = {
  tier: 'free',
  status: 'active',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  renewalDate: null,
  autoRenew: false,
  trialEndDate: null,
  paymentMethod: null,
  lastPaymentError: null,
  updatedAt: Timestamp.now(),
};

/**
 * Get subscription data for a user
 * Returns default free tier if no subscription document exists
 */
export async function getSubscription(
  userId: string
): Promise<SubscriptionData> {
  try {
    const subDocRef = doc(db, 'users', userId, 'subscription', 'current');
    const docSnap = await getDoc(subDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as SubscriptionData;
    }

    // No subscription document = free tier
    return DEFAULT_SUBSCRIPTION;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return DEFAULT_SUBSCRIPTION;
  }
}

/**
 * Watch subscription data in real-time
 * Returns unsubscribe function
 */
export function watchSubscription(
  userId: string,
  onSubscriptionChange: (sub: SubscriptionData) => void
): () => void {
  const subDocRef = doc(db, 'users', userId, 'subscription', 'current');

  return onSnapshot(
    subDocRef,
    docSnap => {
      if (docSnap.exists()) {
        onSubscriptionChange(docSnap.data() as SubscriptionData);
      } else {
        onSubscriptionChange(DEFAULT_SUBSCRIPTION);
      }
    },
    error => {
      console.error('Error watching subscription:', error);
      onSubscriptionChange(DEFAULT_SUBSCRIPTION);
    }
  );
}

/**
 * Check if subscription is active and not expired
 */
export function isSubscriptionActive(sub: SubscriptionData): boolean {
  if (sub.tier === 'free') {
    return true; // Free tier is always "active"
  }

  const now = new Date();
  const renewalDate = sub.renewalDate?.toDate();

  // If renewal date hasn't passed, subscription is active
  if (renewalDate && now < renewalDate) {
    return true;
  }

  // Check if in grace period or trial
  return sub.status === 'trialing' || sub.status === 'past_due';
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(sub: SubscriptionData): boolean {
  if (sub.tier === 'free') {
    return false; // Free tier never expires
  }

  const now = new Date();
  const renewalDate = sub.renewalDate?.toDate();

  return renewalDate ? now > renewalDate : false;
}

/**
 * Check if user is in trial period
 */
export function isInTrial(sub: SubscriptionData): boolean {
  if (!sub.trialEndDate) {
    return false;
  }

  const now = new Date();
  const trialEnd = sub.trialEndDate.toDate();

  return now < trialEnd && sub.status === 'trialing';
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(sub: SubscriptionData): number {
  if (!isInTrial(sub)) {
    return 0;
  }

  const now = new Date();
  const trialEnd = sub.trialEndDate!.toDate();
  const daysMs = trialEnd.getTime() - now.getTime();

  return Math.ceil(daysMs / (1000 * 60 * 60 * 24));
}

/**
 * Get days remaining until renewal
 */
export function getDaysUntilRenewal(sub: SubscriptionData): number {
  if (!sub.renewalDate || sub.tier === 'free') {
    return 0;
  }

  const now = new Date();
  const renewalDate = sub.renewalDate.toDate();
  const daysMs = renewalDate.getTime() - now.getTime();

  return Math.ceil(daysMs / (1000 * 60 * 60 * 24));
}

/**
 * Update subscription tier (backend-only, called by Cloud Functions)
 * @internal - For backend use only, not to be called from client
 */
export async function updateSubscriptionTier(
  userId: string,
  tier: UserTier,
  metadata: Partial<SubscriptionData>
): Promise<void> {
  try {
    const subDocRef = doc(db, 'users', userId, 'subscription', 'current');

    await updateDoc(subDocRef, {
      tier,
      ...metadata,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating subscription tier:', error);
    throw error;
  }
}

/**
 * Get formatted renewal date for display
 */
export function getFormattedRenewalDate(sub: SubscriptionData): string {
  if (!sub.renewalDate) {
    return 'N/A';
  }

  const date = sub.renewalDate.toDate();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get formatted subscription status for display
 */
export function getSubscriptionStatusDisplay(sub: SubscriptionData): string {
  if (sub.tier === 'free') {
    return 'Free Account';
  }

  if (isInTrial(sub)) {
    const daysLeft = getTrialDaysRemaining(sub);
    return `${daysLeft}-day trial (${daysLeft === 1 ? 'last day' : daysLeft + ' days remaining'})`;
  }

  switch (sub.status) {
    case 'active':
      const daysUntil = getDaysUntilRenewal(sub);
      return `Active • Renews in ${daysUntil} days`;
    case 'past_due':
      return 'Payment Issue • Update required';
    case 'canceled':
      return 'Canceled';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
}

/**
 * Get subscription summary for UI display
 */
export interface SubscriptionSummary {
  tier: UserTier;
  isActive: boolean;
  isExpired: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  renewalDaysRemaining: number;
  displayStatus: string;
  renewalDate: string;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export function getSubscriptionSummary(
  sub: SubscriptionData
): SubscriptionSummary {
  return {
    tier: sub.tier,
    isActive: isSubscriptionActive(sub),
    isExpired: isSubscriptionExpired(sub),
    isInTrial: isInTrial(sub),
    trialDaysRemaining: getTrialDaysRemaining(sub),
    renewalDaysRemaining: getDaysUntilRenewal(sub),
    displayStatus: getSubscriptionStatusDisplay(sub),
    renewalDate: getFormattedRenewalDate(sub),
    canUpgrade: sub.tier !== 'premium',
    canDowngrade: sub.tier !== 'free',
  };
}

/**
 * Format subscription tier with icon/emoji for UI
 */
export function getTierBadge(tier: UserTier): {
  name: string;
  badge: string;
  color: string;
} {
  switch (tier) {
    case 'free':
      return { name: 'Free', badge: '✨', color: 'gray' };
    case 'pro':
      return { name: 'Pro', badge: '⭐', color: 'blue' };
    case 'premium':
      return { name: 'Premium', badge: '👑', color: 'purple' };
    default:
      return { name: 'Free', badge: '✨', color: 'gray' };
  }
}
