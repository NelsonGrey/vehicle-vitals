import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
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
    <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm p-6 border border-charcoal-200 dark:border-charcoal-700">
      <h1 className="font-serif font-bold text-3xl text-charcoal-800 dark:text-cream-100 mb-2 text-center">
        Create your account
      </h1>
      <p className="text-charcoal-600 dark:text-cream-300 mb-6 text-center">
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
            className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-oxblood-600 hover:bg-oxblood-700 disabled:bg-charcoal-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          disabled={busy}
        >
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            className="border border-charcoal-300 dark:border-charcoal-600 hover:bg-charcoal-50 dark:hover:bg-charcoal-700 disabled:bg-charcoal-100 text-charcoal-700 dark:text-cream-200 font-medium py-2 px-4 rounded-md transition-colors duration-200"
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
            className="border border-charcoal-300 dark:border-charcoal-600 hover:bg-charcoal-50 dark:hover:bg-charcoal-700 disabled:bg-charcoal-100 text-charcoal-700 dark:text-cream-200 font-medium py-2 px-4 rounded-md transition-colors duration-200"
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
      <p className="mt-5 text-center text-sm text-charcoal-600 dark:text-cream-300">
        Already have an account?{' '}
        <Link
          to="/auth/login"
          className="text-oxblood-600 hover:text-oxblood-700 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
