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

export async function bootstrapEnterpriseContext(): Promise<{
  orgId: string;
  entitlements: EffectiveEntitlements;
}> {
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
    entitlements: result.data.entitlements as EffectiveEntitlements,
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
