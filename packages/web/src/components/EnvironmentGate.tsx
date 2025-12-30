import { getAuth, signInAnonymously } from 'firebase/auth';
import { useState } from 'react';

interface EnvironmentGateProps {
  children: React.ReactNode;
  environment: string;
}

export default function EnvironmentGate({
  children,
  environment,
}: EnvironmentGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Only show gate for staging and development
  const requiresAuth =
    environment === 'staging' || environment === 'development';

  if (!requiresAuth) {
    return <>{children}</>;
  }

  // Get the correct password for this environment
  const getEnvironmentPassword = () => {
    switch (environment) {
      case 'staging':
        return import.meta.env.VITE_ACCESS_PASSWORD_STAGING || 'staging2025';
      case 'development':
        return import.meta.env.VITE_ACCESS_PASSWORD_DEVELOPMENT || 'dev2025';
      default:
        return 'access2025';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const correctPassword = getEnvironmentPassword();

    if (password === correctPassword) {
      try {
        // Sign in anonymously for Firebase access
        const auth = getAuth();
        await signInAnonymously(auth);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Anonymous sign in failed:', error);
        // Still allow access even if anonymous sign in fails
        setIsAuthenticated(true);
      }
    } else {
      setError('Incorrect password. Please try again.');
    }

    setIsLoading(false);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

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
          <p className="text-slate-600 dark:text-slate-400">
            This is a {environment} environment. Access is restricted.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Access Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder={`Enter ${environment} password`}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? 'Authenticating...' : 'Access Environment'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Contact the development team for access credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
