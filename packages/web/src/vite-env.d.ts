/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  // Environment / feature flags
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_MARKETING_ONLY_MODE?: string;
  readonly VITE_SHOW_COMING_SOON?: string;
  readonly VITE_ENABLE_ADS?: string;
  readonly VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS?: string;

  // Analytics / ads
  readonly VITE_GTM_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT?: string;

  // App canonical URL for SEO
  readonly VITE_APP_URL?: string;

  // Access gates
  readonly VITE_ACCESS_PASSWORD?: string;
  readonly VITE_ACCESS_PASSWORD_STAGING?: string;
  readonly VITE_ACCESS_PASSWORD_DEVELOPMENT?: string;
  readonly VITE_ACCESS_PASSWORD_DEMONSTRATION?: string;

  // Vite built-ins
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
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
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
