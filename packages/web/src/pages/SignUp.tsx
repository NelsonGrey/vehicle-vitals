import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setBusy(false);
      return;
    }
    try {
      await signUp(email, password);
      navigate('/app', { replace: true });
    } catch (err: unknown) {
      const error = err as Error;
      const msg = String(error?.message || 'Failed to create account');
      const hint = msg.includes('api-key-not-valid')
        ? ' (Check VITE_FIREBASE_* env vars; see web/.env.example)'
        : '';
      setError(msg + hint);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
      <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 mb-2 text-center">
        Create your account
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
        Set up your secure account and start managing your vehicle records.
      </p>
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="mb-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
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
              className="w-full px-3 py-2 pr-24 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
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
        <div className="mb-6">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-24 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(value => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          disabled={busy}
        >
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:bg-slate-100 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithGoogle();
                navigate('/app', { replace: true });
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
            className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:bg-slate-100 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithApple();
                navigate('/app', { replace: true });
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
        Already have an account?{' '}
        <Link
          to="/auth/login"
          className="text-slate-700 dark:text-slate-300 hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
