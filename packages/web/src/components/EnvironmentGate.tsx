import { useEffect, useState } from 'react';
import { useAuth } from '../shared/AuthContext';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../shared/firebaseConfig';

interface EnvironmentGateProps {
  children: React.ReactNode;
  environment: string;
}

/**
 * OAuth-based environment gate using Firebase Auth + Google Sign-In.
 * Replaces the unreliable password-based approach.
 *
 * Configuration via environment variables:
 * - VITE_ALLOWED_EMAIL_DOMAINS: comma-separated domains (e.g., "company.com,trusted.org")
 * - VITE_ALLOWED_EMAILS: comma-separated exact emails (e.g., "alice@example.com,bob@example.com")
 *
 * Access is granted if:
 * 1. User's email domain matches an allowed domain, OR
 * 2. User's email matches an entry in allowed emails list
 *
 * If no allowlist is configured, access is denied.
 */
export default function EnvironmentGate({
  children,
  environment,
}: EnvironmentGateProps) {
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Environments that require gate authentication
  const requiresAuth =
    environment === 'staging' ||
    environment === 'development' ||
    environment === 'demonstration';

  if (!requiresAuth) {
    return <>{children}</>;
  }

  // Parse allowed emails/domains from environment variables
  const getAllowedConfig = () => {
    const domains = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || '')
      .split(',')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean);

    const emails = (import.meta.env.VITE_ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    return { domains, emails };
  };

  // Check if user email is authorized
  const isEmailAuthorized = (userEmail: string | null | undefined): boolean => {
    if (!userEmail) return false;

    const { domains, emails } = getAllowedConfig();

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
  };

  // Monitor auth state and check authorization
  useEffect(() => {
    setIsLoading(true);
    setError('');

    if (!user) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    // Check if user is authorized
    if (isEmailAuthorized(user.email)) {
      setIsAuthorized(true);
      setError('');
    } else {
      setIsAuthorized(false);
      setError(
        `Your email (${user.email}) is not authorized to access this environment.`
      );
      // Auto sign out unauthorized users
      void signOut(auth).catch(() => {});
    }

    setIsLoading(false);
  }, [user]);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setError('');
    setIsSigningIn(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // Authorization check happens in useEffect above
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code !== 'auth/popup-closed-by-user') {
        setError(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAuthorized(false);
    } catch (err) {
      setError('Failed to sign out. Please try again.');
    }
  };

  // If authorized, render children
  if (isAuthorized) {
    return (
      <div>
        {children}
        {/* Subtle indicator showing authorized email with sign out button */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors shadow-lg"
            title={`Signed in as ${user?.email}`}
          >
            {user?.email} (Sign out)
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  // Gate screen - not authenticated or not authorized
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {environment.charAt(0).toUpperCase() + environment.slice(1)}{' '}
            Environment
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This is a restricted {environment} environment. Access is controlled
            via team authorization.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg p-3 mb-4">
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
