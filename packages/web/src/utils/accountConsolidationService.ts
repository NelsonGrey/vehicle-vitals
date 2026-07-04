import { functions } from '../shared/firebaseConfig';
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
    console.warn('Account consolidation service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

export interface ConsolidationResult {
  success: boolean;
  sourceUid: string;
  primaryUid: string;
  vehiclesMigrated: number;
  vehicleSkipped: number;
  migratedVins: string[];
  message: string;
}

export interface ConsolidationCodeRequestResult {
  success: boolean;
  sentTo: string;
}

export async function requestAccountConsolidation(
  sourceUid: string
): Promise<ConsolidationCodeRequestResult> {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'requestAccountConsolidationCallable'
  );

  const result = await callable({ sourceUid });

  return result.data as ConsolidationCodeRequestResult;
}

export async function consolidateAccountData(params: {
  sourceUid: string;
  verificationCode: string;
  idempotencyKey?: string;
}): Promise<ConsolidationResult> {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'consolidateAccountDataCallable'
  );

  const result = await callable({
    sourceUid: params.sourceUid,
    verificationCode: params.verificationCode,
    idempotencyKey: params.idempotencyKey,
  });

  return result.data as ConsolidationResult;
}
