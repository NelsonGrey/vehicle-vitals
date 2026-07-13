import { describe, expect, it } from 'vitest';

import { defaultMaintenanceRecord } from '@vehicle-vitals/shared';

describe('default maintenance record', () => {
  it('includes performed-by and coverage defaults', () => {
    expect(defaultMaintenanceRecord.performedBy).toBe('repair_shop');
    expect(defaultMaintenanceRecord.coverage).toBe('parts_and_labor');
  });
});
