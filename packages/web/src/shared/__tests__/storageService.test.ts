import { describe, expect, it } from 'vitest';

import { buildVehicleStorageBasePath } from '../storageService';

describe('storageService path helpers', () => {
  it('uses user-scoped vehicle storage by default', () => {
    expect(
      buildVehicleStorageBasePath(
        {
          userId: 'user-123',
          orgId: null,
          garageStorageMode: 'user_scoped',
        },
        'VIN001'
      )
    ).toBe('users/user-123/vehicles/VIN001');
  });

  it('uses org-scoped vehicle storage when household mode is enabled', () => {
    expect(
      buildVehicleStorageBasePath(
        {
          userId: 'user-123',
          orgId: 'org-456',
          garageStorageMode: 'org_scoped',
        },
        'VIN001'
      )
    ).toBe('orgs/org-456/vehicles/VIN001');
  });

  it('treats dual_write as org-scoped for primary storage paths', () => {
    expect(
      buildVehicleStorageBasePath(
        {
          userId: 'user-123',
          orgId: 'org-456',
          garageStorageMode: 'dual_write',
        },
        'VIN001'
      )
    ).toBe('orgs/org-456/vehicles/VIN001');
  });

  it('keeps preferences storage user-scoped even in org mode', () => {
    expect(
      buildVehicleStorageBasePath(
        {
          userId: 'user-123',
          orgId: 'org-456',
          garageStorageMode: 'org_scoped',
        },
        'preferences'
      )
    ).toBe('users/user-123/vehicles/preferences');
  });
});
