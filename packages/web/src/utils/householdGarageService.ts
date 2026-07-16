import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from '../shared/firebaseConfig';
import {
  getLegacyFirebase,
  getOrInitializeLegacyFirebaseApp,
  hasLegacyFirebaseModules,
} from '../shared/firebaseLegacy';

const createFirebaseService = async () => {
  try {
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
  } catch (error) {
    console.warn('Household garage service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

export type GarageStorageMode = 'user_scoped' | 'dual_write' | 'org_scoped';

export interface HouseholdGarageStatus {
  success: boolean;
  orgId: string;
  orgType: string;
  garageStorageMode: GarageStorageMode;
  name?: string;
}

export interface PromoteHouseholdResult {
  success: boolean;
  orgId: string;
  orgType: string;
  garageStorageMode: GarageStorageMode;
  name: string;
  vehiclesCopied: number;
}

export async function getHouseholdGarageStatus(): Promise<HouseholdGarageStatus> {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'bootstrapEnterpriseContextCallable'
  );

  const result = await callable({});
  const status = result.data as HouseholdGarageStatus;

  try {
    const orgSnap = await getDoc(doc(db, 'orgs', status.orgId));
    const name = orgSnap.data()?.name;
    if (typeof name === 'string' && name) {
      return { ...status, name };
    }
  } catch {
    // Non-fatal: status is still usable without a display name.
  }

  return status;
}

export async function promotePersonalGarageToHousehold(params: {
  householdName: string;
  garageStorageMode?: GarageStorageMode;
  idempotencyKey?: string;
}): Promise<PromoteHouseholdResult> {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'promotePersonalGarageToHouseholdCallable'
  );

  const result = await callable({
    householdName: params.householdName,
    garageStorageMode: params.garageStorageMode || 'dual_write',
    idempotencyKey: params.idempotencyKey,
  });

  return result.data as PromoteHouseholdResult;
}
