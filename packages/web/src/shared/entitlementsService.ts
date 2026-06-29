import type { UserTier } from './featureFlags';
import { functions } from './firebaseConfig';
import {
  getLegacyFirebase,
  getOrInitializeLegacyFirebaseApp,
  hasLegacyFirebaseModules,
} from './firebaseLegacy';

export interface EffectiveEntitlements {
  orgId: string;
  tier: UserTier;
  vehicleLimit: number;
  features: Record<string, boolean>;
}

export interface EnterpriseContextResponse {
  orgId: string;
  orgType?: string;
  garageStorageMode?: string;
  entitlements: EffectiveEntitlements;
}

export type BillingPeriod = 'monthly' | 'annual';

export interface CheckoutSessionResponse {
  mode: 'redirect' | 'activated';
  checkoutUrl?: string;
  checkoutSessionId?: string;
  tier?: UserTier;
  entitlements?: EffectiveEntitlements;
}

const createFirebaseService = async () => {
  if (functions) {
    const fn = await import('firebase/functions');
    return {
      functions,
      httpsCallable: fn.httpsCallable,
    };
  }

  if (hasLegacyFirebaseModules(['functions'])) {
    const firebase = getLegacyFirebase();
    const app = getOrInitializeLegacyFirebaseApp(firebase);

    return {
      functions: firebase.functions.getFunctions(app),
      httpsCallable: firebase.functions.httpsCallable,
    };
  }

  throw new Error('Firebase Functions not available');
};

export async function bootstrapEnterpriseContext(): Promise<EnterpriseContextResponse> {
  const firebaseService = await createFirebaseService();
  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'bootstrapEnterpriseContextCallable'
  );

  const result = await callable({});
  if (!result.data?.success) {
    throw new Error('Failed to bootstrap enterprise context');
  }

  return {
    orgId: (result.data.orgId || '').toString(),
    orgType: (result.data.orgType || '').toString() || undefined,
    garageStorageMode:
      (result.data.garageStorageMode || '').toString() || undefined,
    entitlements: result.data.entitlements as EffectiveEntitlements,
  };
}

export async function promotePersonalGarageToHousehold(
  householdName: string,
  garageStorageMode: 'dual_write' | 'org_scoped' | 'user_scoped' = 'dual_write'
): Promise<EnterpriseContextResponse> {
  const firebaseService = await createFirebaseService();
  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'promotePersonalGarageToHouseholdCallable'
  );

  const result = await callable({
    householdName,
    garageStorageMode,
  });

  if (!result.data?.success) {
    throw new Error('Failed to promote garage to household');
  }

  return {
    orgId: (result.data.orgId || '').toString(),
    orgType: (result.data.orgType || '').toString() || undefined,
    garageStorageMode:
      (result.data.garageStorageMode || '').toString() || undefined,
    entitlements: result.data.entitlements as EffectiveEntitlements,
  };
}

export async function setGarageStorageMode(
  garageStorageMode: 'dual_write' | 'org_scoped' | 'user_scoped',
  orgId?: string
): Promise<{ orgId: string; garageStorageMode: string }> {
  const firebaseService = await createFirebaseService();
  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'setGarageStorageModeCallable'
  );

  const result = await callable({
    orgId: orgId || '',
    garageStorageMode,
  });

  if (!result.data?.success) {
    throw new Error('Failed to update garage storage mode');
  }

  return {
    orgId: (result.data.orgId || '').toString(),
    garageStorageMode: (result.data.garageStorageMode || '').toString(),
  };
}

export async function getEffectiveEntitlements(
  orgId?: string
): Promise<EffectiveEntitlements> {
  const firebaseService = await createFirebaseService();
  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'getEffectiveEntitlementsCallable'
  );

  const result = await callable({ orgId: orgId || '' });
  if (!result.data?.success || !result.data?.entitlements) {
    throw new Error('Failed to resolve effective entitlements');
  }

  return result.data.entitlements as EffectiveEntitlements;
}

export async function changeSubscriptionTier(
  targetTier: Exclude<UserTier, 'enterprise'>,
  billingPeriod: BillingPeriod
): Promise<EffectiveEntitlements> {
  const firebaseService = await createFirebaseService();
  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'changeSubscriptionTierCallable'
  );

  const result = await callable({
    targetTier,
    billingPeriod,
  });

  if (!result.data?.success || !result.data?.entitlements) {
    throw new Error('Failed to update subscription tier');
  }

  return result.data.entitlements as EffectiveEntitlements;
}

export async function createSubscriptionCheckoutSession(
  targetTier: Extract<UserTier, 'pro' | 'premium'>,
  billingPeriod: BillingPeriod
): Promise<CheckoutSessionResponse> {
  const firebaseService = await createFirebaseService();
  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'createSubscriptionCheckoutSessionCallable'
  );

  const result = await callable({
    targetTier,
    billingPeriod,
  });

  if (!result.data?.success || !result.data?.mode) {
    throw new Error('Failed to create subscription checkout session');
  }

  return {
    mode: result.data.mode as 'redirect' | 'activated',
    checkoutUrl: (result.data.checkoutUrl || '').toString() || undefined,
    checkoutSessionId:
      (result.data.checkoutSessionId || '').toString() || undefined,
    tier: (result.data.tier || '').toString() as UserTier,
    entitlements: result.data.entitlements as EffectiveEntitlements,
  };
}
