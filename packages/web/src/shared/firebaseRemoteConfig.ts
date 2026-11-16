// Remote Config, split out of firebaseCore so Auth can load without it
// and so the marketing shell does not also pull Firestore/Functions/Storage.
import {
  fetchAndActivate,
  getBoolean,
  getNumber,
  getRemoteConfig,
  getString,
  type RemoteConfig,
} from 'firebase/remote-config';
import { app, resolveEnvironmentName } from './firebaseCore';

// Safe defaults — used immediately before a fetch completes.
// Must stay in sync with seedRemoteConfigDefaults Cloud Function.
const defaultConfig = {
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

let remoteConfig: RemoteConfig | null = null;

try {
  remoteConfig = getRemoteConfig(app);
  remoteConfig.settings.minimumFetchIntervalMillis =
    resolveEnvironmentName() === 'production' ? 3_600_000 : 0;
  remoteConfig.defaultConfig = defaultConfig;
} catch (error) {
  // Node prerender and other non-browser runtimes may not support Remote
  // Config. Callers fall back to the static defaults below.
  console.warn('[firebaseRemoteConfig] Remote Config unavailable:', error);
}

// Fetch and activate in the browser only. The prerender uses defaults so it
// does not block on a network fetch, and so signup links render as available
// (app_offline defaults to false).
export const remoteConfigReady =
  remoteConfig && typeof window !== 'undefined' && !import.meta.env.SSR
    ? fetchAndActivate(remoteConfig).catch(() => {
        // Network unavailable or fetch throttled — defaults remain active.
      })
    : Promise.resolve();

const defaultBoolean = (key: string): boolean => defaultConfig[key as keyof typeof defaultConfig] === 'true';

/**
 * Remote Config helpers — always return a value (cache, defaults, or fetched).
 */
export const remoteConfigFlag = {
  bool: (key: string): boolean =>
    remoteConfig ? getBoolean(remoteConfig, key) : defaultBoolean(key),
  str: (key: string): string =>
    remoteConfig
      ? getString(remoteConfig, key)
      : String(defaultConfig[key as keyof typeof defaultConfig] ?? ''),
  num: (key: string): number =>
    remoteConfig
      ? getNumber(remoteConfig, key)
      : Number(defaultConfig[key as keyof typeof defaultConfig] ?? 0),
};

export { remoteConfig };
