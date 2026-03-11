const createFirebaseService = async () => {
  try {
    const firebaseModule = await import('../shared/firebaseConfig');

    if (firebaseModule.functions) {
      const fn = await import('firebase/functions');
      return {
        functions: firebaseModule.functions,
        httpsCallable: fn.httpsCallable,
      };
    }

    if (window.firebase && window.firebase.functions) {
      const firebase = window.firebase;
      const firebaseConfig =
        firebaseModule.firebaseConfig ||
        firebaseModule.getFirebaseConfig?.() ||
        null;

      let app;
      try {
        app = firebase.app.getApp();
      } catch {
        app = firebase.app.initializeApp(firebaseConfig);
      }

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
