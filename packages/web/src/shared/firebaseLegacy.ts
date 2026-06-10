import {
  firebaseConfig as baseFirebaseConfig,
  getFirebaseConfig,
} from './firebaseConfig';
import type { FirebaseConfig } from './firebaseConfig';

const DEFAULT_WAIT_TIMEOUT_MS = 5000;
const DEFAULT_WAIT_INTERVAL_MS = 100;

export const getResolvedFirebaseConfig = (): FirebaseConfig | null =>
  baseFirebaseConfig || getFirebaseConfig?.() || null;

export const getLegacyFirebase = (): any =>
  typeof window !== 'undefined' ? (window as any).firebase || null : null;

const hasModules = (firebase: any, modules: string[]): boolean =>
  Boolean(firebase) && modules.every(moduleName => Boolean(firebase[moduleName]));

export const hasLegacyFirebaseModules = (modules: string[] = []): boolean =>
  hasModules(getLegacyFirebase(), modules);

export const waitForLegacyFirebaseModules = async ({
  modules = [],
  timeoutMs = DEFAULT_WAIT_TIMEOUT_MS,
  intervalMs = DEFAULT_WAIT_INTERVAL_MS,
  errorMessage = 'Firebase SDKs failed to load within timeout',
}: {
  modules?: string[];
  timeoutMs?: number;
  intervalMs?: number;
  errorMessage?: string;
} = {}): Promise<any> => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const firebase = getLegacyFirebase();
    if (hasModules(firebase, modules)) {
      return firebase;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(errorMessage);
};

export const getOrInitializeLegacyFirebaseApp = (firebase: any): any => {
  if (!firebase?.app) {
    throw new Error('Legacy Firebase app bridge is unavailable');
  }

  try {
    return firebase.app.getApp();
  } catch {
    return firebase.app.initializeApp(getResolvedFirebaseConfig());
  }
};
