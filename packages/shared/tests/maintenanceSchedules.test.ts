import { describe, expect, it } from 'vitest';

import {
  calculateNextDue,
  getMaintenanceSchedule,
  getUpcomingMaintenance,
} from '../src/maintenanceSchedules.js';

describe('calculateNextDue', () => {
  it('returns the next unvisited interval multiple above current mileage', () => {
    // Regression for a bug where an extra interval was added on top of the
    // rounded-up multiple, telling users they had a full interval more
    // headroom than they actually did (e.g. reporting 15,000 mi remaining
    // on a 10,000 mi brake interval when only 5,000 mi remained).
    expect(calculateNextDue(25000, 10000)).toBe(30000);
    expect(calculateNextDue(0, 5000)).toBe(5000);
    expect(calculateNextDue(4999, 5000)).toBe(5000);
  });

  it('advances a full interval when currentMileage lands exactly on a multiple', () => {
    expect(calculateNextDue(10000, 10000)).toBe(20000);
  });
});

describe('getUpcomingMaintenance', () => {
  it('reports correct miles-until-due for a known vehicle', () => {
    const items = getUpcomingMaintenance('Toyota', 'Camry', 25000, 50000);
    const brake = items.find(item => item.id === 'brakeInspection');
    expect(brake?.nextDueMileage).toBe(30000);
    expect(brake?.milesUntilDue).toBe(5000);
  });

  it('returns an empty list for an uncovered make/model', () => {
    expect(getMaintenanceSchedule('Tesla', 'Model 3')).toBeNull();
    expect(getUpcomingMaintenance('Tesla', 'Model 3', 25000)).toEqual([]);
  });
});
