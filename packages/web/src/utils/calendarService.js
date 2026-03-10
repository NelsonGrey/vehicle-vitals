// Calendar integration utility for web.

const createFirebaseService = async () => {
  try {
    const checkFirebase = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const check = () => {
          attempts++;
          if (
            window.firebase &&
            window.firebase.firestore &&
            window.firebase.functions &&
            window.firebase.auth
          ) {
            resolve(window.firebase);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Firebase SDKs failed to load within timeout'));
          } else {
            setTimeout(check, 100);
          }
        };

        check();
      });
    };

    const firebase = await checkFirebase();
    const firebaseConfigModule = await import('../shared/firebaseConfig');
    const firebaseConfig =
      firebaseConfigModule.firebaseConfig ||
      firebaseConfigModule.getFirebaseConfig?.() ||
      null;

    let app;
    try {
      app = firebase.app.getApp();
    } catch {
      app = firebase.app.initializeApp(firebaseConfig);
    }

    const functions = firebase.functions.getFunctions(app);
    const auth = firebase.auth.getAuth(app);
    return {
      functions,
      auth,
      firebaseConfig,
      httpsCallable: firebase.functions.httpsCallable,
    };
  } catch (error) {
    console.warn('Calendar service unavailable:', error);
    return {
      functions: null,
      auth: null,
      firebaseConfig: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

const resolveHttpEndpoint = firebaseConfig => {
  const explicit = import.meta.env.VITE_FUNCTIONS_BASE_URL;
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/createCalendarEvent`;
  }

  const projectId = firebaseConfig?.projectId;
  if (!projectId) {
    throw new Error('Unable to resolve functions HTTP endpoint');
  }

  return `https://us-central1-${projectId}.cloudfunctions.net/createCalendarEvent`;
};

const postCalendarEventHttp = async (firebaseService, payload) => {
  const endpoint = resolveHttpEndpoint(firebaseService.firebaseConfig);
  const headers = {
    'Content-Type': 'application/json',
  };

  const idToken = await firebaseService.auth?.currentUser?.getIdToken?.();
  if (idToken) {
    headers.authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success !== true) {
    throw new Error(data?.error || `Calendar HTTP error ${response.status}`);
  }

  return data.event || {};
};

export async function createMaintenanceCalendarEvent({
  vehicleVin,
  title,
  description,
  startAt,
  endAt,
  target = 'google',
}) {
  const firebaseService = await createFirebaseService();
  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const payload = {
    vehicleVin,
    title,
    description,
    startAt,
    endAt,
    target,
  };

  try {
    const createCalendarEventCallable = firebaseService.httpsCallable(
      firebaseService.functions,
      'createCalendarEventCallable'
    );

    const result = await createCalendarEventCallable(payload);
    if (!result.data?.success) {
      throw new Error(result.data?.error || 'Callable calendar event failed');
    }

    return result.data.event || {};
  } catch (callableError) {
    console.warn(
      'Callable calendar event failed, falling back to HTTP:',
      callableError
    );
    return postCalendarEventHttp(firebaseService, payload);
  }
}
