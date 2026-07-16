import { computeVehicleHealthSnapshot } from '@vehicle-vitals/shared';

/**
 * Reads the server-precomputed vehicle health snapshot when it exists and
 * is fresh relative to the vehicle's current mileage/maintenance-entry
 * count (see packages/functions/src/vehicleHealth.provider.ts, the
 * Firestore trigger that writes it), falling back to computing locally —
 * the same computation the trigger itself runs, just executed client-side
 * — when the snapshot is missing, stale, or malformed.
 *
 * This keeps the client resilient in three cases: a brand-new vehicle
 * whose first trigger run hasn't landed yet, an offline edit that hasn't
 * synced, and (deliberately) any bug in the server-side computation —
 * a snapshot that fails to parse or doesn't match the expected version
 * degrades to today's always-worked local computation rather than
 * showing wrong or missing data.
 */

type VehicleHealthSnapshot = ReturnType<typeof computeVehicleHealthSnapshot>;

interface SnapshotSourceVehicle {
  mileage?: string | number;
  vehicleHealthSnapshot?: unknown;
}

function isFreshSnapshot(
  raw: unknown,
  versionKey: string
): raw is VehicleHealthSnapshot & { computedFromVersion: string } {
  if (!raw || typeof raw !== 'object') return false;
  const candidate = raw as { computedFromVersion?: unknown; components?: unknown };
  return (
    candidate.computedFromVersion === versionKey &&
    Array.isArray(candidate.components)
  );
}

export function resolveVehicleHealthSnapshot(
  vehicle: SnapshotSourceVehicle & Parameters<typeof computeVehicleHealthSnapshot>[0],
  maintenanceEntries: Parameters<typeof computeVehicleHealthSnapshot>[1]
): VehicleHealthSnapshot {
  const versionKey = `${vehicle?.mileage ?? 0}:${(maintenanceEntries || []).length}`;

  if (isFreshSnapshot(vehicle?.vehicleHealthSnapshot, versionKey)) {
    return vehicle.vehicleHealthSnapshot;
  }

  return computeVehicleHealthSnapshot(vehicle, maintenanceEntries);
}
