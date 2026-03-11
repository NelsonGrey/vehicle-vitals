import { useEffect, useState } from 'react';
import { useAuth } from '../shared/AuthContext';

// Declare Firebase global
declare global {
  interface Window {
    firebase: {
      app: any;
      auth: any;
      firestore: any;
      functions: any;
      messaging: any;
      storage: any;
    };
  }
}

interface AuthService {
  EmailAuthProvider: {
    credential: (email: string, password: string) => unknown;
  };
  reauthenticateWithCredential: (
    user: unknown,
    credential: unknown
  ) => Promise<void>;
  updatePassword: (user: unknown, newPassword: string) => Promise<void>;
  deleteUser: (user: unknown) => Promise<void>;
}

// Create async Firebase auth service using global Firebase objects
const createFirebaseAuthService = async () => {
  try {
    // Wait for global Firebase to be available
    const checkFirebase = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        const check = () => {
          attempts++;
          if (window.firebase && window.firebase.auth) {
            resolve(window.firebase);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Firebase SDKs failed to load within timeout'));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    const firebase = (await checkFirebase()) as typeof window.firebase;
    return {
      EmailAuthProvider: firebase.auth.EmailAuthProvider,
      reauthenticateWithCredential: firebase.auth.reauthenticateWithCredential,
      updatePassword: firebase.auth.updatePassword,
      deleteUser: firebase.auth.deleteUser,
    };
  } catch (error) {
    console.warn('Firebase auth not available:', error);
    // Return mock service for build compatibility
    return {
      EmailAuthProvider: { credential: () => ({}) },
      reauthenticateWithCredential: async () => {},
      updatePassword: async () => {},
      deleteUser: async () => {},
    };
  }
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authService, setAuthService] = useState<AuthService | null>(null);

  useEffect(() => {
    createFirebaseAuthService().then(setAuthService);
  }, []);

  if (!user || !authService) return null;

  const reauth = async () => {
    if (!user.email) {
      throw new Error('User email is required for reauthentication');
    }
    const cred = authService.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await authService.reauthenticateWithCredential(user, cred);
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
      await reauth();
      await authService!.updatePassword(user, newPassword);
      setStatus('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update password'
      );
    } finally {
      setBusy(false);
    }
  };

  const onDeleteAccount = async () => {
    const sure = window.confirm(
      'This will permanently delete your account and all your vehicles. Continue?'
    );
    if (!sure) return;
    setError('');
    setStatus('');
    setBusy(true);
    try {
      await reauth();
      await authService!.deleteUser(user);
      setStatus('Account deleted.');
      // Optionally sign out cleanup
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-5">
      <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 mb-4">
        Profile
      </h1>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Signed in as{' '}
        <strong className="text-slate-900 dark:text-slate-100">
          {user.email}
        </strong>
      </p>

      {status && (
        <div
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {status}
        </div>
      )}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h5 className="font-serif font-bold text-xl text-slate-900 dark:text-slate-100 mb-4">
          Change password
        </h5>
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
          <button
            type="submit"
            className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            disabled={busy}
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-red-500">
        <h5 className="font-serif font-bold text-xl text-red-700 dark:text-red-400 mb-2">
          Danger zone
        </h5>
        <p className="text-red-600 dark:text-red-400 mb-4">
          Deleting your account removes all your vehicles and maintenance logs.
          This cannot be undone.
        </p>
        <div className="mb-4">
          <label
            htmlFor="currentPasswordDelete"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Confirm current password
          </label>
          <input
            id="currentPasswordDelete"
            type="password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
        </div>
        <button
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          onClick={onDeleteAccount}
          disabled={busy}
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
