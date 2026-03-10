import * as logger from "firebase-functions/logger";

export interface WarrantyCoverage {
  type: string;
  startDate: string;
  endDate: string;
  maxMileage: number;
  remainingMileage: number | null;
}

export interface WarrantySummary {
  status: "active" | "expired" | "unknown";
  asOf: string;
  coverages: WarrantyCoverage[];
  source: string;
  notes: string;
}

interface DecodedVehicleIdentity {
  vin: string;
  make: string;
  model: string;
  year: number | null;
}

/**
 * Normalize decoded text values from VPIC.
 * @param {string | undefined} value Raw source value
 * @return {string} Sanitized value
 */
function sanitize(value: string | undefined): string {
  const s = (value ?? "").toString().trim();
  if (!s) return "";
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
function getVal(
  results: Array<{ Variable: string; Value: string }>,
  key: string
): string {
  return sanitize(results.find((r) => r.Variable === key)?.Value);
}

/**
 * Decode VIN into a minimal identity object.
 * @param {string} vin Vehicle VIN
 * @return {Promise<DecodedVehicleIdentity>} Decoded identity
 */
async function decodeVinIdentity(vin: string): Promise<DecodedVehicleIdentity> {
  const nhtsaUrl =
    "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/" +
    `${encodeURIComponent(vin)}?format=json`;
  const nhtsaResponse = await fetch(nhtsaUrl);

  if (!nhtsaResponse.ok) {
    throw new Error(`NHTSA API error: ${nhtsaResponse.status}`);
  }

  const data = await nhtsaResponse.json();
  const results = data?.Results || [];
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
function yearsFromNow(date: Date, years: number): Date {
  const out = new Date(date);
  out.setFullYear(out.getFullYear() + years);
  return out;
}

/**
 * Format a date as YYYY-MM-DD.
 * @param {Date} d Date value
 * @return {string} ISO date string
 */
function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Estimate in-service date from model year.
 * @param {number | null} year Model year
 * @return {Date} Estimated in-service date
 */
function resolveInServiceDate(year: number | null): Date {
  const now = new Date();
  const fallback = new Date(now.getFullYear() - 3, 0, 1);
  if (!year) return fallback;
  return new Date(year, 0, 1);
}

/**
 * Determine whether any warranty coverage is still active.
 * @param {WarrantyCoverage[]} coverages Coverage list
 * @return {"active" | "expired"} Current status
 */
function coverageStatus(coverages: WarrantyCoverage[]): "active" | "expired" {
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
function remainingMileage(
  maxMileage: number,
  currentMileage?: number
): number | null {
  if (!Number.isFinite(currentMileage)) return null;
  return Math.max(0, maxMileage - Number(currentMileage));
}

/**
 * Return a normalized warranty summary for a VIN.
 * @param {string} vin Vehicle VIN
 * @param {number | undefined} currentMileage Current mileage
 * @return {Promise<WarrantySummary>} Warranty summary
 */
export async function lookupWarrantySummary(
  vin: string,
  currentMileage?: number
): Promise<WarrantySummary> {
  const identity = await decodeVinIdentity(vin);
  const inService = resolveInServiceDate(identity.year);
  const basicEnd = yearsFromNow(inService, 3);
  const powertrainEnd = yearsFromNow(inService, 5);
  const corrosionEnd = yearsFromNow(inService, 5);

  const coverages: WarrantyCoverage[] = [
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
    notes:
      "Estimated warranty coverage from model year and generic OEM ranges. " +
      "Replace with OEM/dealer provider integration " +
      "for authoritative coverage.",
  };
}
