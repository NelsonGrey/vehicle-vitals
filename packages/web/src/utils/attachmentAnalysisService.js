import { functions } from '../shared/firebaseConfig';
import {
  getLegacyFirebase,
  getOrInitializeLegacyFirebaseApp,
  hasLegacyFirebaseModules,
} from '../shared/firebaseLegacy';

const createFirebaseFunctionsService = async () => {
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
    console.warn('Attachment analysis callable unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

export async function analyzeAttachmentText({
  vin,
  storagePath,
  ocrText = '',
  contentType = '',
}) {
  const firebaseService = await createFirebaseFunctionsService();

  if (!firebaseService.functions) {
    return null;
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'analyzeAttachmentTextCallable'
  );

  const response = await callable({
    vin,
    storagePath,
    ocrText,
    contentType,
  });

  return response?.data || null;
}
