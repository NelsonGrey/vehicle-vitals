const createFirebaseFunctionsService = async () => {
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
