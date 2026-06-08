import {Request, Response} from "express";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface RateState {
  count: number;
  windowStartMs: number;
}

const rateStateByKey = new Map<string, RateState>();

/**
 * Parse a boolean environment variable.
 * @param {string} name Environment variable name
 * @param {boolean} defaultValue Fallback value
 * @return {boolean} Parsed boolean
 */
function boolFromEnv(name: string, defaultValue: boolean): boolean {
  const raw = (process.env[name] || "").trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Parse a numeric environment variable.
 * @param {string} name Environment variable name
 * @param {number} defaultValue Fallback value
 * @return {number} Parsed number
 */
function numberFromEnv(name: string, defaultValue: number): number {
  const parsed = Number(process.env[name] || "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

/**
 * Resolve request client IP, honoring forwarding headers.
 * @param {Request} request Express request
 * @return {string} Client IP string
 */
function getClientIp(request: Request): string {
  const forwarded = (request.headers["x-forwarded-for"] || "").toString();
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (request.ip || "unknown").toString();
}

/**
 * Enforce fixed-window rate limiting for integration endpoints.
 * @param {Request} request Express request
 * @param {Response} response Express response
 * @param {string} endpoint Endpoint key for independent limits
 * @return {boolean} True when request is allowed
 */
export function enforceRateLimit(
  request: Request,
  response: Response,
  endpoint: string
): boolean {
  const enabled = boolFromEnv("INTEGRATION_RATE_LIMIT_ENABLED", true);
  if (!enabled) return true;

  const maxRequests = numberFromEnv("INTEGRATION_RATE_LIMIT_MAX", 60);
  const windowMs = numberFromEnv("INTEGRATION_RATE_LIMIT_WINDOW_MS", 60000);

  const now = Date.now();
  const clientIp = getClientIp(request);
  const key = `${endpoint}|${clientIp}`;
  const current = rateStateByKey.get(key);

  if (!current || now - current.windowStartMs >= windowMs) {
    rateStateByKey.set(key, {count: 1, windowStartMs: now});
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
export async function requireAuthenticatedUser(
  request: Request,
  response: Response
): Promise<string | null> {
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
  } catch (error) {
    logger.warn("Auth token verification failed", {error});
    response.status(401).json({
      success: false,
      error: "Invalid auth token",
    });
    return null;
  }
}
