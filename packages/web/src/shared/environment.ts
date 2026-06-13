const normalizeEnvironmentName = (value: string | undefined | null): string =>
  String(value || '')
    .trim()
    .toLowerCase();

export const inferEnvironmentFromProjectId = (
  projectId: string | undefined | null
): string => {
  const normalizedProjectId = normalizeEnvironmentName(projectId);

  if (normalizedProjectId === 'vehicle-vitals-dev') {
    return 'development';
  }

  if (normalizedProjectId === 'vehicle-vitals-staging') {
    return 'staging';
  }

  if (normalizedProjectId === 'vehicle-vitals-prod') {
    return 'production';
  }

  return '';
};

export const inferEnvironmentFromHostname = (
  hostname: string | undefined | null
): string => {
  const normalizedHostname = normalizeEnvironmentName(hostname);

  if (!normalizedHostname) {
    return '';
  }

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '0.0.0.0'
  ) {
    return 'development';
  }

  if (normalizedHostname.includes('vehicle-vitals-dev')) {
    return 'development';
  }

  if (normalizedHostname.includes('vehicle-vitals-staging')) {
    return 'staging';
  }

  if (normalizedHostname.includes('vehicle-vitals-prod')) {
    return 'production';
  }

  return '';
};

export const resolveAppEnvironment = ({
  explicitEnvironment,
  projectId,
  hostname,
  mode,
}: {
  explicitEnvironment?: string | null;
  projectId?: string | null;
  hostname?: string | null;
  mode?: string | null;
}): string => {
  const normalizedExplicitEnvironment =
    normalizeEnvironmentName(explicitEnvironment);
  if (normalizedExplicitEnvironment) {
    return normalizedExplicitEnvironment;
  }

  const inferredFromProjectId = inferEnvironmentFromProjectId(projectId);
  if (inferredFromProjectId) {
    return inferredFromProjectId;
  }

  const inferredFromHostname = inferEnvironmentFromHostname(hostname);
  if (inferredFromHostname) {
    return inferredFromHostname;
  }

  const normalizedMode = normalizeEnvironmentName(mode);
  if (normalizedMode === 'test') {
    return 'test';
  }

  if (normalizedMode === 'development') {
    return 'development';
  }

  return normalizedMode || 'development';
};

const currentHostname =
  typeof window !== 'undefined' ? window.location.hostname : '';

export const appEnvironment = resolveAppEnvironment({
  explicitEnvironment: import.meta.env.VITE_ENVIRONMENT,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  hostname: currentHostname,
  mode: import.meta.env.MODE,
});

const firebaseProjectId = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '')
  .trim()
  .toLowerCase();

export const isDevelopmentEnvironment = appEnvironment === 'development';
export const isDemonstrationEnvironment = appEnvironment === 'demonstration';
export const isStagingEnvironment = appEnvironment === 'staging';
export const isProductionEnvironment = appEnvironment === 'production';

const explicitMarketingOnlyFlag = normalizeEnvironmentName(
  import.meta.env.VITE_MARKETING_ONLY_MODE
);

export const isMarketingOnlyEnvironment = explicitMarketingOnlyFlag === 'true';
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
