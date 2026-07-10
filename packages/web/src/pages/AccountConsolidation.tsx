import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import {
  getHouseholdGarageStatus,
  promotePersonalGarageToHousehold,
  type HouseholdGarageStatus,
} from '../utils/householdGarageService';

export default function AccountConsolidation() {
  const { user, requestAccountConsolidation, consolidateAccountData } =
    useAuth();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [consolidationSourceUid, setConsolidationSourceUid] = useState('');
  const [consolidationCode, setConsolidationCode] = useState('');
  const [consolidationCodeSentTo, setConsolidationCodeSentTo] = useState('');
  const [requestCodeBusy, setRequestCodeBusy] = useState(false);
  const [consolidationBusy, setConsolidationBusy] = useState(false);
  const [consolidationResult, setConsolidationResult] = useState<{
    vehiclesMigrated: number;
    vehicleSkipped: number;
    migratedVins: string[];
  } | null>(null);

  const [householdStatus, setHouseholdStatus] =
    useState<HouseholdGarageStatus | null>(null);
  const [householdStatusLoading, setHouseholdStatusLoading] = useState(true);
  const [householdName, setHouseholdName] = useState('');
  const [householdBusy, setHouseholdBusy] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadHouseholdStatus = async () => {
      if (!user) return;
      setHouseholdStatusLoading(true);
      try {
        const result = await getHouseholdGarageStatus();
        if (!isActive) return;
        setHouseholdStatus(result);
        if (result.name) {
          setHouseholdName(result.name);
        }
      } catch (householdError) {
        console.warn('Unable to load household garage status', householdError);
      } finally {
        if (isActive) {
          setHouseholdStatusLoading(false);
        }
      }
    };

    void loadHouseholdStatus();

    return () => {
      isActive = false;
    };
  }, [user]);

  if (!user) return null;

  const handleRequestConsolidationCode = async () => {
    if (!consolidationSourceUid.trim()) {
      setError('Please enter the source account UID');
      return;
    }

    if (consolidationSourceUid.trim() === user.uid) {
      setError('Cannot consolidate an account with itself');
      return;
    }

    setError('');
    setStatus('');
    setRequestCodeBusy(true);

    try {
      const result = await requestAccountConsolidation(
        consolidationSourceUid.trim()
      );
      if (result.success) {
        setConsolidationCodeSentTo(result.sentTo);
        setStatus(
          `We sent a verification code to ${result.sentTo}. Enter it below to confirm the merge — only the owner of that account can see this code.`
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send verification code';
      setError(errorMessage);
    } finally {
      setRequestCodeBusy(false);
    }
  };

  const handleConsolidateAccount = async () => {
    if (!consolidationSourceUid.trim()) {
      setError('Please enter the source account UID');
      return;
    }

    if (!consolidationCode.trim()) {
      setError('Please enter the verification code sent to that account');
      return;
    }

    const sure = window.confirm(
      `This will merge all vehicles and data from account ${consolidationSourceUid} into your current account. This action cannot be undone. Continue?`
    );
    if (!sure) return;

    setError('');
    setStatus('');
    setConsolidationBusy(true);
    setConsolidationResult(null);

    try {
      const result = await consolidateAccountData({
        sourceUid: consolidationSourceUid.trim(),
        verificationCode: consolidationCode.trim(),
      });
      if (result.success) {
        setStatus(
          `Successfully migrated ${result.vehiclesMigrated} vehicle(s) from the source account.${
            result.vehicleSkipped
              ? ` ${result.vehicleSkipped} vehicle(s) were skipped (already exist).`
              : ''
          }`
        );
        setConsolidationResult({
          vehiclesMigrated: result.vehiclesMigrated,
          vehicleSkipped: result.vehicleSkipped,
          migratedVins: result.migratedVins,
        });
        setConsolidationSourceUid('');
        setConsolidationCode('');
        setConsolidationCodeSentTo('');
      } else {
        setError(result.message || 'Account consolidation failed');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to consolidate accounts';
      setError(errorMessage);
    } finally {
      setConsolidationBusy(false);
    }
  };

  const handlePromoteToHousehold = async () => {
    if (!householdName.trim()) {
      setError('Please name your household garage');
      return;
    }

    const sure = window.confirm(
      'This will convert your personal garage into a shared household garage. Your existing vehicles will be copied into the shared garage. Continue?'
    );
    if (!sure) return;

    setError('');
    setStatus('');
    setHouseholdBusy(true);

    try {
      const result = await promotePersonalGarageToHousehold({
        householdName: householdName.trim(),
      });
      setHouseholdStatus({
        success: true,
        orgId: result.orgId,
        orgType: result.orgType,
        garageStorageMode: result.garageStorageMode,
        name: result.name,
      });
      setStatus(
        `${result.name} is now a household garage. ${result.vehiclesCopied} vehicle(s) were copied into the shared garage.`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create household garage';
      setError(errorMessage);
    } finally {
      setHouseholdBusy(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
          Merge &amp; Share Garage
        </h1>
        <Link
          to="/app/profile"
          className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
        >
          Back
        </Link>
      </div>

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

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 space-y-6">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 m-0">
          Account Consolidation
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-0">
          If you have a split account (same email across web and mobile but
          different accounts), use this tool to merge vehicles and data from
          your secondary account into this primary account.
        </p>
        <div className="rounded-lg border border-warning-300 dark:border-warning-700 bg-warning-50 dark:bg-warning-950/30 px-4 py-3">
          <p className="text-sm text-warning-900 dark:text-warning-200 m-0">
            <strong>How to find your secondary account UID:</strong> Sign in to
            the other account on web or mobile, then look for the User ID in
            Account settings.
          </p>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
          <div>
            <label
              htmlFor="consolidationSourceUid"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              Source Account UID
            </label>
            <input
              id="consolidationSourceUid"
              type="text"
              value={consolidationSourceUid}
              onChange={e => {
                setConsolidationSourceUid(e.target.value);
                setConsolidationCodeSentTo('');
                setConsolidationCode('');
              }}
              placeholder="Paste the UID from your secondary account"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          {!consolidationCodeSentTo ? (
            <button
              type="button"
              onClick={() => void handleRequestConsolidationCode()}
              disabled={requestCodeBusy || !consolidationSourceUid.trim()}
              className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {requestCodeBusy ? 'Sending code…' : 'Send Verification Code'}
            </button>
          ) : (
            <>
              <div>
                <label
                  htmlFor="consolidationCode"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  Verification Code
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-2">
                  Sent to {consolidationCodeSentTo}. Only the owner of that
                  account can retrieve this code.
                </p>
                <input
                  id="consolidationCode"
                  type="text"
                  inputMode="numeric"
                  value={consolidationCode}
                  onChange={e => setConsolidationCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleConsolidateAccount()}
                  disabled={consolidationBusy || !consolidationCode.trim()}
                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {consolidationBusy ? 'Merging…' : 'Confirm & Merge'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRequestConsolidationCode()}
                  disabled={requestCodeBusy}
                  className="text-sm text-slate-600 dark:text-slate-300 underline"
                >
                  {requestCodeBusy ? 'Sending…' : 'Resend code'}
                </button>
              </div>
            </>
          )}

          {consolidationResult && (
            <div className="rounded-lg border border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-950/30 px-4 py-3">
              <p className="text-sm text-accent-900 dark:text-accent-200 m-0 mb-2">
                <strong>Consolidation successful!</strong>
              </p>
              <ul className="text-sm text-accent-800 dark:text-accent-300 m-0 pl-5">
                <li>
                  Migrated vehicles: {consolidationResult.vehiclesMigrated}
                </li>
                {consolidationResult.vehicleSkipped > 0 && (
                  <li>
                    Skipped vehicles: {consolidationResult.vehicleSkipped}{' '}
                    (already in your account)
                  </li>
                )}
                {consolidationResult.migratedVins.length > 0 && (
                  <li>
                    Vehicle IDs: {consolidationResult.migratedVins.join(', ')}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-4">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 m-0">
          Household Garage
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-0">
          Share one garage with your household so everyone sees the same
          vehicles, records, and reminders.
        </p>

        {householdStatusLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
            Loading household status…
          </p>
        ) : householdStatus?.orgType === 'household' ? (
          <div className="rounded-lg border border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-950/30 px-4 py-3 space-y-1">
            <p className="text-sm text-accent-900 dark:text-accent-200 m-0">
              <strong>{householdStatus.name || 'Household Garage'}</strong> is a
              shared household garage.
            </p>
            <p className="text-xs text-accent-800 dark:text-accent-300 m-0">
              Storage mode:{' '}
              {householdStatus.garageStorageMode === 'org_scoped'
                ? 'Shared only'
                : 'Shared (dual write)'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">
              TODO: inviting additional members to this household is not yet
              available.
            </p>
          </div>
        ) : (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <div>
              <label
                htmlFor="householdName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
              >
                Household garage name
              </label>
              <input
                id="householdName"
                type="text"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                placeholder="e.g. The Nelson Household"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              Your existing vehicles will be copied into the shared garage. You
              remain the owner and keep access to your personal garage.
            </p>
            <button
              type="button"
              onClick={() => void handlePromoteToHousehold()}
              disabled={householdBusy || !householdName.trim()}
              className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {householdBusy ? 'Creating…' : 'Create Household Garage'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
