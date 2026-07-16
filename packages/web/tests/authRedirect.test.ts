import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APP_REDIRECT,
  getRedirectQueryParam,
  sanitizeAppRedirectPath,
  withRedirect,
} from '../src/shared/authRedirect';

describe('sanitizeAppRedirectPath', () => {
  it('returns DEFAULT_APP_REDIRECT for null input', () => {
    expect(sanitizeAppRedirectPath(null)).toBe(DEFAULT_APP_REDIRECT);
  });

  it('returns DEFAULT_APP_REDIRECT for undefined input', () => {
    expect(sanitizeAppRedirectPath(undefined)).toBe(DEFAULT_APP_REDIRECT);
  });

  it('returns DEFAULT_APP_REDIRECT for empty string', () => {
    expect(sanitizeAppRedirectPath('')).toBe(DEFAULT_APP_REDIRECT);
  });

  it('returns DEFAULT_APP_REDIRECT for a path not starting with /', () => {
    expect(sanitizeAppRedirectPath('app/profile')).toBe(DEFAULT_APP_REDIRECT);
  });

  it('returns DEFAULT_APP_REDIRECT for a path not starting with /app', () => {
    expect(sanitizeAppRedirectPath('/auth/login')).toBe(DEFAULT_APP_REDIRECT);
  });

  it('returns DEFAULT_APP_REDIRECT for open redirect attempts', () => {
    expect(sanitizeAppRedirectPath('//evil.com')).toBe(DEFAULT_APP_REDIRECT);
    expect(sanitizeAppRedirectPath('/evil/path')).toBe(DEFAULT_APP_REDIRECT);
  });

  it('accepts valid /app paths', () => {
    expect(sanitizeAppRedirectPath('/app')).toBe('/app');
    expect(sanitizeAppRedirectPath('/app/profile')).toBe('/app/profile');
    expect(sanitizeAppRedirectPath('/app/add-vehicle')).toBe(
      '/app/add-vehicle'
    );
  });

  it('decodes percent-encoded paths', () => {
    expect(sanitizeAppRedirectPath('%2Fapp%2Fprofile')).toBe('/app/profile');
  });

  it('trims whitespace from decoded path', () => {
    expect(sanitizeAppRedirectPath(' /app/profile ')).toBe('/app/profile');
  });
});

describe('getRedirectQueryParam', () => {
  it('returns DEFAULT_APP_REDIRECT when no redirect param is present', () => {
    expect(getRedirectQueryParam('')).toBe(DEFAULT_APP_REDIRECT);
    expect(getRedirectQueryParam('?foo=bar')).toBe(DEFAULT_APP_REDIRECT);
  });

  it('returns the sanitized redirect param value', () => {
    expect(getRedirectQueryParam('?redirect=%2Fapp%2Fprofile')).toBe(
      '/app/profile'
    );
  });

  it('rejects open-redirect attempts in query param', () => {
    expect(getRedirectQueryParam('?redirect=%2Fevil')).toBe(
      DEFAULT_APP_REDIRECT
    );
    expect(getRedirectQueryParam('?redirect=http%3A%2F%2Fevil.com')).toBe(
      DEFAULT_APP_REDIRECT
    );
  });
});

describe('withRedirect', () => {
  it('appends redirect query param to a path', () => {
    const result = withRedirect('/auth/login', '/app/profile');
    expect(result).toBe('/auth/login?redirect=%2Fapp%2Fprofile');
  });

  it('handles paths with special characters', () => {
    const result = withRedirect('/auth/login', '/app/records?vin=ABC');
    expect(result).toContain('redirect=');
    expect(result).toContain('/auth/login');
  });
});
