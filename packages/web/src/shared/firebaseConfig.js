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

// Initialize Firebase using shared client
const firebaseClient = FirebaseClient.initialize(firebaseConfig);

// Connect to emulators in development
if (import.meta.env.DEV) {
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
