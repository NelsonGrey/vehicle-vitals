import * as admin from "firebase-admin";

// Server-side quota enforcement. Mirrors the schema documented in
// packages/web/src/shared/quotaService.ts (users/{uid}/quotas/{month}),
// but that client module's increment/init writes are dead code (never
// called from any client path) and, before this, nothing else enforced
// quota either — every AI-analysis Gemini call was effectively unmetered.
// The Firestore rules for this path are now write:false for clients (see
// firebase/firestore.rules), so this module is the only writer.

export type QuotaType = "aiAnalysis";

export interface QuotaConsumeResult {
  allowed: boolean;
  used: number;
  limit: number;
}

const USED_FIELD_BY_QUOTA_TYPE: Record<QuotaType, string> = {
  aiAnalysis: "aiAnalysesUsed",
};

const LIMIT_FIELD_BY_QUOTA_TYPE: Record<QuotaType, string> = {
  aiAnalysis: "aiAnalysesLimit",
};

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Quota ceiling for a tier. Mirrors
 * packages/web/src/shared/featureFlags.ts's ai_analysis quota table
 * (pro: 5/month, premium/enterprise: effectively unlimited, free: not
 * entitled at all) — keep in sync until this moves to a genuinely shared
 * source per the calculation-engine centralization plan.
 * @param {QuotaType} quotaType Which quota this limit applies to.
 * @param {string} tier Server-resolved tier — never trust a
 *   client-supplied tier; callers must resolve it via
 *   resolveEffectiveEntitlements (or equivalent) first.
 * @return {number} The monthly ceiling for this tier/quota combination.
 */
function getQuotaLimitForTier(quotaType: QuotaType, tier: string): number {
  if (quotaType === "aiAnalysis") {
    switch (tier) {
      case "premium":
      case "enterprise":
        return 999999; // Effectively unlimited
      case "pro":
        return 5;
      default:
        return 0; // free tier: ai_analysis is not entitled at all
    }
  }
  return 0;
}

/**
 * Atomically checks and consumes `amount` units of quota, returning
 * allowed:false (without writing anything) if the user is already at or
 * would exceed their limit. Uses a transaction so concurrent requests
 * can't both read a stale "under limit" count and both proceed.
 * @param {string} uid Firestore-authenticated user id (attachment owner).
 * @param {string} tier Server-resolved tier for this user.
 * @param {QuotaType} quotaType Which quota to consume.
 * @param {number} amount Units to consume (default 1).
 * @return {Promise<QuotaConsumeResult>} Whether the consumption was
 *   allowed, plus the resulting used/limit counts.
 */
export async function consumeQuota(
  uid: string,
  tier: string,
  quotaType: QuotaType,
  amount = 1
): Promise<QuotaConsumeResult> {
  const db = admin.firestore();
  const monthKey = getCurrentMonthKey();
  const quotaRef = db.doc(`users/${uid}/quotas/${monthKey}`);
  const usedField = USED_FIELD_BY_QUOTA_TYPE[quotaType];
  const limitField = LIMIT_FIELD_BY_QUOTA_TYPE[quotaType];
  const limit = getQuotaLimitForTier(quotaType, tier);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(quotaRef);
    const data = snap.exists ? snap.data() || {} : {};
    const currentUsed =
      typeof data[usedField] === "number" ? data[usedField] : 0;

    if (currentUsed + amount > limit) {
      return { allowed: false, used: currentUsed, limit };
    }

    const nextUsed = currentUsed + amount;
    const payload = {
      month: monthKey,
      tier,
      [usedField]: nextUsed,
      [limitField]: limit,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (snap.exists) {
      tx.update(quotaRef, payload);
    } else {
      tx.set(quotaRef, {
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { allowed: true, used: nextUsed, limit };
  });
}

/**
 * Read-only quota check, no increment.
 * @param {string} uid Firestore-authenticated user id.
 * @param {string} tier Server-resolved tier for this user.
 * @param {QuotaType} quotaType Which quota to check.
 * @return {Promise<{used: number, limit: number, remaining: number}>}
 *   Current usage state for this month.
 */
export async function resolveQuotaState(
  uid: string,
  tier: string,
  quotaType: QuotaType
): Promise<{ used: number; limit: number; remaining: number }> {
  const db = admin.firestore();
  const monthKey = getCurrentMonthKey();
  const quotaRef = db.doc(`users/${uid}/quotas/${monthKey}`);
  const usedField = USED_FIELD_BY_QUOTA_TYPE[quotaType];
  const limit = getQuotaLimitForTier(quotaType, tier);

  const snap = await quotaRef.get();
  const data = snap.exists ? snap.data() || {} : {};
  const used = typeof data[usedField] === "number" ? data[usedField] : 0;

  return { used, limit, remaining: Math.max(0, limit - used) };
}
