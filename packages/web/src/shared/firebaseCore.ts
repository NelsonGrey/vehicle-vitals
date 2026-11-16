// Firebase app + Auth only.
//
// Firestore, Functions, Storage, and Remote Config live in sibling modules
// so the marketing entry does not download them. Importing this file must
// stay free of those products.
import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
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

export const resolveEnvironmentName = (): string => {
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

// The post-build prerender runs in Node, where getAuth()'s default IndexedDB
// persistence is unavailable. The client bundle keeps getAuth() unchanged
// (import.meta.env.SSR is false there).
const createAuth = (firebaseApp: FirebaseApp): Auth => {
  if (import.meta.env.SSR) {
    return initializeAuth(firebaseApp, { persistence: inMemoryPersistence });
  }
  return getAuth(firebaseApp);
};

const auth: Auth = createAuth(app);

// A second, fully independent Firebase App instance used only by
// EnvironmentGate's team-access check (dev/staging only). It shares the
// same project config, but keeps its own Auth instance and persisted
// session -- signing in here must never touch `auth` above, since
// AuthContext's onAuthStateChanged listener is bound to that instance and
// any app route (e.g. MarketingRoute) reacting to a transient signed-in
// state there would defeat the whole point of a separate access gate. A
// same-instance "sign in, check, then sign back out" approach was tried
// first and had exactly that race: onAuthStateChanged fired with the new
// user before the sign-out call resolved, long enough for a redirect to
// fire. A second app instance sidesteps the race entirely rather than
// trying to win it.
const GATE_APP_NAME = 'vehicle-vitals-gate';
const gateApp: FirebaseApp = (() => {
  try {
    return getApp(GATE_APP_NAME);
  } catch {
    return initializeApp(firebaseConfig, GATE_APP_NAME);
  }
})();
const gateAuth: Auth = createAuth(gateApp);

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

// Auth emulator only. Firestore, Functions, and Storage emulators connect
// from firebaseConfig.ts when those products are actually loaded.
if (
  !import.meta.env.SSR &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
    });
  } catch (error) {
    console.warn('Could not connect to the Firebase Auth emulator:', error);
  }
}

export { app, auth, gateAuth };

export const getFirebaseConfig = (): FirebaseConfig => firebaseConfig;
export const getFirebaseAuth = (): Auth => auth;
export const getFirebaseApp = (): FirebaseApp => app;
