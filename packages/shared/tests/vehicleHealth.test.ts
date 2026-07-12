import { describe, expect, it } from 'vitest';

import {
  computeVehicleHealthSnapshot,
  countOccurrencesInWindow,
  inferHealthComponentIds,
} from '../src/vehicleHealth.js';

describe('countOccurrencesInWindow', () => {
  it('counts multiple recurrences of oil (180-day interval) within a 36-month window', () => {
    // Regression: 12/36-month spend forecasts previously counted a
    // recurring item's cost only once per window, undercounting oil (which
    // recurs roughly every 6 months) by ~6x over 36 months.
    const occurrences = countOccurrencesInWindow({
      remainingDays: 10,
      intervalDays: 180,
      remainingMiles: undefined,
      intervalMiles: undefined,
      horizonDays: 1080, // 36 months
      horizonMiles: 32400,
    });
    expect(occurrences).toBe(6);
  });

  it('counts exactly one occurrence for an item due once near the edge of the window', () => {
    const occurrences = countOccurrencesInWindow({
      remainingDays: 1000,
      intervalDays: 1095,
      remainingMiles: undefined,
      intervalMiles: undefined,
      horizonDays: 1080,
      horizonMiles: 32400,
    });
    expect(occurrences).toBe(1);
  });

  it('returns zero when nothing is due within the window on either clock', () => {
    const occurrences = countOccurrencesInWindow({
      remainingDays: 2000,
      intervalDays: 1460,
      remainingMiles: 60000,
      intervalMiles: 50000,
      horizonDays: 1080,
      horizonMiles: 32400,
    });
    expect(occurrences).toBe(0);
  });

  it('takes the larger of the days-based and miles-based occurrence counts', () => {
    const occurrences = countOccurrencesInWindow({
      remainingDays: 900, // 1 occurrence within a 1080-day window
      intervalDays: 1460,
      remainingMiles: 100, // many occurrences within a 6000-mile window
      intervalMiles: 1000,
      horizonDays: 1080,
      horizonMiles: 6000,
    });
    expect(occurrences).toBe(6);
  });
});

describe('inferHealthComponentIds', () => {
  it('maps common service text to forecast components', () => {
    expect(
      inferHealthComponentIds({
        title: 'Oil and filter change',
        description: 'Synthetic oil service',
      })
    ).toContain('oil_change');

    expect(
      inferHealthComponentIds({
        title: 'Installed new tires and rotated tires',
      })
    ).toEqual(expect.arrayContaining(['tire_replacement', 'tire_rotation']));
  });

  it('matches tire replacement without an unbounded bidirectional regex', () => {
    expect(
      inferHealthComponentIds({
        title: 'Tires mounted after alignment',
      })
    ).toContain('tire_replacement');
  });

  it('does not treat a brake inspection with no work performed as a completed brake service', () => {
    // Regression: a bare "brake" mention was resetting the brake-wear
    // forecast to "just serviced" even when no work was actually done —
    // a safety-relevant false reassurance.
    expect(
      inferHealthComponentIds({
        title: 'Brake noise inspection, no work performed',
      })
    ).not.toContain('brake_service');
  });

  it('does not treat a battery check as a completed battery replacement', () => {
    expect(
      inferHealthComponentIds({
        notes: 'Checked battery terminals, still good',
      })
    ).not.toContain('battery_replacement');
  });

  it('does not treat an oil level check as a completed oil change', () => {
    expect(
      inferHealthComponentIds({
        notes: 'Checked oil level, still fine',
      })
    ).not.toContain('oil_change');
  });

  it('still matches real brake, battery, and oil service work', () => {
    expect(
      inferHealthComponentIds({ title: 'Brake pad replacement' })
    ).toContain('brake_service');
    expect(
      inferHealthComponentIds({ title: 'Battery replacement' })
    ).toContain('battery_replacement');
    expect(inferHealthComponentIds({ title: 'Oil change' })).toContain(
      'oil_change'
    );
  });
});

describe('computeVehicleHealthSnapshot', () => {
  const vehicle = {
    vin: 'VIN001',
    mileage: '55100',
    purchaseDate: '2024-01-10',
  };

  it('builds a high-confidence forecast from recorded service history', () => {
    const snapshot = computeVehicleHealthSnapshot(
      vehicle,
      [
        {
          id: 'm1',
          title: 'Oil change',
          date: '2026-01-10',
          mileage: '52000',
        },
        {
          id: 'm2',
          title: 'Tire rotation',
          date: '2026-02-12',
          mileage: '53000',
        },
        {
          id: 'm3',
          title: 'Battery replacement',
          date: '2025-08-01',
          mileage: '47000',
        },
      ],
      { now: new Date('2026-06-12T00:00:00Z') }
    );

    expect(snapshot.overallHealthScore).toBeGreaterThan(0);
    expect(snapshot.components[0]).toHaveProperty('label');
    expect(snapshot.components.find(item => item.componentId === 'oil_change'))
      .toMatchObject({
        confidenceBand: 'high',
        status: 'service_soon',
      });
    expect(snapshot.accuracyTip).toMatch(
      /keep mileage and service entries current/i
    );
  });

  it('scores a severely overdue vehicle lower than a moderately overdue one, instead of the same floor', () => {
    // Regression: overdue components were penalized twice — once by
    // zeroing their contribution to the score average, and again by a flat
    // per-item subtraction — which bottomed every heavily-neglected
    // vehicle out at the same floor score regardless of how overdue it
    // actually was. A vehicle 200 days overdue on an oil change and one
    // 2000 days overdue should not score identically.
    const now = new Date('2026-06-12T00:00:00Z');
    const daysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString();
    };
    const vehicle = { vin: 'VIN010', mileage: '0', purchaseDate: '2020-01-01' };
    const goodEntries = [
      { id: 'g1', title: 'Tire rotation', date: daysAgo(5) },
      { id: 'g2', title: 'Tires replaced', date: daysAgo(5) },
      { id: 'g3', title: 'Brake pad replacement', date: daysAgo(5) },
      { id: 'g4', title: 'Battery replacement', date: daysAgo(5) },
      { id: 'g5', title: 'Wiper blade replacement', date: daysAgo(5) },
    ];

    const moderatelyOverdue = computeVehicleHealthSnapshot(
      vehicle,
      [...goodEntries, { id: 'oil', title: 'Oil change', date: daysAgo(200) }],
      { now }
    );
    const severelyOverdue = computeVehicleHealthSnapshot(
      vehicle,
      [...goodEntries, { id: 'oil', title: 'Oil change', date: daysAgo(2000) }],
      { now }
    );

    const moderateOil = moderatelyOverdue.components.find(
      c => c.componentId === 'oil_change'
    );
    const severeOil = severelyOverdue.components.find(
      c => c.componentId === 'oil_change'
    );
    expect(moderateOil?.status).toBe('overdue');
    expect(severeOil?.status).toBe('overdue');

    expect(severelyOverdue.overallHealthScore).toBeLessThan(
      moderatelyOverdue.overallHealthScore
    );
  });

  it('falls back to baseline assumptions when no service history exists', () => {
    const snapshot = computeVehicleHealthSnapshot(
      {
        vin: 'VIN002',
        mileage: '30100',
        purchaseDate: '2025-01-10',
      },
      [],
      { now: new Date('2026-06-12T00:00:00Z') }
    );

    expect(snapshot.missingServiceHistory).toBe(true);
    expect(snapshot.lowConfidenceCount).toBeGreaterThan(0);
    expect(snapshot.accuracyTip).toMatch(/add your recent oil, tire, brake/i);
    expect(snapshot.components.every(item => item.confidenceBand !== 'high')).toBe(
      true
    );
  });
});
