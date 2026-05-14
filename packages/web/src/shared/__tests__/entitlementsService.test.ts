import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCallable = vi.fn();
const mockHttpsCallable = vi.fn(() => mockCallable);

vi.mock('../firebaseConfig', () => ({
  functions: { __testFunctions: true },
}));

vi.mock('../firebaseLegacy', () => ({
  getLegacyFirebase: vi.fn(),
  getOrInitializeLegacyFirebaseApp: vi.fn(),
  hasLegacyFirebaseModules: vi.fn(() => false),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => mockHttpsCallable(...args),
}));

describe('entitlementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns enterprise bootstrap payload', async () => {
    const expected = {
      orgId: 'personal_user-1',
      entitlements: {
        orgId: 'personal_user-1',
        tier: 'free',
        vehicleLimit: 2,
        features: {
          vehicle_limit: true,
        },
      },
    };

    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        ...expected,
      },
    });

    const { bootstrapEnterpriseContext } = await import('../entitlementsService');
    const result = await bootstrapEnterpriseContext();

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'bootstrapEnterpriseContextCallable'
    );
    expect(result).toEqual(expected);
  });

  it('returns effective entitlements', async () => {
    const expectedEntitlements = {
      orgId: 'personal_user-2',
      tier: 'premium',
      vehicleLimit: 25,
      features: {
        ad_free: true,
      },
    };

    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        entitlements: expectedEntitlements,
      },
    });

    const { getEffectiveEntitlements } = await import('../entitlementsService');
    const result = await getEffectiveEntitlements('personal_user-2');

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'getEffectiveEntitlementsCallable'
    );
    expect(mockCallable).toHaveBeenCalledWith({ orgId: 'personal_user-2' });
    expect(result).toEqual(expectedEntitlements);
  });

  it('throws when bootstrap response indicates failure', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: false,
      },
    });

    const { bootstrapEnterpriseContext } = await import('../entitlementsService');

    await expect(bootstrapEnterpriseContext()).rejects.toThrow(
      'Failed to bootstrap enterprise context'
    );
  });

  it('throws when entitlements payload is missing', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });

    const { getEffectiveEntitlements } = await import('../entitlementsService');

    await expect(getEffectiveEntitlements()).rejects.toThrow(
      'Failed to resolve effective entitlements'
    );
  });
});
