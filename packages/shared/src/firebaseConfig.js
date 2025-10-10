// -----------------------------
// File: shared/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Read env vars
// - Web (Vite): do not reference import.meta here; web has its own config file.
// - Native (Expo)/Node: read from process.env and merge in Expo Constants.extra when available.
let env = (typeof process !== 'undefined' && process.env) ? { ...process.env } : {};
try {
  // Lazy require to avoid bundling in web
  // eslint-disable-next-line global-require
  const Constants = require('expo-constants');
  const extra = (Constants?.expoConfig?.extra) || (Constants?.manifest?.extra) || {};
  env = { ...env, ...extra };
} catch (_) {
  // Not running under Expo; ignore
}

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.EXPO_PUBLIC_FIREBASE_API_KEY || env.FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MSG_SENDER_ID',
  appId: env.VITE_FIREBASE_APP_ID || env.EXPO_PUBLIC_FIREBASE_APP_ID || env.FIREBASE_APP_ID || 'YOUR_APP_ID',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID || undefined
};

// For platform-specific usage, consumer can initialize the app and export auth/db as needed.
// Older code may have expected `auth` and `db` exports; prefer platform-specific initialization.

// Messaging is web-only in this repo; only import/use it where supported.
let messaging = null;
try {
  // dynamic import so native bundles don't try to resolve web-only module
  // (consumer code can import { messaging } from './firebaseConfig' and check for null)
  // eslint-disable-next-line import/no-extraneous-dependencies
  // Note: this will only work in environments that support dynamic import; keep try/catch to be safe.
  // We intentionally don't export getMessaging directly to avoid bundling issues in native.
  // If you need push notifications on native, set up the native SDKs and export a native-capable messaging instance.
  // The web app can still import firebase/messaging directly if needed.
  // Placeholder: messaging stays null for native.
} catch (err) {
  // noop
}

export { messaging };
