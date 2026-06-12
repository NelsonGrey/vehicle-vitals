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
exports.enforceRateLimit = enforceRateLimit;
exports.requireAuthenticatedUser = requireAuthenticatedUser;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const rateStateByKey = new Map();
function normalizeIpCandidate(value) {
    return String(value || "")
        .trim()
        .replace(/^\[(.*)\]$/, "$1")
        .replace(/:\d+$/, "");
}
function isTrustedProxyAddress(ip) {
    return /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip) ||
        /^10\./.test(ip) ||
        /^192\.168\./.test(ip) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
        /^fc00:/i.test(ip) ||
        /^fd/i.test(ip);
}
/**
 * Parse a boolean environment variable.
 * @param {string} name Environment variable name
 * @param {boolean} defaultValue Fallback value
 * @return {boolean} Parsed boolean
 */
function boolFromEnv(name, defaultValue) {
    const raw = (process.env[name] || "").trim().toLowerCase();
    if (!raw)
        return defaultValue;
    return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
/**
 * Parse a numeric environment variable.
 * @param {string} name Environment variable name
 * @param {number} defaultValue Fallback value
 * @return {number} Parsed number
 */
function numberFromEnv(name, defaultValue) {
    const parsed = Number(process.env[name] || "");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}
/**
 * Resolve request client IP, honoring forwarding headers.
 * @param {Request} request Express request
 * @return {string} Client IP string
 */
function getClientIp(request) {
    const directIp = normalizeIpCandidate(request.ip || "unknown");
    const forwarded = (request.headers["x-forwarded-for"] || "").toString();
    if (forwarded && isTrustedProxyAddress(directIp)) {
        const firstForwarded = normalizeIpCandidate(forwarded.split(",")[0]);
        if (firstForwarded) {
            return firstForwarded;
        }
    }
    return directIp || "unknown";
}
/**
 * Enforce fixed-window rate limiting for integration endpoints.
 * @param {Request} request Express request
 * @param {Response} response Express response
 * @param {string} endpoint Endpoint key for independent limits
 * @return {boolean} True when request is allowed
 */
function enforceRateLimit(request, response, endpoint) {
    const enabled = boolFromEnv("INTEGRATION_RATE_LIMIT_ENABLED", true);
    if (!enabled)
        return true;
    const maxRequests = numberFromEnv("INTEGRATION_RATE_LIMIT_MAX", 60);
    const windowMs = numberFromEnv("INTEGRATION_RATE_LIMIT_WINDOW_MS", 60000);
    const now = Date.now();
    const clientIp = getClientIp(request);
    const key = `${endpoint}|${clientIp}`;
    const current = rateStateByKey.get(key);
    if (!current || now - current.windowStartMs >= windowMs) {
        rateStateByKey.set(key, { count: 1, windowStartMs: now });
        return true;
    }
    if (current.count >= maxRequests) {
        logger.warn("Rate limit exceeded", {
            endpoint,
            clientIp,
            maxRequests,
            windowMs,
        });
        response.status(429).json({
            success: false,
            error: "Rate limit exceeded",
            retryAfterMs: windowMs - (now - current.windowStartMs),
        });
        return false;
    }
    current.count += 1;
    rateStateByKey.set(key, current);
    return true;
}
/**
 * Require a valid Firebase ID token by default for integration endpoints.
 * @param {Request} request Express request
 * @param {Response} response Express response
 * @return {Promise<string | null>} Authenticated user id or null when rejected
 */
async function requireAuthenticatedUser(request, response) {
    const required = boolFromEnv("INTEGRATION_AUTH_REQUIRED", true);
    if (!required) {
        return "auth-not-required";
    }
    const authHeader = (request.headers.authorization || "").toString().trim();
    const bearerPrefix = "bearer ";
    if (authHeader.toLowerCase().indexOf(bearerPrefix) !== 0) {
        response.status(401).json({
            success: false,
            error: "Missing Bearer token",
        });
        return null;
    }
    const token = authHeader.slice(bearerPrefix.length).trim();
    if (!token) {
        response.status(401).json({
            success: false,
            error: "Missing Bearer token",
        });
        return null;
    }
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded.uid;
    }
    catch (error) {
        logger.warn("Auth token verification failed", { error });
        response.status(401).json({
            success: false,
            error: "Invalid auth token",
        });
        return null;
    }
}
//# sourceMappingURL=request.guards.js.map