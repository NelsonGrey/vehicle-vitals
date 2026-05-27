import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCallable = vi.fn();
const mockHttpsCallable = vi.fn(() => mockCallable);

vi.mock('../../shared/firebaseConfig', () => ({
  functions: { __testFunctions: true },
}));

vi.mock('../../shared/firebaseLegacy', () => ({
  getLegacyFirebase: vi.fn(),
  getOrInitializeLegacyFirebaseApp: vi.fn(),
  hasLegacyFirebaseModules: vi.fn(() => false),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => mockHttpsCallable(...args),
}));

describe('apiAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an API key and returns plaintext once', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        key: {
          keyId: 'key_123',
          label: 'Zapier',
          keyPrefix: 'vvk_abc123',
        },
        rawKey: 'vvk_secret',
      },
    });

    const { createApiAccessKey } = await import('../apiAccessService');
    const result = await createApiAccessKey('Zapier');

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'createApiAccessKeyCallable'
    );
    expect(mockCallable).toHaveBeenCalledWith({ label: 'Zapier' });
    expect(result).toEqual({
      key: {
        keyId: 'key_123',
        label: 'Zapier',
        keyPrefix: 'vvk_abc123',
      },
      rawKey: 'vvk_secret',
    });
  });

  it('lists API keys', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        keys: [{ keyId: 'key_1', label: 'Primary', active: true }],
      },
    });

    const { listApiAccessKeys } = await import('../apiAccessService');
    const result = await listApiAccessKeys();

    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'listApiAccessKeysCallable'
    );
    expect(result).toEqual([
      { keyId: 'key_1', label: 'Primary', active: true },
    ]);
  });

  it('revokes an API key', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        keyId: 'key_2',
        revoked: true,
      },
    });

    const { revokeApiAccessKey } = await import('../apiAccessService');
    const result = await revokeApiAccessKey('key_2');

    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'revokeApiAccessKeyCallable'
    );
    expect(mockCallable).toHaveBeenCalledWith({ keyId: 'key_2' });
    expect(result).toEqual({ keyId: 'key_2', revoked: true });
  });

  it('returns Zapier webhook config', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        webhookUrl: 'https://example.com/zapierMaintenanceWebhook',
        instructions: 'Include x-api-key header',
        requiresSignature: true,
      },
    });

    const { getZapierWebhookConfig } = await import('../apiAccessService');
    const result = await getZapierWebhookConfig();

    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'getZapierWebhookConfigCallable'
    );
    expect(result).toEqual({
      webhookUrl: 'https://example.com/zapierMaintenanceWebhook',
      instructions: 'Include x-api-key header',
      requiresSignature: true,
    });
  });
});
