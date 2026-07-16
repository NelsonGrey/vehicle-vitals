import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCallable = vi.fn();
const mockHttpsCallable = vi.fn((...args: unknown[]) => {
  void args;
  return mockCallable;
});

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
      orgType: 'personal',
      garageStorageMode: 'user_scoped',
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

    const { bootstrapEnterpriseContext } = await import(
      '../entitlementsService'
    );
    const result = await bootstrapEnterpriseContext();

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'bootstrapEnterpriseContextCallable'
    );
    expect(result).toEqual(expected);
  });

  it('promotes a personal garage to household mode', async () => {
    const expected = {
      orgId: 'personal_user-1',
      orgType: 'household',
      garageStorageMode: 'dual_write',
      entitlements: {
        orgId: 'personal_user-1',
        tier: 'premium',
        vehicleLimit: 25,
        features: {
          cloud_sync: true,
        },
      },
    };

    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        ...expected,
      },
    });

    const { promotePersonalGarageToHousehold } = await import(
      '../entitlementsService'
    );
    const result = await promotePersonalGarageToHousehold(
      'Nelson Household',
      'dual_write'
    );

    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'promotePersonalGarageToHouseholdCallable'
    );
    expect(mockCallable).toHaveBeenCalledWith({
      householdName: 'Nelson Household',
      garageStorageMode: 'dual_write',
    });
    expect(result).toEqual(expected);
  });

  it('updates garage storage mode', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        orgId: 'personal_user-1',
        garageStorageMode: 'org_scoped',
      },
    });

    const { setGarageStorageMode } = await import('../entitlementsService');
    const result = await setGarageStorageMode(
      'org_scoped',
      'personal_user-1'
    );

    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'setGarageStorageModeCallable'
    );
    expect(mockCallable).toHaveBeenCalledWith({
      orgId: 'personal_user-1',
      garageStorageMode: 'org_scoped',
    });
    expect(result).toEqual({
      orgId: 'personal_user-1',
      garageStorageMode: 'org_scoped',
    });
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

    const { bootstrapEnterpriseContext } = await import(
      '../entitlementsService'
    );

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

  it('changes subscription tier and returns updated entitlements', async () => {
    const expectedEntitlements = {
      orgId: 'personal_user-3',
      tier: 'pro',
      vehicleLimit: 10,
      features: {
        calendar_sync: true,
      },
    };

    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        entitlements: expectedEntitlements,
      },
    });

    const { changeSubscriptionTier } = await import('../entitlementsService');
    const result = await changeSubscriptionTier('pro', 'annual');

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'changeSubscriptionTierCallable'
    );
    expect(mockCallable).toHaveBeenCalledWith({
      targetTier: 'pro',
      billingPeriod: 'annual',
    });
    expect(result).toEqual(expectedEntitlements);
  });

  it('creates checkout session payload for paid plan', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        success: true,
        mode: 'redirect',
        checkoutUrl: 'https://checkout.example/session/cs_test',
        checkoutSessionId: 'cs_test',
      },
    });

    const { createSubscriptionCheckoutSession } = await import(
      '../entitlementsService'
    );
    const result = await createSubscriptionCheckoutSession('premium', 'annual');

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockHttpsCallable.mock.calls[0][1]).toBe(
      'createSubscriptionCheckoutSessionCallable'
    );
    expect(mockCallable).toHaveBeenCalledWith({
      targetTier: 'premium',
      billingPeriod: 'annual',
    });
    expect(result).toEqual({
      mode: 'redirect',
      checkoutUrl: 'https://checkout.example/session/cs_test',
      checkoutSessionId: 'cs_test',
      tier: '',
      entitlements: undefined,
    });
  });
});
