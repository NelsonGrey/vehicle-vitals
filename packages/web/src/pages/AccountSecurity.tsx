import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { useReauthentication } from '../shared/useReauthentication';
import { userFacingError } from '../shared/userFacingError';

export function AccountSecurityContent() {
  const {
    user,
    signOut,
    linkWithGoogle,
    linkWithApple,
    reauthenticateWithGoogle,
    reauthenticateWithApple,
  } = useAuth();
  const { hasGoogle, hasApple, reauth, updatePassword } = useReauthentication({
    user,
    reauthenticateWithGoogle,
    reauthenticateWithApple,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState('');

  if (!user) return null;

  const providerLabels = (user.providerData || [])
    .map(provider => {
      switch (provider.providerId) {
        case 'password':
          return 'Email/Password';
        case 'google.com':
          return 'Google';
        case 'apple.com':
          return 'Apple';
        default:
          return provider.providerId;
      }
    })
    .filter(Boolean);

  const onLinkGoogle = async () => {
    setError('');
    setStatus('');
    setLinkingProvider('google');
    try {
      await linkWithGoogle();
      setStatus('Google sign-in linked to this account.');
    } catch (linkError) {
      setError(
        linkError instanceof Error ? linkError.message : 'Failed to link Google'
      );
    } finally {
      setLinkingProvider('');
    }
  };

  const onLinkApple = async () => {
    setError('');
    setStatus('');
    setLinkingProvider('apple');
    try {
      await linkWithApple();
      setStatus('Apple sign-in linked to this account.');
    } catch (linkError) {
      setError(
        linkError instanceof Error ? linkError.message : 'Failed to link Apple'
      );
    } finally {
      setLinkingProvider('');
    }
  };

  const onChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStatus('');
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await reauth(currentPassword);
      await updatePassword(user, newPassword);
      setStatus('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        userFacingError(
          err,
          'Your password could not be updated. Verify your current password and try again.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {status && (
        <div
          className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          {status}
        </div>
      )}
      {error && (
        <div
          className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4">
          Account Overview
        </h2>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
              Email
            </p>
            <p className="font-medium text-slate-900 dark:text-slate-100 m-0 break-all">
              {user.email}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
              User ID
            </p>
            <p className="font-medium text-slate-900 dark:text-slate-100 m-0 break-all">
              {user.uid}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
              Linked providers
            </p>
            <p className="font-medium text-slate-900 dark:text-slate-100 m-0">
              {providerLabels.length ? providerLabels.join(', ') : 'Unknown'}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {!hasGoogle && (
                <button
                  type="button"
                  onClick={() => void onLinkGoogle()}
                  disabled={Boolean(linkingProvider)}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  {linkingProvider === 'google'
                    ? 'Linking Google...'
                    : 'Link Google'}
                </button>
              )}
              {!hasApple && (
                <button
                  type="button"
                  onClick={() => void onLinkApple()}
                  disabled={Boolean(linkingProvider)}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  {linkingProvider === 'apple'
                    ? 'Linking Apple...'
                    : 'Link Apple'}
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 m-0">
          Change Password
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-4">
          Update your password to keep your account secure.
        </p>
        <form onSubmit={onChangePassword} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              disabled={busy}
            >
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountSecurity() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
            Account &amp; Security
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 mb-0">
            Signed in as{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {user.email}
            </strong>
          </p>
        </div>
        <Link
          to="/app/profile"
          className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
        >
          Back
        </Link>
      </div>
      <AccountSecurityContent />
    </div>
  );
}
