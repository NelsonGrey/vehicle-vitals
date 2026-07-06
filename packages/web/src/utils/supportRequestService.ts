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
    console.warn('Support request service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

export const SUPPORT_REQUEST_TOPICS = [
  'Bug Report',
  'Account / Login',
  'Billing / Subscription',
  'VIN Lookup / Vehicle Data',
  'Feature Request',
  'Other',
] as const;

export type SupportRequestTopic = (typeof SUPPORT_REQUEST_TOPICS)[number];

export interface SupportRequestInput {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export async function submitSupportRequest(
  input: SupportRequestInput
): Promise<{ success: boolean }> {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'submitSupportRequestCallable'
  );

  const result = await callable(input);

  if (!(result.data as { success?: boolean })?.success) {
    throw new Error('Failed to submit support request');
  }

  return result.data as { success: boolean };
}
