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
    console.warn('Local providers service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

export async function getLocalServiceProviders({
  locationQuery,
  radiusMiles = 25,
  maxResults = 8,
  vehicleMake = '',
  providerType = 'all',
}) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'getLocalServiceProvidersCallable'
  );

  const result = await callable({
    locationQuery,
    radiusMiles,
    maxResults,
    vehicleMake,
    providerType,
  });

  if (!result.data?.success) {
    throw new Error(result.data?.error || 'Provider lookup failed');
  }

  return {
    source: result.data.source || 'unknown',
    locationQuery: result.data.locationQuery || locationQuery,
    radiusMiles: result.data.radiusMiles || radiusMiles,
    providerType: result.data.providerType || providerType,
    providers: Array.isArray(result.data.providers)
      ? result.data.providers
      : [],
  };
}
