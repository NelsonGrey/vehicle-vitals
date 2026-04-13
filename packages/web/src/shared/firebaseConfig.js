// Firebase configuration for web app
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const developmentFirebaseFallback = {
  apiKey: 'AIzaSyAmyyfYTgNAurV-yZxrxwiwGD8_B8QInHs',
  authDomain: 'vehicle-vitals-dev.firebaseapp.com',
  projectId: 'vehicle-vitals-dev',
  storageBucket: 'vehicle-vitals-dev.firebasestorage.app',
  messagingSenderId: '919227980868',
  appId: '1:919227980868:web:1144238b40fb4b9fb5f011',
  measurementId: 'G-FQJQ74S5W4',
};

const isPlaceholderValue = value => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return true;
  }

  const upper = normalized.toUpperCase();
  return (
    upper.startsWith('YOUR_') ||
    upper.startsWith('REPLACE_WITH_') ||
    normalized.includes('XXXXXXXX') ||
    normalized === '000000000000'
  );
};

const validateFirebaseClientConfig = () => {
  const requiredFields = [
    ['apiKey', firebaseConfig.apiKey],
    ['authDomain', firebaseConfig.authDomain],
    ['projectId', firebaseConfig.projectId],
    ['storageBucket', firebaseConfig.storageBucket],
    ['messagingSenderId', firebaseConfig.messagingSenderId],
    ['appId', firebaseConfig.appId],
  ];

  const invalidFields = requiredFields
    .filter(([, value]) => isPlaceholderValue(value))
    .map(([name]) => name);

  const apiKey = String(firebaseConfig.apiKey || '').trim();
  if (apiKey && !apiKey.startsWith('AIza')) {
    invalidFields.push('apiKey');
  }

  if (invalidFields.length === 0) {
    return;
  }

  const environment = resolveEnvironmentName();
  const message =
    `[firebaseConfig] Invalid Firebase web configuration for environment ` +
    `${environment}. Check VITE_FIREBASE_* values for: ` +
    `${Array.from(new Set(invalidFields)).join(', ')}.`;

  throw new Error(message);
};

const resolveEnvironmentName = () => {
  const raw =
    import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';
  return String(raw).trim().toLowerCase();
};

const applyDevelopmentFirebaseFallback = () => {
  if (resolveEnvironmentName() !== 'development') {
    return;
  }

  const recoveredFields = [];
  for (const [name, fallbackValue] of Object.entries(
    developmentFirebaseFallback
  )) {
    if (isPlaceholderValue(firebaseConfig[name])) {
      firebaseConfig[name] = fallbackValue;
      recoveredFields.push(name);
    }
  }

  if (recoveredFields.length > 0) {
    console.warn(
      `[firebaseConfig] Applied development fallback for: ${recoveredFields.join(', ')}`
    );
  }
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

applyDevelopmentFirebaseFallback();
validateEnvironmentProjectAlignment();
validateFirebaseClientConfig();

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Emulators are explicit opt-in to avoid accidentally bypassing environment backends.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.warn('Could not connect to Firebase emulators:', error);
  }
}

// Export Firebase services
export { app, auth, db, functions, storage };

// Legacy exports for compatibility
export const getFirebaseConfig = () => firebaseConfig;
export const getFirebaseAuth = () => auth;
export const getFirebaseApp = () => app;
export const getFirebaseFunctions = () => functions;
