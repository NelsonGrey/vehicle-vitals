import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await resetPassword(email);
      setSuccess(
        'Password reset email sent. Check your inbox for the next steps.'
      );
    } catch (err: unknown) {
      const message = String(
        (err as Error)?.message || 'Failed to send password reset email'
      );
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
      <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 mb-2 text-center">
        Forgot Password
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
        Enter the email address you used for your account and we will send a
        reset link.
      </p>

      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-lg mb-4"
          role="status"
        >
          {success}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
        >
          {busy ? 'Sending reset link...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        Remembered your password?{' '}
        <Link
          to="/auth/login"
          className="text-slate-700 dark:text-slate-300 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
