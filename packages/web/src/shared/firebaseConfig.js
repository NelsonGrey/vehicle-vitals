// Dynamic Firebase initialization that hides imports from Vite
let firebaseInitPromise = null;

const createFirebaseConfig = () => {
  const env = import.meta.env || {};

  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MSG_SENDER_ID',
    appId: env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
  };

  if (
    !env.VITE_FIREBASE_API_KEY ||
    firebaseConfig.apiKey === 'YOUR_API_KEY' ||
    firebaseConfig.authDomain === 'YOUR_AUTH_DOMAIN' ||
    firebaseConfig.projectId === 'YOUR_PROJECT_ID'
  ) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] Missing or placeholder Firebase config detected. Set VITE_FIREBASE_* env vars. See web/.env.example.');
  }

  return firebaseConfig;
};

const initializeFirebase = async () => {
  if (firebaseInitPromise) return firebaseInitPromise;

  firebaseInitPromise = (async () => {
    try {
      // Use Function constructor to hide imports from Vite's static analysis
      const appFn = new Function('return import("firebase/app")');
      const authFn = new Function('return import("firebase/auth")');
      const firestoreFn = new Function('return import("firebase/firestore")');
      const functionsFn = new Function('return import("firebase/functions")');

      const [{ initializeApp }, { getAuth }, { getFirestore }, { getFunctions }] = await Promise.all([
        appFn(),
        authFn(),
        firestoreFn(),
        functionsFn()
      ]);

      const firebaseConfig = createFirebaseConfig();
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const functions = getFunctions(app);

      return { auth, db, app, functions };
    } catch (error) {
      console.warn('Firebase initialization failed:', error);
      // Return mock services for build compatibility
      return {
        auth: { currentUser: null },
        db: null,
        app: null,
        functions: null
      };
    }
  })();

  return firebaseInitPromise;
};

// Export async getters
export const getFirebaseAuth = async () => {
  const firebase = await initializeFirebase();
  return firebase.auth;
};

export const getFirebaseFunctions = async () => {
  const firebase = await initializeFirebase();
  return firebase.functions;
};

// Legacy sync exports for compatibility (will be null during build)
export let auth = null;
export let db = null;

// Initialize for runtime if we're not in build
if (typeof window !== 'undefined') {
  initializeFirebase().then(firebase => {
    auth = firebase.auth;
    db = firebase.db;
  });
}
