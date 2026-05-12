// Firebase configuration for web app
import {
  isSupported as analyticsIsSupported,
  getAnalytics,
  logEvent,
} from 'firebase/analytics';
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import {
  fetchAndActivate,
  getBoolean,
  getNumber,
  getRemoteConfig,
  getString,
} from 'firebase/remote-config';
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
  if (resolveEnvironmentName() === 'test') {
    return;
  }

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

const canonicalHostedOriginsByHostname = {
  'vehicle-vitals-dev.firebaseapp.com': 'https://vehicle-vitals-dev.web.app',
  'vehicle-vitals-staging.firebaseapp.com':
    'https://vehicle-vitals-staging.web.app',
  'vehicle-vitals-prod.firebaseapp.com': 'https://vehicle-vitals-prod.web.app',
};

const redirectToCanonicalHostedOrigin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const toOrigin = canonicalHostedOriginsByHostname[window.location.hostname];
  if (!toOrigin) {
    return;
  }

  const nextUrl =
    `${toOrigin}${window.location.pathname}` +
    `${window.location.search}${window.location.hash}`;

  console.warn(
    `[firebaseConfig] Redirecting from ${window.location.hostname} to canonical host ${toOrigin}`
  );
  window.location.replace(nextUrl);
  throw new Error(
    `[firebaseConfig] Redirecting to canonical hosted origin: ${toOrigin}`
  );
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
redirectToCanonicalHostedOrigin();

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// ─── Firebase Analytics ─────────────────────────────────────────────────────
// Only initialize Analytics when the environment supports it (i.e. not in
// SSR, Web Workers, or browsers that block it). measurementId must be set.
let analytics = null;
let _analyticsReady = false;

if (firebaseConfig.measurementId) {
  analyticsIsSupported()
    .then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
        _analyticsReady = true;
      }
    })
    .catch(() => {
      // Analytics blocked by browser extension or privacy settings – non-fatal.
    });
}

/**
 * Log a Firebase Analytics event. Safe to call unconditionally; no-ops when
 * Analytics is not supported or has not yet initialised.
 *
 * @param {string} eventName  Standard or custom GA4 event name
 * @param {object} [params]   Optional key/value event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (_analyticsReady && analytics) {
    try {
      logEvent(analytics, eventName, params);
    } catch {
      // Never throw from a tracking helper
    }
  }
}

// ─── Remote Config ──────────────────────────────────────────────────────────
// Provides feature flags and runtime-adjustable settings without a redeploy.
const remoteConfig = getRemoteConfig(app);

// Minimum fetch interval: 1 hour in production, 0 in development for fast iteration.
remoteConfig.settings.minimumFetchIntervalMillis =
  resolveEnvironmentName() === 'production' ? 3_600_000 : 0;

// Safe defaults — used immediately before a fetch completes.
// Must stay in sync with seedRemoteConfigDefaults Cloud Function.
remoteConfig.defaultConfig = {
  enable_premium_features: 'false',
  enable_ads: 'false',
  max_vehicles_free_tier: '3',
  maintenance_reminder_days_ahead: '30',
  enable_vin_decode: 'true',
  enable_export: 'true',
  enable_calendar_sync: 'true',
  enable_ai_attachment_analysis: 'false',
  enable_provider_discovery: 'true',
  onboarding_vehicle_limit_prompt: '1',
};

// Fetch and activate in background; app uses defaults until this resolves.
fetchAndActivate(remoteConfig).catch(() => {
  // Network unavailable or fetch throttled — defaults remain active.
});

/**
 * Remote Config helpers — always return a value (cache, defaults, or fetched).
 */
export const remoteConfigFlag = {
  bool: key => getBoolean(remoteConfig, key),
  str: key => getString(remoteConfig, key),
  num: key => getNumber(remoteConfig, key),
};

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
export { analytics, app, auth, db, functions, remoteConfig, storage };

// Legacy exports for compatibility
export const getFirebaseConfig = () => firebaseConfig;
export const getFirebaseAuth = () => auth;
export const getFirebaseApp = () => app;
export const getFirebaseFunctions = () => functions;
