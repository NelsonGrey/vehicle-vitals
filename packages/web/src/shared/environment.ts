export const appEnvironment = String(
  import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'
)
  .trim()
  .toLowerCase();

const firebaseProjectId = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '')
  .trim()
  .toLowerCase();

export const isDevelopmentEnvironment = appEnvironment === 'development';
export const isDemonstrationEnvironment = appEnvironment === 'demonstration';
export const isStagingEnvironment = appEnvironment === 'staging';
export const isProductionEnvironment = appEnvironment === 'production';
export const isMarketingOnlyEnvironment = isProductionEnvironment;
export const isDevelopmentProject = firebaseProjectId === 'vehicle-vitals-dev';
export const showDemoSeedControls =
  isDevelopmentEnvironment || isDevelopmentProject;

const explicitHostedUploadsFlag = String(
  import.meta.env.VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS || ''
)
  .trim()
  .toLowerCase();

export const enableHostedDemoPdfUploads =
  explicitHostedUploadsFlag === 'true'
    ? true
    : explicitHostedUploadsFlag === 'false'
      ? false
      : showDemoSeedControls;

const explicitAdsFlag = String(import.meta.env.VITE_ENABLE_ADS || '')
  .trim()
  .toLowerCase();

const defaultEnableAds =
  appEnvironment === 'production' &&
  firebaseProjectId === 'vehicle-vitals-prod';

export const enableAds =
  explicitAdsFlag === 'true'
    ? true
    : explicitAdsFlag === 'false'
      ? false
      : defaultEnableAds;
