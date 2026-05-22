import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../shared/AuthContext';
import { bootstrapEnterpriseContext } from '../shared/entitlementsService';
import {
  applyRetentionPolicy,
  getOrganizationMembers,
  searchSupportUsers,
  setOrganizationMemberRole,
} from '../utils/supportAdminService';

interface SupportUserSummary {
  uid: string;
  email: string;
  displayName: string;
  disabled: boolean;
  createdAt: string;
  lastSignInTime: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  vehicleCount: number;
  premiumActive: boolean;
  premiumVerified: boolean;
  vehicleLimit: number;
  accessReason: string;
}

interface OrganizationMember {
  uid: string;
  email?: string;
  role?: string;
  status?: string;
}

const ORG_ROLES = [
  'org_owner',
  'org_admin',
  'billing_admin',
  'support_agent',
  'read_only',
];

function createIdempotencyKey(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminSupport() {
  const { user, supportAccess } = useAuth();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<SupportUserSummary[]>([]);
  const [orgId, setOrgId] = useState('');
  const [retentionDays, setRetentionDays] = useState(365);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  const accessLabel = useMemo(() => {
    if (!supportAccess?.isSuperAdmin) {
      return 'No support access';
    }

    return supportAccess.accessReason || 'Support access enabled';
  }, [supportAccess]);

  useEffect(() => {
    if (!supportAccess?.isSuperAdmin) {
      return;
    }

    const initialize = async () => {
      setLoading(true);
      setError('');
      setStatus('');

      try {
        const [response, enterpriseContext] = await Promise.all([
          searchSupportUsers(''),
          bootstrapEnterpriseContext(),
        ]);
        setResults(response.results as SupportUserSummary[]);
        setOrgId(enterpriseContext.orgId || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load users');
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [supportAccess]);

  useEffect(() => {
    if (!supportAccess?.isSuperAdmin || !orgId) {
      setMembers([]);
      return;
    }

    const loadMembers = async () => {
      setMembersLoading(true);
      setError('');

      try {
        const response = await getOrganizationMembers(orgId);
        setMembers(response.members as OrganizationMember[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load organization members'
        );
      } finally {
        setMembersLoading(false);
      }
    };

    void loadMembers();
  }, [orgId, supportAccess]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supportAccess?.isSuperAdmin) {
      return;
    }

    setLoading(true);
    setSubmittedQuery(query.trim());
    setError('');
    setStatus('');

    try {
      const response = await searchSupportUsers(query.trim());
      setResults(response.results as SupportUserSummary[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRetention = async () => {
    if (!supportAccess?.isSuperAdmin || !orgId) {
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await applyRetentionPolicy({
        orgId,
        retentionDays,
        idempotencyKey: createIdempotencyKey('retention'),
      });

      setStatus(
        `Retention policy updated for ${response.orgId} to ${response.retentionDays} days.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to apply retention policy'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (targetUid: string, role: string) => {
    if (!supportAccess?.isSuperAdmin || !orgId || !targetUid) {
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      await setOrganizationMemberRole({
        orgId,
        targetUid,
        role,
        idempotencyKey: createIdempotencyKey('member_role'),
      });

      const refreshed = await getOrganizationMembers(orgId);
      setMembers(refreshed.members as OrganizationMember[]);
      setStatus(`Updated ${targetUid} role to ${role}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update organization role'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-6rem)] bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
            Super-administrator
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">
            Support Console
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Oversight and support tooling for user accounts, subscription state,
            and premium entitlements.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Signed in as
              </div>
              <div className="mt-1 text-sm font-medium">
                {user?.email || 'Unknown'}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Access
              </div>
              <div className="mt-1 text-sm font-medium">{accessLabel}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Active org
              </div>
              <input
                value={orgId}
                onChange={event => setOrgId(event.target.value.trim())}
                placeholder="Organization ID"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Organization Controls
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
              Retention days
              <input
                type="number"
                min={30}
                max={3650}
                value={retentionDays}
                onChange={event =>
                  setRetentionDays(Number(event.target.value || 365))
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <button
              type="button"
              onClick={handleApplyRetention}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !supportAccess?.isSuperAdmin || !orgId}
            >
              Apply retention policy
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Organization Members
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Member
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Role
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.uid} className="align-top">
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {member.email || 'No email'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {member.uid}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      {member.status || 'unknown'}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      <select
                        defaultValue={member.role || 'read_only'}
                        onChange={event => {
                          void handleRoleUpdate(member.uid, event.target.value);
                        }}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        {ORG_ROLES.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Change role from dropdown
                      </span>
                    </td>
                  </tr>
                ))}
                {!membersLoading && members.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No organization members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by email, UID, or name"
              className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-950"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !supportAccess?.isSuperAdmin}
            >
              {loading ? 'Searching...' : 'Search users'}
            </button>
          </form>

          {error && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}

          {status && (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {status}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                User results
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {submittedQuery
                  ? `Showing matches for "${submittedQuery}"`
                  : 'Showing the first accessible support page of users'}
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {results.length} result{results.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    User
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Tier
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Vehicles
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Premium
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold dark:border-slate-700">
                    Access
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.uid} className="align-top">
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {result.displayName || 'Unnamed user'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {result.email || 'No email'} - {result.uid}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      {result.subscriptionTier}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      {result.vehicleCount} / {result.vehicleLimit}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      {result.premiumActive ? 'Active' : 'Inactive'}
                      {result.premiumVerified ? ' - Verified' : ''}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 dark:border-slate-800">
                      <div>{result.subscriptionStatus}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {result.disabled ? 'Auth disabled' : 'Auth enabled'}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && results.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No matching users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
