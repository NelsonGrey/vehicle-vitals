import { describe, expect, it } from 'vitest';
import { resolveVehicleHealthSnapshot } from '../vehicleHealthSnapshot';

describe('resolveVehicleHealthSnapshot', () => {
  it('uses the server snapshot when it matches the current mileage/entry-count version', () => {
    const serverSnapshot = {
      vin: 'VIN1',
      computedFromVersion: '50000:2',
      components: [{ componentId: 'oil_change' }],
      overallHealthScore: 42, // a value only the "server" snapshot has
    };
    const vehicle = { vin: 'VIN1', mileage: '50000', vehicleHealthSnapshot: serverSnapshot };
    const entries = [{ id: 'a' }, { id: 'b' }];

    const result = resolveVehicleHealthSnapshot(vehicle, entries);
    expect(result).toBe(serverSnapshot);
  });

  it('falls back to local computation when the snapshot is missing', () => {
    const vehicle = { vin: 'VIN2', mileage: '10000' };
    const result = resolveVehicleHealthSnapshot(vehicle, []);
    expect(result.vin).toBe('VIN2');
    expect(Array.isArray(result.components)).toBe(true);
  });

  it('falls back to local computation when the snapshot is stale (mileage changed since it was computed)', () => {
    const staleSnapshot = {
      vin: 'VIN3',
      computedFromVersion: '10000:0', // mileage was 10000 when computed
      components: [],
      overallHealthScore: 999, // implausible sentinel to prove it was NOT used
    };
    const vehicle = { vin: 'VIN3', mileage: '55000', vehicleHealthSnapshot: staleSnapshot };
    const result = resolveVehicleHealthSnapshot(vehicle, []);
    expect(result.overallHealthScore).not.toBe(999);
  });

  it('falls back to local computation when the snapshot is malformed', () => {
    const vehicle = {
      vin: 'VIN4',
      mileage: '20000',
      vehicleHealthSnapshot: { computedFromVersion: '20000:0' /* no components array */ },
    };
    const result = resolveVehicleHealthSnapshot(vehicle, []);
    expect(Array.isArray(result.components)).toBe(true);
  });
});
