export const appEnvironment = String(
  import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'
)
  .trim()
  .toLowerCase();

export const isDevelopmentEnvironment = appEnvironment === 'development';

export const enableHostedDemoPdfUploads =
  String(import.meta.env.VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS || '')
    .trim()
    .toLowerCase() === 'true';
