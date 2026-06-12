"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readIntegrationCache = readIntegrationCache;
exports.writeIntegrationCache = writeIntegrationCache;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Parse a boolean environment variable.
 * @param {string} name Environment variable name.
 * @param {boolean} defaultValue Fallback value when unset/invalid.
 * @return {boolean} Parsed boolean value.
 */
function boolFromEnv(name, defaultValue) {
    const raw = (process.env[name] || "").trim().toLowerCase();
    if (!raw)
        return defaultValue;
    return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
/**
 * Parse a numeric environment variable.
 * @param {string} name Environment variable name.
 * @param {number} defaultValue Fallback value when unset/invalid.
 * @return {number} Parsed positive number.
 */
function numberFromEnv(name, defaultValue) {
    const parsed = Number(process.env[name] || "");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}
/**
 * Determine whether integration caching is enabled.
 * @return {boolean} True when cache reads/writes should run.
 */
function isCacheEnabled() {
    return boolFromEnv("INTEGRATION_CACHE_ENABLED", false);
}
/**
 * Resolve cache TTL from environment.
 * @return {number} Cache TTL in milliseconds.
 */
function cacheTtlMs() {
    return numberFromEnv("INTEGRATION_CACHE_TTL_MS", 24 * 60 * 60 * 1000);
}
/**
 * Build Firestore doc reference for integration cache entry.
 * @param {string} uid User id.
 * @param {string} vin Vehicle VIN.
 * @param {string} key Integration key (manuals/warranty/etc).
 * @return {FirebaseFirestore.DocumentReference} Cache document reference.
 */
function cacheDocRef(uid, vin, key) {
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
async function readIntegrationCache(uid, vin, key) {
    var _a;
    if (!isCacheEnabled()) {
        return { hit: false, value: null };
    }
    try {
        const snap = await cacheDocRef(uid, vin, key).get();
        if (!snap.exists) {
            return { hit: false, value: null };
        }
        const data = snap.data() || {};
        const expiresAt = data.expiresAt;
        const expiresAtMs = expiresAt && typeof expiresAt.toMillis === "function" ?
            expiresAt.toMillis() :
            0;
        if (!expiresAtMs || expiresAtMs <= Date.now()) {
            return { hit: false, value: null };
        }
        return {
            hit: true,
            value: (_a = data.value) !== null && _a !== void 0 ? _a : null,
        };
    }
    catch (error) {
        logger.warn("Integration cache read failed; proceeding without cache", {
            key,
            vinPrefix: vin.substring(0, 8),
            error,
        });
        return { hit: false, value: null };
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
async function writeIntegrationCache(uid, vin, key, value) {
    if (!isCacheEnabled()) {
        return;
    }
    try {
        const nowMs = Date.now();
        await cacheDocRef(uid, vin, key).set({
            value,
            retrievedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromMillis(nowMs + cacheTtlMs()),
        }, { merge: true });
    }
    catch (error) {
        logger.warn("Integration cache write failed; proceeding without cache", {
            key,
            vinPrefix: vin.substring(0, 8),
            error,
        });
    }
}
//# sourceMappingURL=integration.cache.js.map