export const appEnvironment = String(
  import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'
)
  .trim()
  .toLowerCase();

export const isDevelopmentEnvironment = appEnvironment === 'development';
