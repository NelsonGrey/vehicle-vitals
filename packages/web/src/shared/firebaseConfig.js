// Firebase configuration for web app using shared utilities
import { FirebaseClient } from '@shared/firebase-utils';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const resolveEnvironmentName = () => {
  const raw =
    import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';
  return String(raw).trim().toLowerCase();
};

const expectedProjectIdsByEnvironment = {
  development: ['vehicle-vitals-dev'],
  staging: ['vehicle-vitals-staging'],
  production: ['vehicle-vitals-prod'],
};

const validateEnvironmentProjectAlignment = () => {
  const environment = resolveEnvironmentName();
  const projectId = String(firebaseConfig.projectId || '').trim();
  const expectedProjects = expectedProjectIdsByEnvironment[environment] || [];

  if (!projectId || expectedProjects.length === 0) {
    return;
  }

  if (!expectedProjects.includes(projectId)) {
    const message =
      `[firebaseConfig] Environment/project mismatch: ` +
      `VITE_ENVIRONMENT=${environment} but projectId=${projectId}. ` +
      `Expected one of: ${expectedProjects.join(', ')}`;

    // Fail fast for deployed builds; warn during local dev loops.
    if (import.meta.env.PROD) {
      throw new Error(message);
    }
    console.warn(message);
  }
};

validateEnvironmentProjectAlignment();

// Initialize Firebase using shared client
const firebaseClient = FirebaseClient.initialize(firebaseConfig);

// Emulators are explicit opt-in to avoid accidentally bypassing environment backends.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  firebaseClient.connectToEmulators();
}

// Export Firebase services
export const auth = firebaseClient.auth;
export const db = firebaseClient.firestore;
export const functions = firebaseClient.functions;
export const storage = firebaseClient.storage;
export const app = firebaseClient.app;

// Legacy exports for compatibility
export const getFirebaseConfig = () => firebaseConfig;
export const getFirebaseAuth = () => auth;
export const getFirebaseApp = () => app;
export const getFirebaseFunctions = () => functions;
