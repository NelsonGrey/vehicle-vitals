// Simplified Firebase configuration for production
// Firebase SDKs are loaded globally via Firebase Hosting

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
    console.warn('[Firebase] Missing or placeholder Firebase config detected. Set VITE_FIREBASE_* env vars.');
  }

  return firebaseConfig;
};

// Export the config object directly
export const firebaseConfig = createFirebaseConfig();

// For compatibility, export getters that return the config
export const getFirebaseConfig = () => firebaseConfig;

// Legacy exports
export const getFirebaseAuth = async () => {
  throw new Error('Firebase auth should be accessed via global firebase object');
};

export const getFirebaseApp = async () => {
  throw new Error('Firebase app should be accessed via global firebase object');
};

export const getFirebaseFunctions = async () => {
  throw new Error('Firebase functions should be accessed via global firebase object');
};

// Legacy sync exports
export let auth = null;
export let db = null;
