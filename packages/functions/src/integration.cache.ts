import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface CacheReadResult<T> {
  hit: boolean;
  value: T | null;
}

/**
 * Parse a boolean environment variable.
 * @param {string} name Environment variable name.
 * @param {boolean} defaultValue Fallback value when unset/invalid.
 * @return {boolean} Parsed boolean value.
 */
function boolFromEnv(name: string, defaultValue: boolean): boolean {
  const raw = (process.env[name] || "").trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Parse a numeric environment variable.
 * @param {string} name Environment variable name.
 * @param {number} defaultValue Fallback value when unset/invalid.
 * @return {number} Parsed positive number.
 */
function numberFromEnv(name: string, defaultValue: number): number {
  const parsed = Number(process.env[name] || "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

/**
 * Determine whether integration caching is enabled.
 * @return {boolean} True when cache reads/writes should run.
 */
function isCacheEnabled(): boolean {
  return boolFromEnv("INTEGRATION_CACHE_ENABLED", false);
}

/**
 * Resolve cache TTL from environment.
 * @return {number} Cache TTL in milliseconds.
 */
function cacheTtlMs(): number {
  return numberFromEnv("INTEGRATION_CACHE_TTL_MS", 24 * 60 * 60 * 1000);
}

/**
 * Build Firestore doc reference for integration cache entry.
 * @param {string} uid User id.
 * @param {string} vin Vehicle VIN.
 * @param {string} key Integration key (manuals/warranty/etc).
 * @return {FirebaseFirestore.DocumentReference} Cache document reference.
 */
function cacheDocRef(uid: string, vin: string, key: string) {
  return admin
    .firestore()
    .doc(`users/${uid}/vehicles/${vin}/integrations/${key}/current`);
}

/**
 * Read an integration response from cache.
 * @param {string} uid User id.
 * @param {string} vin Vehicle VIN.
 * @param {string} key Integration key.
 * @return {Promise<CacheReadResult<T>>} Cache hit status and value.
 */
export async function readIntegrationCache<T>(
  uid: string,
  vin: string,
  key: string
): Promise<CacheReadResult<T>> {
  if (!isCacheEnabled()) {
    return {hit: false, value: null};
  }

  try {
    const snap = await cacheDocRef(uid, vin, key).get();
    if (!snap.exists) {
      return {hit: false, value: null};
    }

    const data = snap.data() || {};
    const expiresAt = data.expiresAt;
    const expiresAtMs =
      expiresAt && typeof expiresAt.toMillis === "function" ?
        expiresAt.toMillis() :
        0;

    if (!expiresAtMs || expiresAtMs <= Date.now()) {
      return {hit: false, value: null};
    }

    return {
      hit: true,
      value: (data.value as T) ?? null,
    };
  } catch (error) {
    logger.warn("Integration cache read failed; proceeding without cache", {
      key,
      vinPrefix: vin.substring(0, 8),
      error,
    });
    return {hit: false, value: null};
  }
}

/**
 * Write an integration response to cache.
 * @param {string} uid User id.
 * @param {string} vin Vehicle VIN.
 * @param {string} key Integration key.
 * @param {T} value Value to store.
 * @return {Promise<void>} Resolves when write attempt completes.
 */
export async function writeIntegrationCache<T>(
  uid: string,
  vin: string,
  key: string,
  value: T
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const nowMs = Date.now();
    await cacheDocRef(uid, vin, key).set(
      {
        value,
        retrievedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(nowMs + cacheTtlMs()),
      },
      {merge: true}
    );
  } catch (error) {
    logger.warn("Integration cache write failed; proceeding without cache", {
      key,
      vinPrefix: vin.substring(0, 8),
      error,
    });
  }
}
