import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppOfflineNotice from '../components/AppOfflineNotice';
import { useAuth } from '../shared/AuthContext';
import { getRedirectQueryParam, withRedirect } from '../shared/authRedirect';
import { useAppOffline } from '../shared/useAppOffline';
// Header and footer provided by Layout

export default function Login() {
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const isAppOffline = useAppOffline();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = getRedirectQueryParam(location.search);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const msg = String((err as Error)?.message || 'Failed to sign in');
      const hint = msg.includes('api-key-not-valid')
        ? ' (Check VITE_FIREBASE_* env vars; see web/.env.example)'
        : '';
      setError(msg + hint);
    } finally {
      setBusy(false);
    }
  };

  if (isAppOffline) {
    return <AppOfflineNotice />;
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
      <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 text-center mb-2">
        Sign in to Vehicle-Vitals
      </h1>
      <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
        Access your secure garage, timeline, and upcoming maintenance.
      </p>
      {error && (
        <div
          className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200 p-3 rounded-lg mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-24 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            className="px-4 py-2.5 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithGoogle();
                navigate(redirect, { replace: true });
              } catch (err: unknown) {
                const error = err as Error;
                setError(String(error?.message || 'Google sign-in failed'));
              } finally {
                setBusy(false);
              }
            }}
          >
            Continue with Google
          </button>
          <button
            type="button"
            className="px-4 py-2.5 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithApple();
                navigate(redirect, { replace: true });
              } catch (err: unknown) {
                const error = err as Error;
                setError(String(error?.message || 'Apple sign-in failed'));
              } finally {
                setBusy(false);
              }
            }}
          >
            Continue with Apple
          </button>
        </div>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        Forgot your password?{' '}
        <Link
          to={withRedirect('/auth/forgot-password', redirect)}
          className="text-slate-700 dark:text-slate-300 hover:underline"
        >
          Reset it
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
        Don't have an account?{' '}
        <Link
          to={withRedirect('/auth/signup', redirect)}
          className="text-slate-700 dark:text-slate-300 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
