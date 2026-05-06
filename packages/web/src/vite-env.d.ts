/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_ACCESS_PASSWORD?: string;
  readonly VITE_ACCESS_PASSWORD_STAGING?: string;
  readonly VITE_ACCESS_PASSWORD_DEVELOPMENT?: string;
  readonly VITE_ACCESS_PASSWORD_DEMONSTRATION?: string;
  readonly VITE_ENABLE_ADS?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
    firebase: {
      app: unknown;
      auth: unknown;
      firestore: unknown;
      functions: unknown;
      messaging: unknown;
      storage: unknown;
    };
  }
}
