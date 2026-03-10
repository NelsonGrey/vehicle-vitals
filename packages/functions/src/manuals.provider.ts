import * as logger from "firebase-functions/logger";

export interface OwnerManualDocument {
  id: string;
  title: string;
  language: string;
  format: string;
  url: string;
  publishedYear: number | null;
  source: string;
}

interface DecodedVehicleIdentity {
  vin: string;
  make: string;
  model: string;
  year: number | null;
}

/**
 * Normalize provider string values from VPIC.
 * @param {string | undefined} value Raw source value
 * @return {string} Sanitized string
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
 * Read a specific variable from VPIC results.
 * @param {Array} results VPIC rows
 * @param {string} key Variable name to read
 * @return {string} Sanitized value
 */
function getVal(
  results: Array<{ Variable: string; Value: string }>,
  key: string
): string {
  return sanitize(results.find((r) => r.Variable === key)?.Value);
}

/**
 * Decode VIN into core identity fields.
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
 * Map vehicle make to an official OEM owner-manual portal.
 * @param {string} make Decoded make
 * @return {string} Portal URL
 */
function ownerPortalForMake(make: string): string {
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
  if (
    key.includes("chevrolet") ||
    key.includes("gmc") ||
    key.includes("cadillac") ||
    key.includes("buick")
  ) {
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
export async function lookupOwnerManuals(
  vin: string
): Promise<OwnerManualDocument[]> {
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
