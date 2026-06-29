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
exports.lookupWarrantySummary = lookupWarrantySummary;
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Normalize decoded text values from VPIC.
 * @param {string | undefined} value Raw source value
 * @return {string} Sanitized value
 */
function sanitize(value) {
    const s = (value !== null && value !== void 0 ? value : "").toString().trim();
    if (!s)
        return "";
    const bad = new Set([
        "0",
        "NOT APPLICABLE",
        "NULL",
        "N/A",
        "NONE",
        "UNKNOWN",
    ]);
    return bad.has(s.toUpperCase()) ? "" : s;
}
/**
 * Read a field value from VPIC results.
 * @param {Array} results VPIC rows
 * @param {string} key Variable name
 * @return {string} Sanitized value
 */
function getVal(results, key) {
    var _a;
    return sanitize((_a = results.find((r) => r.Variable === key)) === null || _a === void 0 ? void 0 : _a.Value);
}
/**
 * Decode VIN into a minimal identity object.
 * @param {string} vin Vehicle VIN
 * @return {Promise<DecodedVehicleIdentity>} Decoded identity
 */
async function decodeVinIdentity(vin) {
    const nhtsaUrl = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/" +
        `${encodeURIComponent(vin)}?format=json`;
    const nhtsaResponse = await fetch(nhtsaUrl);
    if (!nhtsaResponse.ok) {
        throw new Error(`NHTSA API error: ${nhtsaResponse.status}`);
    }
    const data = await nhtsaResponse.json();
    const results = (data === null || data === void 0 ? void 0 : data.Results) || [];
    const yearRaw = getVal(results, "Model Year");
    const parsedYear = Number(yearRaw);
    return {
        vin: vin.toUpperCase(),
        make: getVal(results, "Make"),
        model: getVal(results, "Model"),
        year: Number.isFinite(parsedYear) ? parsedYear : null,
    };
}
/**
 * Add years to a date.
 * @param {Date} date Base date
 * @param {number} years Years to add
 * @return {Date} Shifted date
 */
function yearsFromNow(date, years) {
    const out = new Date(date);
    out.setFullYear(out.getFullYear() + years);
    return out;
}
/**
 * Format a date as YYYY-MM-DD.
 * @param {Date} d Date value
 * @return {string} ISO date string
 */
function toIsoDate(d) {
    return d.toISOString().split("T")[0];
}
/**
 * Estimate in-service date from model year.
 * @param {number | null} year Model year
 * @return {Date} Estimated in-service date
 */
function resolveInServiceDate(year) {
    const now = new Date();
    const fallback = new Date(now.getFullYear() - 3, 0, 1);
    if (!year)
        return fallback;
    return new Date(year, 0, 1);
}
/**
 * Determine whether any warranty coverage is still active.
 * @param {WarrantyCoverage[]} coverages Coverage list
 * @return {"active" | "expired"} Current status
 */
function coverageStatus(coverages) {
    const now = new Date();
    const active = coverages.some((c) => new Date(c.endDate) >= now);
    return active ? "active" : "expired";
}
/**
 * Calculate remaining coverage mileage.
 * @param {number} maxMileage Coverage cap
 * @param {number | undefined} currentMileage Vehicle mileage
 * @return {number | null} Remaining miles or null when unknown
 */
function remainingMileage(maxMileage, currentMileage) {
    if (!Number.isFinite(currentMileage))
        return null;
    return Math.max(0, maxMileage - Number(currentMileage));
}
/**
 * Return a normalized warranty summary for a VIN.
 * @param {string} vin Vehicle VIN
 * @param {number | undefined} currentMileage Current mileage
 * @return {Promise<WarrantySummary>} Warranty summary
 */
async function lookupWarrantySummary(vin, currentMileage) {
    const identity = await decodeVinIdentity(vin);
    const inService = resolveInServiceDate(identity.year);
    const basicEnd = yearsFromNow(inService, 3);
    const powertrainEnd = yearsFromNow(inService, 5);
    const corrosionEnd = yearsFromNow(inService, 5);
    const coverages = [
        {
            type: "basic",
            startDate: toIsoDate(inService),
            endDate: toIsoDate(basicEnd),
            maxMileage: 36000,
            remainingMileage: remainingMileage(36000, currentMileage),
        },
        {
            type: "powertrain",
            startDate: toIsoDate(inService),
            endDate: toIsoDate(powertrainEnd),
            maxMileage: 60000,
            remainingMileage: remainingMileage(60000, currentMileage),
        },
        {
            type: "corrosion",
            startDate: toIsoDate(inService),
            endDate: toIsoDate(corrosionEnd),
            maxMileage: 100000,
            remainingMileage: remainingMileage(100000, currentMileage),
        },
    ];
    logger.info("Warranty summary generated", {
        vinPrefix: identity.vin.substring(0, 8),
        make: identity.make,
        model: identity.model,
        year: identity.year,
    });
    return {
        status: coverageStatus(coverages),
        asOf: toIsoDate(new Date()),
        coverages,
        source: "warranty_heuristic_v1",
        notes: "Estimated warranty coverage from model year and generic OEM ranges. " +
            "Replace with OEM/dealer provider integration " +
            "for authoritative coverage.",
    };
}
//# sourceMappingURL=warranty.provider.js.map