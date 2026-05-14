/**
 * Quota Service
 * Manages and enforces tier-based quotas (uploads, AI analyses, etc.)
 *
 * Firestore schema:
 * users/{userId}/quotas/{month}
 * {
 *   month: '2026-05',  // YYYY-MM format
 *   receiptsUploaded: 3,
 *   receiptsLimit: 10,
 *   aiAnalysesUsed: 1,
 *   aiAnalysesLimit: 5,
 *   resetDate: timestamp
 * }
 */

import { Timestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { UserTier } from './featureFlags';
import { getQuotaLimit } from './featureFlags';
import { db } from './firebaseConfig';

export type QuotaType =
  | 'receiptsUpload'
  | 'aiAnalysis'
  | 'customIntegration'
  | 'apiCalls';

export interface QuotaUsage {
  quotaType: QuotaType;
  used: number;
  limit: number;
  resetDate: Date;
  tier: UserTier;
  remainingInCycle: number;
  percentageUsed: number;
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get quota document reference for a user and month
 */
function getQuotaDocRef(
  userId: string,
  monthKey: string = getCurrentMonthKey()
) {
  return doc(db, 'users', userId, 'quotas', monthKey);
}

/**
 * Initialize quota document for current month
 */
export async function initializeMonthlyQuota(
  userId: string,
  tier: UserTier
): Promise<void> {
  const monthKey = getCurrentMonthKey();
  const quotaRef = getQuotaDocRef(userId, monthKey);

  // Check if already initialized
  const existingQuota = await getDoc(quotaRef);
  if (existingQuota.exists()) {
    return; // Already initialized
  }

  // Calculate reset date (next month, same day)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const quotaData = {
    month: monthKey,
    tier,
    receiptsUploaded: 0,
    receiptsLimit: getQuotaLimit('receiptUpload', tier) || 10,
    aiAnalysesUsed: 0,
    aiAnalysesLimit: getQuotaLimit('ai_analysis', tier) || 0,
    customIntegrationsCalled: 0,
    customIntegrationsLimit: getQuotaLimit('customIntegration', tier) || 0,
    apiCallsUsed: 0,
    apiCallsLimit: getQuotaLimit('apiCalls', tier) || 0,
    resetDate: Timestamp.fromDate(nextMonth),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(quotaRef, quotaData);
}

/**
 * Check current quota usage for a quota type
 */
export async function getQuotaUsage(
  userId: string,
  quotaType: QuotaType,
  tier: UserTier
): Promise<QuotaUsage> {
  const monthKey = getCurrentMonthKey();
  const quotaRef = getQuotaDocRef(userId, monthKey);

  let quotaDoc = await getDoc(quotaRef);

  // If quota document doesn't exist, initialize it
  if (!quotaDoc.exists()) {
    await initializeMonthlyQuota(userId, tier);
    quotaDoc = await getDoc(quotaRef);
  }

  const data = quotaDoc.data() || {};
  const resetDate = data.resetDate?.toDate() || new Date();

  // Map quota type to field names
  let used = 0;
  let limit = 0;

  switch (quotaType) {
    case 'receiptsUpload':
      used = data.receiptsUploaded || 0;
      limit = data.receiptsLimit || 10;
      break;
    case 'aiAnalysis':
      used = data.aiAnalysesUsed || 0;
      limit = data.aiAnalysesLimit || 0;
      break;
    case 'customIntegration':
      used = data.customIntegrationsCalled || 0;
      limit = data.customIntegrationsLimit || 0;
      break;
    case 'apiCalls':
      used = data.apiCallsUsed || 0;
      limit = data.apiCallsLimit || 0;
      break;
  }

  const remaining = Math.max(0, limit - used);
  const percentageUsed = limit > 0 ? (used / limit) * 100 : 0;

  return {
    quotaType,
    used,
    limit,
    resetDate,
    tier,
    remainingInCycle: remaining,
    percentageUsed,
  };
}

/**
 * Check if quota is available (user hasn't exceeded limit)
 */
export async function hasQuotaAvailable(
  userId: string,
  quotaType: QuotaType,
  tier: UserTier
): Promise<boolean> {
  // Premium users have unlimited quota for most features
  if (tier === 'premium') {
    return true;
  }

  const usage = await getQuotaUsage(userId, quotaType, tier);
  return usage.remainingInCycle > 0;
}

/**
 * Increment quota usage
 * Should only be called by backend/Cloud Functions
 */
export async function incrementQuotaUsage(
  userId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<void> {
  const monthKey = getCurrentMonthKey();
  const quotaRef = getQuotaDocRef(userId, monthKey);

  const fieldMap: Record<QuotaType, string> = {
    receiptsUpload: 'receiptsUploaded',
    aiAnalysis: 'aiAnalysesUsed',
    customIntegration: 'customIntegrationsCalled',
    apiCalls: 'apiCallsUsed',
  };

  const fieldName = fieldMap[quotaType];

  try {
    const currentUsage = (await getDoc(quotaRef)).data()?.[fieldName] || 0;

    await updateDoc(quotaRef, {
      [fieldName]: currentUsage + amount,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error(`Error incrementing quota ${quotaType}:`, error);
    throw error;
  }
}

/**
 * Get human-readable quota message
 */
export function getQuotaMessage(usage: QuotaUsage): string {
  if (usage.limit === 0) {
    return `Upgrade to Pro to unlock ${usage.quotaType}`;
  }

  const remaining = usage.remainingInCycle;

  if (remaining <= 0) {
    return `${usage.quotaType} quota exceeded. Renews ${usage.resetDate.toLocaleDateString()}`;
  }

  if (remaining <= 2) {
    return `${remaining} ${usage.quotaType} remaining this month`;
  }

  return `${remaining} ${usage.quotaType} remaining`;
}

/**
 * Get quota warning level (for UI color coding)
 */
export function getQuotaWarningLevel(
  usage: QuotaUsage
): 'ok' | 'warning' | 'critical' | 'exceeded' {
  if (usage.remainingInCycle <= 0) {
    return 'exceeded';
  }

  if (usage.percentageUsed >= 90) {
    return 'critical';
  }

  if (usage.percentageUsed >= 70) {
    return 'warning';
  }

  return 'ok';
}

/**
 * Format quota for display (e.g., "3 / 10")
 */
export function formatQuotaDisplay(usage: QuotaUsage): string {
  if (usage.limit === 0) {
    return 'Unlimited (Premium)';
  }

  if (usage.limit >= 999) {
    return 'Unlimited';
  }

  return `${usage.used} / ${usage.limit}`;
}

/**
 * Get quota reset date for display
 */
export function getQuotaResetDateDisplay(usage: QuotaUsage): string {
  return usage.resetDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate days until quota reset
 */
export function getDaysUntilQuotaReset(usage: QuotaUsage): number {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysMs = usage.resetDate.getTime() - now.getTime();

  return Math.ceil(daysMs / msPerDay);
}

/**
 * Check if quota usage should trigger upgrade prompt
 */
export function shouldPromptUpgrade(
  usage: QuotaUsage,
  tier: UserTier
): boolean {
  if (tier === 'premium') {
    return false; // Premium has unlimited
  }

  if (usage.limit === 0) {
    return true; // Feature not available for this tier
  }

  // Show prompt when at 80% usage
  return usage.percentageUsed >= 80;
}

/**
 * Quota storage helper for client-side caching (optional)
 */
export class QuotaCache {
  private cache: Map<string, { data: QuotaUsage; timestamp: number }> =
    new Map();
  private cacheKeyPrefix = 'quota_cache_';
  private cacheDurationMs = 5 * 60 * 1000; // 5 minutes

  key(userId: string, quotaType: QuotaType): string {
    return `${this.cacheKeyPrefix}${userId}_${quotaType}`;
  }

  get(userId: string, quotaType: QuotaType): QuotaUsage | null {
    const key = this.key(userId, quotaType);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheDurationMs) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(userId: string, quotaType: QuotaType, data: QuotaUsage): void {
    const key = this.key(userId, quotaType);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  clearForUser(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }
}

export const quotaCache = new QuotaCache();
