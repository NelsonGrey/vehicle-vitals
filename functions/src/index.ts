/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

setGlobalOptions({maxInstances: 10});

// VIN decoding function
export const decodeVIN = onRequest({cors: true}, async (request, response) => {
  try {
    // Only allow POST requests
    if (request.method !== "POST") {
      response.status(405).json({error: "Method not allowed"});
      return;
    }

    const {vin} = request.body;

    if (!vin || typeof vin !== "string" || vin.length !== 17) {
      response.status(400).json({error: "Valid 17-character VIN required"});
      return;
    }

    logger.info(`Decoding VIN: ${vin.substring(0, 8)}...`);

    // Call NHTSA VPIC API
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(vin)}?format=json`;
    const nhtsaResponse = await fetch(nhtsaUrl);

    if (!nhtsaResponse.ok) {
      throw new Error(`NHTSA API error: ${nhtsaResponse.status}`);
    }

    const data = await nhtsaResponse.json();
    const results = data?.Results || [];

    // Extract relevant vehicle information
    const sanitize = (value: string | undefined) => {
      const s = (value ?? "").toString().trim();
      if (!s) return "";
      const bad = new Set([
        "0", "NOT APPLICABLE", "NULL", "N/A", "NONE", "UNKNOWN",
      ]);
      return bad.has(s.toUpperCase()) ? "" : s;
    };

    const getVal = (key: string) =>
      sanitize(results.find((r: { Variable: string; Value: string }) =>
        r.Variable === key)?.Value);

    const vehicle = {
      vin: vin.toUpperCase(),
      make: getVal("Make"),
      model: getVal("Model"),
      year: getVal("Model Year"),
      bodyClass: getVal("Body Class"),
      engineType: getVal("Engine Type"),
      fuelType: getVal("Fuel Type - Primary"),
      driveType: getVal("Drive Type"),
      transmissionStyle: getVal("Transmission Style"),
      trim: getVal("Trim"),
      vehicleType: getVal("Vehicle Type"),
    };

    const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    logger.info(`Successfully decoded VIN for ${vehicleDesc}`);

    response.json({
      success: true,
      vehicle,
    });
  } catch (error) {
    logger.error("VIN decoding error:", error);
    response.status(500).json({
      success: false,
      error: "Failed to decode VIN",
    });
  }
});
