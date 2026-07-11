import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { coerceFirestoreTimestamp } from '../shared/firestoreTimestamp';
import { useFeatureFlag } from '../shared/useMonetization';
import {
  createApiAccessKey,
  getZapierWebhookConfig,
  listApiAccessKeys,
  revokeApiAccessKey,
} from '../utils/apiAccessService';

interface UserApiAccessKey {
  keyId: string;
  label: string;
  keyPrefix: string;
  active: boolean;
  createdAt?: unknown;
  lastUsedAt?: unknown;
  revokedAt?: unknown;
}

function formatTimestamp(value: unknown): string {
  if (!value) {
    return '—';
  }

  const date = coerceFirestoreTimestamp(value);
  if (date) {
    return date.toLocaleString();
  }

  return typeof value === 'string' ? value : '—';
}

export default function ApiAutomation() {
  const { user } = useAuth();
  const hasApiAccess = useFeatureFlag('api_access');
  const hasZapierIntegration = useFeatureFlag('zapier_integration');

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [apiAccessKeys, setApiAccessKeys] = useState<UserApiAccessKey[]>([]);
  const [apiAccessLoading, setApiAccessLoading] = useState(false);
  const [apiAccessBusy, setApiAccessBusy] = useState(false);
  const [apiKeyLabel, setApiKeyLabel] = useState('');
  const [createdApiKeySecret, setCreatedApiKeySecret] = useState('');
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('');
  const [zapierInstructions, setZapierInstructions] = useState('');
  const [zapierRequiresSignature, setZapierRequiresSignature] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadApiAccessState = async () => {
      if (!user || !hasApiAccess) {
        setApiAccessKeys([]);
        setCreatedApiKeySecret('');
        setZapierWebhookUrl('');
        setZapierInstructions('');
        setZapierRequiresSignature(false);
        return;
      }

      setApiAccessLoading(true);
      try {
        const [keys, webhookConfig] = await Promise.all([
          listApiAccessKeys(),
          hasZapierIntegration
            ? getZapierWebhookConfig().catch(() => ({
                webhookUrl: '',
                instructions: '',
                requiresSignature: false,
              }))
            : Promise.resolve({
                webhookUrl: '',
                instructions: '',
                requiresSignature: false,
              }),
        ]);

        if (!isActive) {
          return;
        }

        setApiAccessKeys(Array.isArray(keys) ? keys : []);
        setZapierWebhookUrl((webhookConfig.webhookUrl || '').toString());
        setZapierInstructions((webhookConfig.instructions || '').toString());
        setZapierRequiresSignature(Boolean(webhookConfig.requiresSignature));
      } catch (integrationError) {
        if (!isActive) {
          return;
        }

        setError(
          integrationError instanceof Error
            ? integrationError.message
            : 'Failed to load API access configuration'
        );
      } finally {
        if (isActive) {
          setApiAccessLoading(false);
        }
      }
    };

    void loadApiAccessState();

    return () => {
      isActive = false;
    };
  }, [user, hasApiAccess, hasZapierIntegration]);

  if (!user) return null;

  const handleCreateApiKey = async () => {
    setApiAccessBusy(true);
    setError('');
    setStatus('');
    try {
      const result = await createApiAccessKey(apiKeyLabel);
      const keys = await listApiAccessKeys();
      setApiAccessKeys(Array.isArray(keys) ? keys : []);
      setApiKeyLabel('');
      setCreatedApiKeySecret((result.rawKey || '').toString());
      setStatus(
        'API key created. Copy it now, this is the only time it is shown.'
      );
    } catch (integrationError) {
      setError(
        integrationError instanceof Error
          ? integrationError.message
          : 'Failed to create API key'
      );
    } finally {
      setApiAccessBusy(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    setApiAccessBusy(true);
    setError('');
    setStatus('');
    try {
      await revokeApiAccessKey(keyId);
      const keys = await listApiAccessKeys();
      setApiAccessKeys(Array.isArray(keys) ? keys : []);
      setStatus('API key revoked. Requests using that key will now fail.');
    } catch (integrationError) {
      setError(
        integrationError instanceof Error
          ? integrationError.message
          : 'Failed to revoke API key'
      );
    } finally {
      setApiAccessBusy(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
          API &amp; Automation
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

      {!hasApiAccess ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          API access is not enabled for this account.
        </p>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-5">
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-0">
            Manage API access keys for integrations and automation tools.
          </p>

          {createdApiKeySecret && (
            <div className="rounded-lg border border-warning-300 dark:border-warning-700 bg-warning-50 dark:bg-warning-950/30 px-4 py-3">
              <p className="text-xs text-warning-700 dark:text-warning-300 mt-0 mb-1">
                New API key (shown once)
              </p>
              <code className="text-sm break-all text-warning-900 dark:text-warning-200">
                {createdApiKeySecret}
              </code>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <label
              htmlFor="apiKeyLabel"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Key label
            </label>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                id="apiKeyLabel"
                type="text"
                value={apiKeyLabel}
                onChange={event => setApiKeyLabel(event.target.value)}
                placeholder="Zapier production"
                className="min-w-[220px] flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => void handleCreateApiKey()}
                disabled={apiAccessBusy || apiAccessLoading}
                className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                {apiAccessBusy ? 'Working…' : 'Create API Key'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0 mb-0">
              Active and historical keys
            </h3>
            {apiAccessLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
                Loading keys...
              </p>
            ) : apiAccessKeys.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
                No API keys created yet.
              </p>
            ) : (
              <div className="space-y-2">
                {apiAccessKeys.map(key => (
                  <div
                    key={key.keyId}
                    className="rounded-md border border-slate-200 dark:border-slate-700 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 mt-0 mb-1">
                          {key.label || 'Untitled key'} ({key.keyPrefix}...)
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                          Created: {formatTimestamp(key.createdAt)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                          Last used: {formatTimestamp(key.lastUsedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            key.active
                              ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {key.active ? 'Active' : 'Revoked'}
                        </span>
                        {key.active && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => void handleRevokeApiKey(key.keyId)}
                              disabled={apiAccessBusy}
                              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-medium py-1.5 px-3 rounded-md transition-colors duration-200 disabled:opacity-60"
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasZapierIntegration && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0 mb-0">
                Zapier webhook endpoint
              </h3>
              {zapierWebhookUrl ? (
                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
                    Webhook URL
                  </p>
                  <code className="text-sm break-all text-slate-900 dark:text-slate-100">
                    {zapierWebhookUrl}
                  </code>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">
                    {zapierInstructions ||
                      'Use POST and send your API key in the x-api-key header.'}
                  </p>
                  {zapierRequiresSignature && (
                    <p className="text-xs text-warning-600 dark:text-warning-400 mt-2 mb-0">
                      This environment requires request signing via
                      x-vv-signature.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
                  Webhook configuration will appear once it is available for
                  your environment.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
