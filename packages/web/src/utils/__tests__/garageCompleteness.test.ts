import { describe, expect, it } from 'vitest';
import {
  computeGarageCompleteness,
  computeVehiclePortfolioProgress,
} from '../garageCompleteness';

function vehicle(items: Array<{ required?: boolean; status?: string }>) {
  return {
    vin: 'VIN1',
    documentPortfolio: { categories: [{ items }] },
  };
}

describe('computeVehiclePortfolioProgress', () => {
  it('counts required/optional items and their ready status separately', () => {
    const progress = computeVehiclePortfolioProgress(
      vehicle([
        { required: true, status: 'ready' },
        { required: true, status: 'missing' },
        { required: false, status: 'ready' },
        { required: false, status: 'missing' },
      ])
    );

    expect(progress).toEqual({
      required: 2,
      complete: 1,
      optionalTotal: 2,
      optionalComplete: 1,
      hasAnyProgress: true,
    });
  });

  it('reports hasAnyProgress false when every item is missing', () => {
    const progress = computeVehiclePortfolioProgress(
      vehicle([
        { required: true, status: 'missing' },
        { required: false, status: 'missing' },
      ])
    );
    expect(progress.hasAnyProgress).toBe(false);
  });

  it('handles a vehicle with no portfolio at all', () => {
    const progress = computeVehiclePortfolioProgress({ vin: 'VIN2' });
    expect(progress).toEqual({
      required: 0,
      complete: 0,
      optionalTotal: 0,
      optionalComplete: 0,
      hasAnyProgress: false,
    });
  });
});

describe('computeGarageCompleteness', () => {
  it('aggregates required-item completeness across vehicles into a percentage and tier', () => {
    const vehicles = [
      vehicle([
        { required: true, status: 'ready' },
        { required: true, status: 'ready' },
      ]),
      vehicle([
        { required: true, status: 'ready' },
        { required: true, status: 'missing' },
      ]),
    ];

    const result = computeGarageCompleteness(vehicles);

    expect(result.requiredTotal).toBe(4);
    expect(result.requiredComplete).toBe(3);
    expect(result.completenessPercent).toBe(75);
    expect(result.vehiclesTracked).toBe(2);
    expect(result.vehiclesFullyComplete).toBe(1);
    expect(result.tier).toBe('pro');
  });

  it('counts a vehicle with no progress at all as not started', () => {
    const vehicles = [
      vehicle([{ required: true, status: 'missing' }]),
    ];
    const result = computeGarageCompleteness(vehicles);
    expect(result.vehiclesNotStarted).toBe(1);
  });
});
