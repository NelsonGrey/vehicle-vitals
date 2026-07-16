export const DEFAULT_APP_REDIRECT = '/app';

export function sanitizeAppRedirectPath(
  value: string | null | undefined
): string {
  if (!value) {
    return DEFAULT_APP_REDIRECT;
  }

  const decoded = decodeURIComponent(value).trim();
  if (!decoded.startsWith('/')) {
    return DEFAULT_APP_REDIRECT;
  }

  // Prevent open redirects and keep post-auth navigation in the protected app namespace.
  if (!decoded.startsWith('/app')) {
    return DEFAULT_APP_REDIRECT;
  }

  return decoded;
}

export function getRedirectQueryParam(search: string): string {
  return sanitizeAppRedirectPath(new URLSearchParams(search).get('redirect'));
}

export function withRedirect(path: string, redirectPath: string): string {
  const params = new URLSearchParams({ redirect: redirectPath });
  return `${path}?${params.toString()}`;
}
