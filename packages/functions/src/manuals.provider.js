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
exports.lookupOwnerManuals = lookupOwnerManuals;
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Normalize provider string values from VPIC.
 * @param {string | undefined} value Raw source value
 * @return {string} Sanitized string
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
 * Read a specific variable from VPIC results.
 * @param {Array} results VPIC rows
 * @param {string} key Variable name to read
 * @return {string} Sanitized value
 */
function getVal(results, key) {
    var _a;
    return sanitize((_a = results.find((r) => r.Variable === key)) === null || _a === void 0 ? void 0 : _a.Value);
}
/**
 * Decode VIN into core identity fields.
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
 * Map vehicle make to an official OEM owner-manual portal.
 * @param {string} make Decoded make
 * @return {string} Portal URL
 */
function ownerPortalForMake(make) {
    const key = make.toLowerCase();
    if (key.includes("toyota") || key.includes("lexus")) {
        return "https://www.toyota.com/owners/warranty-owners-manuals/";
    }
    if (key.includes("honda") || key.includes("acura")) {
        return "https://owners.honda.com/vehicle-information/information/owner-manuals";
    }
    if (key.includes("ford") || key.includes("lincoln")) {
        return "https://www.ford.com/support/owner-manuals/";
    }
    if (key.includes("chevrolet") ||
        key.includes("gmc") ||
        key.includes("cadillac") ||
        key.includes("buick")) {
        return "https://www.gm.com/owners";
    }
    if (key.includes("nissan") || key.includes("infiniti")) {
        return "https://owners.nissanusa.com/nowners/navigation/manualsGuide";
    }
    if (key.includes("bmw") || key.includes("mini")) {
        return "https://www.bmwusa.com/owners-manuals.html";
    }
    return "https://www.nhtsa.gov/vehicle";
}
/**
 * Resolve owner manual links for a VIN.
 * @param {string} vin Vehicle VIN
 * @return {Promise<OwnerManualDocument[]>} Owner manual links
 */
async function lookupOwnerManuals(vin) {
    const identity = await decodeVinIdentity(vin);
    const make = identity.make || "Vehicle";
    const model = identity.model || "";
    const yearLabel = identity.year ? `${identity.year} ` : "";
    const titleModel = `${yearLabel}${make} ${model}`.trim();
    const portalUrl = ownerPortalForMake(make);
    logger.info("Owner manual lookup resolved vehicle identity", {
        vinPrefix: identity.vin.substring(0, 8),
        make: identity.make,
        model: identity.model,
        year: identity.year,
    });
    return [
        {
            id: `${identity.vin}-owner-manual-portal`,
            title: `${titleModel} Owner Manual Portal`,
            language: "en",
            format: "url",
            url: portalUrl,
            publishedYear: identity.year,
            source: "oem_portal",
        },
    ];
}
//# sourceMappingURL=manuals.provider.js.map