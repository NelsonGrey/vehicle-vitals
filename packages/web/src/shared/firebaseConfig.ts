// Firebase configuration for web app
import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import {
  connectFunctionsEmulator,
  getFunctions,
  Functions,
} from 'firebase/functions';
import {
  fetchAndActivate,
  getBoolean,
  getNumber,
  getRemoteConfig,
  getString,
  RemoteConfig,
} from 'firebase/remote-config';
import {
  connectStorageEmulator,
  getStorage,
  FirebaseStorage,
} from 'firebase/storage';
import { resolveAppEnvironment } from './environment';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const developmentFirebaseFallback: FirebaseConfig = {
  apiKey: 'AIzaSyAmyyfYTgNAurV-yZxrxwiwGD8_B8QInHs',
  authDomain: 'vehicle-vitals-dev.firebaseapp.com',
  projectId: 'vehicle-vitals-dev',
  storageBucket: 'vehicle-vitals-dev.firebasestorage.app',
  messagingSenderId: '919227980868',
  appId: '1:919227980868:web:1144238b40fb4b9fb5f011',
  measurementId: 'G-FQJQ74S5W4',
};

const productionFirebaseFallback: FirebaseConfig = {
  apiKey: 'AIzaSyDE99EAoGniEwCLfu4llmv_NsSjbwr-ZRE',
  authDomain: 'vehicle-vitals-prod.firebaseapp.com',
  projectId: 'vehicle-vitals-prod',
  storageBucket: 'vehicle-vitals-prod.appspot.com',
  messagingSenderId: '489413148337',
  appId: '1:489413148337:web:9b4e97350073a22968ac90',
  measurementId: 'G-32PCGDSNT9',
};

const firebaseFallbacksByEnvironment: Record<string, FirebaseConfig> = {
  development: developmentFirebaseFallback,
  production: productionFirebaseFallback,
};

const isPlaceholderValue = (value: unknown): boolean => {
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

const validateFirebaseClientConfig = (): void => {
  if (resolveEnvironmentName() === 'test') {
    return;
  }

  const requiredFields: Array<[string, unknown]> = [
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

const resolveEnvironmentName = (): string => {
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : '';

  return resolveAppEnvironment({
    explicitEnvironment: import.meta.env.VITE_ENVIRONMENT,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hostname,
    mode: import.meta.env.MODE,
  });
};

const isTestRuntime = (): boolean => {
  return import.meta.env.MODE === 'test' || Boolean(import.meta.env.VITEST);
};

const applyTestFirebaseFallback = (): void => {
  if (!isTestRuntime()) {
    return;
  }

  Object.assign(firebaseConfig, developmentFirebaseFallback);
};

const applyDevelopmentFirebaseFallback = (): void => {
  if (isTestRuntime()) {
    Object.assign(firebaseConfig, developmentFirebaseFallback);
    return;
  }

  const environment = resolveEnvironmentName();
  const fallback = firebaseFallbacksByEnvironment[environment];
  if (!fallback) {
    return;
  }

  const recoveredFields: string[] = [];
  for (const [name, fallbackValue] of Object.entries(fallback)) {
    if (isPlaceholderValue(firebaseConfig[name as keyof FirebaseConfig])) {
      firebaseConfig[name as keyof FirebaseConfig] = fallbackValue;
      recoveredFields.push(name);
    }
  }

  if (recoveredFields.length > 0) {
    console.warn(
      `[firebaseConfig] Applied ${environment} fallback for: ${recoveredFields.join(', ')}`
    );
  }
};

const expectedProjectIdsByEnvironment: Record<string, string[]> = {
  development: ['vehicle-vitals-dev'],
  staging: ['vehicle-vitals-staging'],
  production: ['vehicle-vitals-prod'],
};

const canonicalHostedOriginsByHostname: Record<string, string> = {
  'vehicle-vitals-dev.firebaseapp.com': 'https://vehicle-vitals-dev.web.app',
  'vehicle-vitals-staging.firebaseapp.com':
    'https://vehicle-vitals-staging.web.app',
  'vehicle-vitals-prod.firebaseapp.com': 'https://vehicle-vitals.com',
  'vehicle-vitals-prod.web.app': 'https://vehicle-vitals.com',
};

const redirectToCanonicalHostedOrigin = (): void => {
  if (isTestRuntime()) {
    return;
  }

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

const validateEnvironmentProjectAlignment = (): void => {
  if (isTestRuntime()) {
    return;
  }

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

applyTestFirebaseFallback();
applyDevelopmentFirebaseFallback();
validateEnvironmentProjectAlignment();
validateFirebaseClientConfig();
redirectToCanonicalHostedOrigin();

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);
const storage: FirebaseStorage = getStorage(app);

// ─── GA4 event tracking ──────────────────────────────────────────────────────
// GTM (see index.html) owns GA4 configuration and tags for this property.
// This is the single channel the app uses to send events — it only ever
// pushes to the shared dataLayer via gtag(), so GTM's config decides where
// events go. Do not also call the Firebase Analytics SDK (getAnalytics/
// logEvent) anywhere: merely initializing it triggers its own independent
// GA4 config + automatic page_view against the same property, double-firing
// against everything this function sends through GTM.

/**
 * Log a GA4 event via the GTM/gtag dataLayer. Safe to call unconditionally;
 * no-ops if gtag isn't defined yet.
 *
 * @param eventName  Standard or custom GA4 event name
 * @param params   Optional key/value event parameters
 */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {}
): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch {
    // Never throw from a tracking helper
  }
}

// ─── Remote Config ──────────────────────────────────────────────────────────
// Provides feature flags and runtime-adjustable settings without a redeploy.
const remoteConfig: RemoteConfig = getRemoteConfig(app);

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
  enable_vin_lookup: 'true',
  enable_export: 'true',
  enable_calendar_sync: 'true',
  enable_ai_attachment_analysis: 'false',
  enable_provider_discovery: 'true',
  onboarding_vehicle_limit_prompt: '1',
  // Runtime kill switch for app access (sign-in/sign-up entry points and
  // subscription checkout) that doesn't require a rebuild+redeploy to flip —
  // toggle in Firebase Console > Remote Config for a pre-launch window or a
  // maintenance outage. Entry points stay visible but disabled rather than
  // disappearing, so a visitor sees why instead of hitting a dead link.
  app_offline: 'false',
};

// Fetch and activate in background; app uses defaults until this resolves.
// Exported so callers that need to react the moment a fetched value
// supersedes the default (e.g. useAppOffline) can await readiness instead of
// only ever seeing remoteConfig.defaultConfig's static values.
export const remoteConfigReady = fetchAndActivate(remoteConfig).catch(() => {
  // Network unavailable or fetch throttled — defaults remain active.
});

/**
 * Remote Config helpers — always return a value (cache, defaults, or fetched).
 */
export const remoteConfigFlag = {
  bool: (key: string): boolean => getBoolean(remoteConfig, key),
  str: (key: string): string => getString(remoteConfig, key),
  num: (key: string): number => getNumber(remoteConfig, key),
};

// Emulators are explicit opt-in to avoid accidentally bypassing environment backends.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.warn('Could not connect to Firebase emulators:', error);
  }
}

// Export Firebase services
export { app, auth, db, functions, remoteConfig, storage };

// Legacy exports for compatibility
export const getFirebaseConfig = (): FirebaseConfig => firebaseConfig;
export const getFirebaseAuth = (): Auth => auth;
export const getFirebaseApp = (): FirebaseApp => app;
export const getFirebaseFunctions = (): Functions => functions;
