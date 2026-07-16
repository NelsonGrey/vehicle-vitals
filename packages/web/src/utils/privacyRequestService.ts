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
    console.warn('Privacy request service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

export interface ComplianceRequestResult {
  success: boolean;
  requestId: string;
  status: string;
}

export async function requestAccountDataDeletion(): Promise<ComplianceRequestResult> {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'requestUserDataDeletionCallable'
  );

  const result = await callable({});
  return result.data as ComplianceRequestResult;
}

export async function requestAccountDataExport(): Promise<ComplianceRequestResult> {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'requestUserDataExportCallable'
  );

  const result = await callable({});
  return result.data as ComplianceRequestResult;
}
