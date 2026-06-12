import { describe, expect, it } from 'vitest';

import {
  computeVehicleHealthSnapshot,
  inferHealthComponentIds,
} from '../src/vehicleHealth.js';

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
