import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useCallback, useMemo, useState } from 'react';
import { auth } from '../shared/firebaseConfig';

interface EnvironmentGateProps {
  children: React.ReactNode;
  environment: string;
}

// This gate's own "authorized" state is tracked here, deliberately separate
// from Firebase Auth's `user` -- see the note in handleSignIn for why.
const GATE_SESSION_KEY = 'vv_env_gate_authorized';
const GATE_EMAIL_KEY = 'vv_env_gate_email';

/**
 * OAuth-based environment gate using Firebase Auth + Google Sign-In.
 *
 * Configuration via environment variables:
 * - VITE_ALLOWED_EMAIL_DOMAINS: comma-separated domains (e.g., "company.com,trusted.org")
 * - VITE_ALLOWED_EMAILS: comma-separated exact emails (e.g., "alice@example.com,bob@example.com")
 *
 * Access is granted if:
 * 1. User's email domain matches an allowed domain, OR
 * 2. User's email matches an entry in allowed emails list
 *
 * If no allowlist is configured, access is denied (fails closed).
 *
 * Restored 2026-09-01 after being deleted as unreferenced dead code on
 * 2026-07-10 -- it had been unmounted (App.tsx stopped rendering it) back
 * on 2026-05-11, which is also why it was never caught being broken: the
 * original wiring placed it *outside* <AuthProvider>, so its useAuth() call
 * never saw a signed-in user. This restore renders it *inside*
 * <AuthProvider> instead (see App.tsx) so `user` is actually populated.
 *
 * 2026-09-09: stopped using AuthContext's `user`/`onAuthStateChanged` for
 * the gate's own authorized state. The gate's Google Sign-In shares the
 * exact same Firebase Auth instance as the app's real login -- passing the
 * gate was silently also signing the visitor into the app itself (as that
 * Google account), and App.tsx's MarketingRoute then redirected them straight
 * to /app, so they never actually saw the marketing pages at all. Now the
 * gate signs back out of the shared Firebase Auth session immediately after
 * confirming the email is allowlisted, and remembers "this tab passed the
 * gate" via sessionStorage instead -- so passing the gate no longer implies
 * being logged into the app. Logging into the app is a separate, deliberate
 * step via the normal Login page, unaffected by this gate.
 */
export default function EnvironmentGate({
  children,
  environment,
}: EnvironmentGateProps) {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    try {
      return sessionStorage.getItem(GATE_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [authorizedEmail, setAuthorizedEmail] = useState(() => {
    try {
      return sessionStorage.getItem(GATE_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // The gate protects the *publicly reachable* non-prod deployments
  // (vehicle-vitals-{dev,staging}.web.app). A local dev server is not a
  // public attack surface, and gating it would neuter the Playwright UAT
  // suite (tests/uat.spec.ts), which relies on the email/password auth UI
  // being reachable. So skip the gate on localhost.
  const isLocalhost =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(window.location.hostname);

  // Environments that require gate authentication
  const requiresAuth =
    !isLocalhost &&
    (environment === 'staging' || environment === 'development');

  const allowedConfig = useMemo(() => {
    const domains = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || '')
      .split(',')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean);

    const emails = (import.meta.env.VITE_ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    return { domains, emails };
  }, []);

  // Check if user email is authorized
  const isEmailAuthorized = useCallback(
    (userEmail: string | null | undefined): boolean => {
      if (!userEmail) return false;

      const { domains, emails } = allowedConfig;

      // If no allowlist is configured, deny access
      if (domains.length === 0 && emails.length === 0) {
        return false;
      }

      // Check exact email match
      if (emails.includes(userEmail.toLowerCase())) {
        return true;
      }

      // Check domain match
      const [, domain] = userEmail.split('@');
      if (domain && domains.includes(domain.toLowerCase())) {
        return true;
      }

      return false;
    },
    [allowedConfig]
  );

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setError('');
    setIsSigningIn(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      const signedInEmail = credential.user.email;

      if (isEmailAuthorized(signedInEmail)) {
        try {
          sessionStorage.setItem(GATE_SESSION_KEY, '1');
          sessionStorage.setItem(GATE_EMAIL_KEY, signedInEmail || '');
        } catch {
          // sessionStorage unavailable (private mode, etc.) -- gate still
          // works for this render, just won't survive a reload.
        }
        setAuthorizedEmail(signedInEmail || '');
        setIsAuthorized(true);
        setError('');
      } else {
        setError(
          `Your email (${signedInEmail}) is not authorized to access this environment.`
        );
      }

      // Always sign back out of the shared Firebase Auth session -- this is
      // a team-access gate, not an app login. See the class doc comment.
      await signOut(auth).catch(() => {});
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code !== 'auth/popup-closed-by-user') {
        setError(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Out (of the gate itself, not the app)
  const handleSignOut = () => {
    try {
      sessionStorage.removeItem(GATE_SESSION_KEY);
      sessionStorage.removeItem(GATE_EMAIL_KEY);
    } catch {
      // ignore
    }
    setAuthorizedEmail('');
    setIsAuthorized(false);
  };

  if (!requiresAuth) {
    return <>{children}</>;
  }

  // If authorized, render children
  if (isAuthorized) {
    return (
      <div>
        {children}
        {/* Subtle indicator showing gate-authorized email with revoke button */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors shadow-lg"
            title={`Team access granted to ${authorizedEmail}`}
          >
            {authorizedEmail} (Revoke access)
          </button>
        </div>
      </div>
    );
  }

  // Gate screen - not authorized for this tab/session
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 mb-2">
            {environment.charAt(0).toUpperCase() + environment.slice(1)}{' '}
            Environment
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This is a restricted {environment} environment. Access is controlled
            via team authorization.
          </p>

          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}
        </div>

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access is managed via team authorization. Contact your team lead if
            you don't have access.
          </p>
        </div>
      </div>
    </div>
  );
}
