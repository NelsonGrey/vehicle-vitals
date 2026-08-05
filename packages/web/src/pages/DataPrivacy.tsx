import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { useReauthentication } from '../shared/useReauthentication';
import { userFacingError } from '../shared/userFacingError';
import {
  requestAccountDataDeletion,
  requestAccountDataExport,
} from '../utils/privacyRequestService';

export function DataPrivacyContent() {
  const { user, reauthenticateWithGoogle, reauthenticateWithApple } = useAuth();
  const { reauth } = useReauthentication({
    user,
    reauthenticateWithGoogle,
    reauthenticateWithApple,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const onRequestAccountDeletion = async () => {
    const sure = window.confirm(
      'This will file a request to delete your account and all associated vehicle, maintenance, and subscription data. This cannot be undone once processed. Continue?'
    );
    if (!sure) return;
    setError('');
    setStatus('');
    setBusy(true);
    try {
      await reauth(currentPassword);
      const result = await requestAccountDataDeletion();
      setStatus(
        `Account deletion request filed (request ${result.requestId}). Your data will be deleted as part of processing this request; you remain signed in until then.`
      );
    } catch (err) {
      setError(
        userFacingError(
          err,
          'The deletion request could not be filed. No account data was changed. Please try again or visit Support.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const onRequestDataExport = async () => {
    setError('');
    setStatus('');
    setBusy(true);
    try {
      await reauth(currentPassword);
      const result = await requestAccountDataExport();
      setStatus(
        `Data export request filed (request ${result.requestId}). We'll notify you when it's ready.`
      );
    } catch (err) {
      setError(
        userFacingError(
          err,
          'The data export request could not be filed. Please try again or visit Support.'
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

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-danger-500 space-y-6">
        <h2 className="font-serif font-bold text-2xl text-danger-700 dark:text-danger-400 m-0">
          Privacy &amp; Data Requests
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-0">
          Request a copy of your data, or request deletion of your account and
          all associated vehicle, maintenance, and subscription data. Deletion
          requests are processed by our team and cannot be undone; you remain
          signed in until a deletion request has been processed. We use the
          account email for status updates and any required identity
          verification. Processing time depends on the request and applicable
          legal or retention requirements.
        </p>
        <div>
          <label
            htmlFor="currentPasswordDelete"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Confirm current password
          </label>
          <input
            id="currentPasswordDelete"
            type="password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-danger-500 dark:bg-slate-700 dark:text-slate-100"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            onClick={() => void onRequestDataExport()}
            disabled={busy}
          >
            Request My Data Export
          </button>
          <button
            className="bg-danger-600 hover:bg-danger-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            onClick={() => void onRequestAccountDeletion()}
            disabled={busy}
          >
            Request Account Deletion
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataPrivacy() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
          Data &amp; Privacy
        </h1>
        <Link
          to="/app/profile"
          className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
        >
          Back
        </Link>
      </div>
      <DataPrivacyContent />
    </div>
  );
}
