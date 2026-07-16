import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

// Precomputes the vehicle health forecast server-side so web and mobile
// stop maintaining two independently hand-ported copies of the same
// scoring algorithm (packages/shared/src/vehicleHealth.js for web,
// packages/mobile/lib/models/vehicle_health.dart for mobile) — this
// session's own audit found real drift between them (a double-counted
// overdue penalty, differing false-positive service-detection logic,
// mismatched date rounding). Both client copies stay in place as an
// explicit offline/loading fallback (see the plan this implements); this
// module is the new source of truth once a fresh snapshot exists.
//
// Reuses packages/shared/src/vehicleHealth.js's computeVehicleHealthSnapshot
// directly (via the vendored copy, dynamically imported — see
// scripts/vendor-shared.js and quota.provider.ts's sibling pattern) rather
// than re-porting the algorithm a third time.

interface RawMaintenanceEntry {
  id: string;
  title?: string;
  notes?: string;
  serviceType?: string;
  description?: string;
  date?: string | null;
  mileage?: number | string | null;
}

/**
 * Coerces a Firestore field that may be a Timestamp, an ISO string, or
 * absent into either an ISO string or null. Maintenance entries store
 * `date` as a plain string on both platforms today, but this defends
 * against a Timestamp slipping in from some other write path.
 * @param {unknown} value Raw Firestore field value.
 * @return {string | null} ISO date string, or null if unusable.
 */
function coerceDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as admin.firestore.Timestamp).toDate().toISOString();
  }
  return null;
}

/**
 * Loads and normalizes every maintenance entry for a vehicle into the
 * shape computeVehicleHealthSnapshot expects.
 * @param {FirebaseFirestore.DocumentReference} vehicleRef Vehicle doc ref.
 * @return {Promise<RawMaintenanceEntry[]>} Normalized maintenance entries.
 */
async function loadMaintenanceEntries(
  vehicleRef: FirebaseFirestore.DocumentReference
): Promise<RawMaintenanceEntry[]> {
  const snap = await vehicleRef.collection("maintenance").get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      notes: data.notes,
      serviceType: data.serviceType,
      description: data.description,
      date: coerceDate(data.date),
      mileage: data.mileage ?? null,
    };
  });
}

/**
 * A cheap version key derived from the inputs that actually affect the
 * forecast (current mileage, how many maintenance entries exist). Writing
 * the computed snapshot back onto the vehicle doc would otherwise
 * retrigger this same onDocumentWritten handler indefinitely — comparing
 * against the previous snapshot's version short-circuits that after one
 * harmless no-op retrigger instead of looping.
 * @param {unknown} mileage Vehicle's current mileage field.
 * @param {number} entryCount Number of maintenance entries.
 * @return {string} Opaque version key.
 */
function buildVersionKey(mileage: unknown, entryCount: number): string {
  return `${mileage ?? 0}:${entryCount}`;
}

/**
 * Recomputes and writes vehicleHealthSnapshot onto a vehicle doc, unless
 * the relevant inputs haven't actually changed since the last write.
 * Exported (not just used internally by the triggers below) so it can be
 * tested directly against the Firestore emulator without having to fake
 * Firestore's v2 CloudEvent/DocumentSnapshot wrapper types.
 * @param {FirebaseFirestore.DocumentReference} vehicleRef Vehicle doc ref.
 * @return {Promise<void>}
 */
export async function recomputeAndWrite(
  vehicleRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  const vehicleSnap = await vehicleRef.get();
  if (!vehicleSnap.exists) return;
  const vehicleData = vehicleSnap.data() || {};

  const entries = await loadMaintenanceEntries(vehicleRef);
  const versionKey = buildVersionKey(vehicleData.mileage, entries.length);
  const existingSnapshot = vehicleData.vehicleHealthSnapshot as
    | { computedFromVersion?: string }
    | undefined;

  if (existingSnapshot?.computedFromVersion === versionKey) {
    return;
  }

  const { computeVehicleHealthSnapshot } = await import(
    "@vehicle-vitals/shared/vehicleHealth"
  );
  const snapshot = computeVehicleHealthSnapshot(
    {
      vin: vehicleData.vin,
      mileage: vehicleData.mileage,
      purchaseDate: vehicleData.purchaseDate,
    },
    entries
  );

  // computeVehicleHealthSnapshot legitimately returns `undefined` for
  // fields like a component's anchorRecordId when there's no matching
  // maintenance entry (the common case for sparse/no service history) —
  // the client SDK silently omits undefined fields on write, but the
  // Admin SDK rejects them outright. Round-tripping through JSON drops
  // undefined properties the same way the client SDK does.
  const sanitizedSnapshot = JSON.parse(JSON.stringify(snapshot));

  await vehicleRef.set(
    {
      vehicleHealthSnapshot: {
        ...sanitizedSnapshot,
        computedFromVersion: versionKey,
        computedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  logger.info("Vehicle health snapshot recomputed", {
    path: vehicleRef.path,
    overallHealthScore: snapshot.overallHealthScore,
    versionKey,
  });
}

export const onUserVehicleHealthInputsChanged = onDocumentWritten(
  "users/{userId}/vehicles/{vin}",
  async (event) => {
    if (!event.data?.after.exists) return;
    await recomputeAndWrite(event.data.after.ref);
  }
);

export const onUserVehicleMaintenanceChanged = onDocumentWritten(
  "users/{userId}/vehicles/{vin}/maintenance/{entryId}",
  async (event) => {
    const vehicleRef =
      event.data?.after.ref.parent.parent ||
      event.data?.before.ref.parent.parent;
    if (!vehicleRef) return;
    await recomputeAndWrite(vehicleRef);
  }
);

export const onOrgVehicleHealthInputsChanged = onDocumentWritten(
  "orgs/{orgId}/vehicles/{vin}",
  async (event) => {
    if (!event.data?.after.exists) return;
    await recomputeAndWrite(event.data.after.ref);
  }
);

export const onOrgVehicleMaintenanceChanged = onDocumentWritten(
  "orgs/{orgId}/vehicles/{vin}/maintenance/{entryId}",
  async (event) => {
    const vehicleRef =
      event.data?.after.ref.parent.parent ||
      event.data?.before.ref.parent.parent;
    if (!vehicleRef) return;
    await recomputeAndWrite(vehicleRef);
  }
);

/**
 * Explicit force-recompute escape hatch (support/debug tooling) — normal
 * clients never need to call this, since the triggers above keep the
 * snapshot current automatically.
 */
export const getVehicleHealthSnapshotCallable = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Missing auth context");
  }

  const { vin, orgId } = (request.data as {
    vin?: string;
    orgId?: string;
  }) ?? {};
  const normalizedVin = (vin || "").trim();
  if (!normalizedVin) {
    throw new HttpsError("invalid-argument", "vin is required");
  }

  const db = admin.firestore();
  const vehicleRef = orgId
    ? db.doc(`orgs/${orgId}/vehicles/${normalizedVin}`)
    : db.doc(`users/${uid}/vehicles/${normalizedVin}`);

  await recomputeAndWrite(vehicleRef);
  const snap = await vehicleRef.get();
  return { success: true, vehicleHealthSnapshot: snap.data()?.vehicleHealthSnapshot ?? null };
});
